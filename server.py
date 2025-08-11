from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import logging
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

# =====================
# CONFIGURE LOGGING
# =====================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =====================
# GLOBALS
# =====================
model = None
tokenizer = None
executor = ThreadPoolExecutor(max_workers=1)  # Single worker for model inference

# Model configuration
MODEL_ID = "TheBloke/deepseek-coder-6.7B-instruct-AWQ"

# =====================
# REQUEST/RESPONSE MODELS
# =====================
class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Input prompt for the model")
    max_new_tokens: int = Field(default=50, ge=1, le=512, description="Maximum tokens to generate")
    temperature: float = Field(default=0.7, ge=0.1, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.9, ge=0.1, le=1.0, description="Top-p sampling parameter")
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
    gpu_memory_gb: Optional[float] = None

# =====================
# MODEL LOADING
# =====================
def load_model():
    """Load the AWQ quantized model"""
    global model, tokenizer
    
    try:
        logger.info(f"Loading tokenizer for {MODEL_ID}...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
        
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        if torch.cuda.is_available():
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.benchmark = True
            device = torch.device("cuda")
            logger.info(f"Using device: {torch.cuda.get_device_name(device)} with CUDA {torch.version.cuda}")
            logger.info(f"GPU memory: {torch.cuda.get_device_properties(device).total_memory / 1024**3:.1f} GB")
            
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                device_map={"": device},  # Force load to GPU
                torch_dtype=torch.float16,
                trust_remote_code=True,
                low_cpu_mem_usage=True
            ).eval()
        else:
            logger.warning("CUDA not available, loading on CPU")
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                trust_remote_code=True,
            ).eval()
        
        logger.info(f"Model loaded successfully on device: {model.device}")
        
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise

# =====================
# TEXT GENERATION
# =====================
def generate_text_sync(prompt: str, max_new_tokens: int, temperature: float, top_p: float, do_sample: bool):
    """Synchronous text generation function to run in thread pool"""
    if model is None or tokenizer is None:
        raise ValueError("Model not loaded")
    
    try:
        inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True, max_length=512)
        device = next(model.parameters()).device
        inputs = {k: v.to(device, dtype=torch.long) for k, v in inputs.items()}
        
        prompt_tokens = inputs['input_ids'].shape[1]
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=min(max_new_tokens, 100),
                temperature=temperature,
                top_p=top_p,
                do_sample=do_sample,
                pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id,
                repetition_penalty=1.1,
                length_penalty=1.0,
            )
        
        generated_tokens = outputs[0][prompt_tokens:]
        generated_text = tokenizer.decode(generated_tokens, skip_special_tokens=True)
        
        return {
            "generated_text": generated_text.strip(),
            "prompt_tokens": prompt_tokens,
            "generated_tokens": len(generated_tokens),
            "total_tokens": prompt_tokens + len(generated_tokens)
        }
    
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise

# =====================
# LIFESPAN MANAGEMENT
# =====================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting up LLM server...")
    load_model()
    logger.info("Startup complete!")
    
    yield
    
    # Shutdown (optional cleanup)
    logger.info("Shutting down server...")
    executor.shutdown(wait=True)

# =====================
# FASTAPI APP CONFIG
# =====================
app = FastAPI(
    title="Local LLM API Server",
    description="FastAPI server for DeepSeek Coder model with quantization",
    version="1.0.0",
    lifespan=lifespan  # Use the lifespan context manager
)

# Add CORS middleware for your Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# ROUTES
# =====================
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    gpu_memory = None
    if torch.cuda.is_available():
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
    
    return HealthResponse(
        status="healthy" if model is not None else "model_not_loaded",
        model_loaded=model is not None,
        device=str(next(model.parameters()).device) if model else "unknown",
        cuda_available=torch.cuda.is_available(),
        gpu_memory_gb=gpu_memory
    )

@app.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Generate text from the model"""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
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
        "status": "running",
        "endpoints": {
            "health": "/health",
            "generate": "/generate",
            "docs": "/docs"
        }
    }

# =====================
# MAIN ENTRY POINT
# =====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Don't use reload with heavy models
        log_level="info"
    )