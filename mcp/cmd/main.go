package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"neural-mcp/internal"
	"neural-mcp/internal/api"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using default values")
	}

	// Initialize logger
	logger := internal.NewLogger()
	logger.Info("Starting Neural MCP Server...")

	// Load configuration
	config := internal.LoadConfig()
	logger.Infof("Server configured on port %s", config.Port)
	logger.Infof("LLM endpoint: %s", config.LLMEndpoint)

	// Initialize Gin router
	if config.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery())

	// Custom logging middleware
	router.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	}))

	// CORS middleware - configured for your frontend
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if config.Environment == "development" {
		corsConfig.AllowOrigins = []string{"*"}
	}

	router.Use(cors.New(corsConfig))

	// Initialize API handlers
	authHandler := api.NewAuthHandler(config, logger)
	chatHandler := api.NewWebChatHandler(config, logger)

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "2.1.0",
			"model":     config.ModelName,
		})
	})

	// Status endpoint for your frontend
	router.GET("/status", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":     "online",
			"model":      config.ModelName,
			"uptime":     time.Since(time.Now()).String(), // You'd track actual uptime
			"llm_health": chatHandler.HealthCheck(),
		})
	})

	// API routes
	v1 := router.Group("/v1")
	{
		// Chat completions endpoint (OpenAI compatible)
		v1.POST("/chat/completions", authHandler.OptionalAuth(), chatHandler.HandleChatCompletion)

		// WebSocket endpoint for real-time chat
		v1.GET("/chat/ws", authHandler.OptionalAuth(), chatHandler.HandleWebSocket)
	}

	// MCP endpoints (for future expansion)
	mcp := router.Group("/mcp")
	{
		// MCP protocol endpoints will go here
		mcp.GET("/capabilities", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"version": "1.0",
				"capabilities": []string{
					"chat",
					"completion",
				},
			})
		})
	}

	// Start server
	srv := &http.Server{
		Addr:         ":" + config.Port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.Infof("🚀 Neural MCP Server starting on port %s", config.Port)
		logger.Infof("🌐 Health check: http://localhost:%s/health", config.Port)
		logger.Infof("💬 Chat endpoint: http://localhost:%s/v1/chat/completions", config.Port)
		logger.Infof("🔗 LLM endpoint: %s", config.LLMEndpoint)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Server is shutting down...")

	// Graceful shutdown with 10 second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown:", err)
	}

	logger.Info("Neural MCP Server exited")
}
