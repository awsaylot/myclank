from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
import torch
import logging
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Local LLM API Server",
    description="FastAPI server for DeepSeek Coder model with quantization",
    version="1.0.0"
)

# Add CORS middleware for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and tokenizer
model = None
tokenizer = None
executor = ThreadPoolExecutor(max_workers=1)  # Single worker for model inference

# Model configuration
MODEL_ID = "TheBloke/deepseek-coder-6.7B-instruct-AWQ"

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Input prompt for the model")
    max_new_tokens: int = Field(default=512, ge=1, le=2048, description="Maximum tokens to generate")
    temperature: float = Field(default=0.2, ge=0.1, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.95, ge=0.1, le=1.0, description="Top-p sampling parameter")
    do_sample: bool = Field(default=True, description="Whether to use sampling")

class GenerateResponse(BaseModel):
    generated_text: str
    prompt_tokens: int
    generated_tokens: int
    total_tokens: int

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    cuda_available: bool

def load_model():
    """Load the model and tokenizer with proper quantization config"""
    global model, tokenizer
    
    try:
        logger.info("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        
        # Add pad token if it doesn't exist
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        logger.info("Configuring quantization...")
        # Proper BitsAndBytesConfig instead of deprecated load_in_4bit
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4"
        )
        
        logger.info("Loading model...")
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            quantization_config=quantization_config,
            device_map="auto",
            torch_dtype=torch.float16,
            trust_remote_code=True,
            low_cpu_mem_usage=True
        )
        
        logger.info(f"Model loaded successfully on device: {model.device}")
        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            logger.info(f"CUDA device: {torch.cuda.get_device_name()}")
            logger.info(f"CUDA memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

def generate_text_sync(prompt: str, max_new_tokens: int, temperature: float, top_p: float, do_sample: bool):
    """Synchronous text generation function to run in thread pool"""
    if model is None or tokenizer is None:
        raise ValueError("Model not loaded")
    
    # Tokenize input
    inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    prompt_tokens = inputs['input_ids'].shape[1]
    
    # Generate
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=do_sample,
            pad_token_id=tokenizer.eos_token_id,
            eos_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.1,
            length_penalty=1.0,
        )
    
    # Decode only the generated part
    generated_tokens = outputs[0][prompt_tokens:]
    generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
    
    return {
        "generated_text": generated_text.strip(),
        "prompt_tokens": prompt_tokens,
        "generated_tokens": len(generated_tokens),
        "total_tokens": prompt_tokens + len(generated_tokens)
    }

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    logger.info("Starting up LLM server...")
    load_model()
    logger.info("Startup complete!")

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if model is not None else "model_not_loaded",
        model_loaded=model is not None,
        device=str(model.device) if model else "unknown",
        cuda_available=torch.cuda.is_available()
    )

@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Generate text from the model"""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        # Run generation in thread pool to avoid blocking
        result = await asyncio.get_event_loop().run_in_executor(
            executor, 
            generate_text_sync,
            req.prompt,
            req.max_new_tokens,
            req.temperature,
            req.top_p,
            req.do_sample
        )
        
        return GenerateResponse(**result)
        
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Local LLM API Server",
        "model": MODEL_ID,
        "endpoints": {
            "health": "/health",
            "generate": "/generate",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",  # Assuming this file is named main.py
        host="0.0.0.0",
        port=8000,
        reload=False,  # Don't use reload with heavy models
        log_level="info"
    )