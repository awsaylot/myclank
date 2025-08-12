package internal

import (
	"os"
	"strconv"
)

type Config struct {
	// Server configuration
	Port        string
	Environment string

	// LLM configuration
	LLMEndpoint    string
	ModelName      string
	MaxTokens      int
	Temperature    float64
	RequestTimeout int // seconds

	// Security
	APIKey         string
	RequireAuth    bool
	AllowedOrigins []string

	// Logging
	LogLevel string
	LogFile  string
}

func LoadConfig() *Config {
	config := &Config{
		// Default values
		Port:           getEnv("PORT", "3001"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		LLMEndpoint:    getEnv("LLM_ENDPOINT", "http://0.0.0.0:8080"),
		ModelName:      getEnv("MODEL_NAME", "CodeLlama-7b-Instruct-hf.Q6_K.gguf"),
		MaxTokens:      getEnvAsInt("MAX_TOKENS", 2048),
		Temperature:    getEnvAsFloat("TEMPERATURE", 0.7),
		RequestTimeout: getEnvAsInt("REQUEST_TIMEOUT", 30),
		APIKey:         getEnv("API_KEY", ""),
		RequireAuth:    getEnvAsBool("REQUIRE_AUTH", false),
		LogLevel:       getEnv("LOG_LEVEL", "info"),
		LogFile:        getEnv("LOG_FILE", ""),
	}

	// Parse allowed origins
	if origins := getEnv("ALLOWED_ORIGINS", ""); origins != "" {
		// Simple comma-separated parsing
		config.AllowedOrigins = []string{origins}
	} else {
		// Default for development
		config.AllowedOrigins = []string{"http://localhost:3000"}
	}

	return config
}

// Helper functions for environment variable parsing

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func getEnvAsInt(key string, fallback int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return fallback
}

func getEnvAsFloat(key string, fallback float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
			return floatVal
		}
	}
	return fallback
}

func getEnvAsBool(key string, fallback bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return fallback
}

// Validation methods
func (c *Config) Validate() error {
	// Add any configuration validation logic here
	return nil
}
