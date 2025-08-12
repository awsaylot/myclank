package api

import (
	"net/http"
	"strings"

	"neural-mcp/internal"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	config *internal.Config
	logger *internal.Logger
}

func NewAuthHandler(config *internal.Config, logger *internal.Logger) *AuthHandler {
	return &AuthHandler{
		config: config,
		logger: logger,
	}
}

// OptionalAuth middleware - only enforces auth if REQUIRE_AUTH is true
func (h *AuthHandler) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// If auth is not required, continue
		if !h.config.RequireAuth {
			c.Next()
			return
		}

		// If auth is required but no API key is set, warn and continue
		if h.config.APIKey == "" {
			h.logger.Warn("Authentication required but no API key configured")
			c.Next()
			return
		}

		// Check for API key in header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			h.logger.WithRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP()).
				Warn("Missing Authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
				"code":  "MISSING_AUTH_HEADER",
			})
			c.Abort()
			return
		}

		// Parse Bearer token
		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			h.logger.WithRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP()).
				Warn("Invalid Authorization header format")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid Authorization header format. Expected: Bearer <token>",
				"code":  "INVALID_AUTH_FORMAT",
			})
			c.Abort()
			return
		}

		// Validate API key
		providedKey := tokenParts[1]
		if providedKey != h.config.APIKey {
			h.logger.WithRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP()).
				Warn("Invalid API key provided")
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid API key",
				"code":  "INVALID_API_KEY",
			})
			c.Abort()
			return
		}

		h.logger.WithRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP()).
			Debug("Authentication successful")

		c.Next()
	}
}

// RequiredAuth middleware - always enforces authentication
func (h *AuthHandler) RequiredAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if h.config.APIKey == "" {
			h.logger.Error("API key not configured but authentication required")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Server configuration error",
				"code":  "CONFIG_ERROR",
			})
			c.Abort()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
				"code":  "MISSING_AUTH_HEADER",
			})
			c.Abort()
			return
		}

		tokenParts := strings.SplitN(authHeader, " ", 2)
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid Authorization header format",
				"code":  "INVALID_AUTH_FORMAT",
			})
			c.Abort()
			return
		}

		if tokenParts[1] != h.config.APIKey {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid API key",
				"code":  "INVALID_API_KEY",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetAuthInfo extracts authentication info from context
func (h *AuthHandler) GetAuthInfo(c *gin.Context) map[string]interface{} {
	return map[string]interface{}{
		"authenticated": h.config.RequireAuth,
		"client_ip":     c.ClientIP(),
		"user_agent":    c.GetHeader("User-Agent"),
	}
}
