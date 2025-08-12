package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"neural-mcp/internal"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sirupsen/logrus"
)

type WebChatHandler struct {
	config   *internal.Config
	logger   *internal.Logger
	upgrader websocket.Upgrader
}

// OpenAI-compatible request/response structures
type ChatCompletionRequest struct {
	Model       string                 `json:"model"`
	Messages    []ChatMessage          `json:"messages"`
	MaxTokens   int                    `json:"max_tokens,omitempty"`
	Temperature float64                `json:"temperature,omitempty"`
	Stream      bool                   `json:"stream,omitempty"`
	User        string                 `json:"user,omitempty"`
	Extra       map[string]interface{} `json:"-"` // For any additional fields
}

type ChatMessage struct {
	Role    string `json:"role"` // "user", "assistant", "system"
	Content string `json:"content"`
}

type ChatCompletionResponse struct {
	ID                string                 `json:"id"`
	Object            string                 `json:"object"`
	Created           int64                  `json:"created"`
	Model             string                 `json:"model"`
	Choices           []ChatCompletionChoice `json:"choices"`
	Usage             ChatCompletionUsage    `json:"usage"`
	SystemFingerprint string                 `json:"system_fingerprint,omitempty"`
}

type ChatCompletionChoice struct {
	Index        int         `json:"index"`
	Message      ChatMessage `json:"message"`
	FinishReason string      `json:"finish_reason"`
}

type ChatCompletionUsage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

// WebSocket message structures
type WSMessage struct {
	Type      string      `json:"type"`
	Content   string      `json:"content,omitempty"`
	Role      string      `json:"role,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	Data      interface{} `json:"data,omitempty"`
	Error     string      `json:"error,omitempty"`
}

func NewWebChatHandler(config *internal.Config, logger *internal.Logger) *WebChatHandler {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Allow connections from your frontend
			origin := r.Header.Get("Origin")
			for _, allowedOrigin := range config.AllowedOrigins {
				if origin == allowedOrigin || allowedOrigin == "*" {
					return true
				}
			}
			return false
		},
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	return &WebChatHandler{
		config:   config,
		logger:   logger,
		upgrader: upgrader,
	}
}

// HandleChatCompletion processes OpenAI-compatible chat completion requests
func (h *WebChatHandler) HandleChatCompletion(c *gin.Context) {
	var req ChatCompletionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.WithError(err).Warn("Invalid chat completion request")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"message": "Invalid request format",
				"type":    "invalid_request_error",
				"code":    "invalid_json",
			},
		})
		return
	}

	// Validate request
	if len(req.Messages) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"message": "At least one message is required",
				"type":    "invalid_request_error",
				"code":    "missing_messages",
			},
		})
		return
	}

	// Set defaults
	if req.MaxTokens == 0 {
		req.MaxTokens = h.config.MaxTokens
	}
	if req.Temperature == 0 {
		req.Temperature = h.config.Temperature
	}
	if req.Model == "" {
		req.Model = h.config.ModelName
	}

	h.logger.WithFields(logrus.Fields{
		"method":      c.Request.Method,
		"path":        c.Request.URL.Path,
		"client_ip":   c.ClientIP(),
		"message_id":  fmt.Sprintf("req_%d", time.Now().Unix()),
		"role":        "user",
		"token_count": len(req.Messages),
	}).Info("Processing chat completion request")

	// Forward to LLM
	response, err := h.forwardToLLM(req)
	if err != nil {
		h.logger.WithError(err).Error("Failed to get response from LLM")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"message": "LLM service unavailable",
				"type":    "service_unavailable",
				"code":    "llm_error",
			},
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// HandleWebSocket manages WebSocket connections for real-time chat
func (h *WebChatHandler) HandleWebSocket(c *gin.Context) {
	conn, err := h.upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		h.logger.WithError(err).Error("Failed to upgrade WebSocket connection")
		return
	}
	defer conn.Close()

	clientIP := c.ClientIP()
	h.logger.WithRequest("WS", "/v1/chat/ws", clientIP).Info("WebSocket connection established")

	// Send welcome message
	welcomeMsg := WSMessage{
		Type:      "system",
		Content:   "Neural interface connection established. Ready for input.",
		Timestamp: time.Now(),
	}

	if err := conn.WriteJSON(welcomeMsg); err != nil {
		h.logger.WithError(err).Error("Failed to send welcome message")
		return
	}

	// Handle messages
	for {
		var msg WSMessage
		if err := conn.ReadJSON(&msg); err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				h.logger.WithError(err).Error("WebSocket error")
			}
			break
		}

		if msg.Type == "chat" && msg.Content != "" {
			// Process chat message
			req := ChatCompletionRequest{
				Model: h.config.ModelName,
				Messages: []ChatMessage{
					{Role: "user", Content: msg.Content},
				},
				MaxTokens:   h.config.MaxTokens,
				Temperature: h.config.Temperature,
			}

			response, err := h.forwardToLLM(req)
			if err != nil {
				errorMsg := WSMessage{
					Type:      "error",
					Error:     "Failed to process message",
					Timestamp: time.Now(),
				}
				conn.WriteJSON(errorMsg)
				continue
			}

			// Send response back
			responseMsg := WSMessage{
				Type:      "assistant",
				Content:   response.Choices[0].Message.Content,
				Timestamp: time.Now(),
				Data:      response.Usage,
			}

			if err := conn.WriteJSON(responseMsg); err != nil {
				h.logger.WithError(err).Error("Failed to send WebSocket response")
				break
			}
		}
	}

	h.logger.WithRequest("WS", "/v1/chat/ws", clientIP).Info("WebSocket connection closed")
}

// forwardToLLM sends the request to your local LLM
func (h *WebChatHandler) forwardToLLM(req ChatCompletionRequest) (*ChatCompletionResponse, error) {
	// Prepare request to llama.cpp server
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: time.Duration(h.config.RequestTimeout) * time.Second,
	}

	// Make request to LLM
	llmURL := fmt.Sprintf("%s/v1/chat/completions", h.config.LLMEndpoint)

	httpReq, err := http.NewRequest("POST", llmURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	h.logger.WithLLM(req.Model, llmURL).Debug("Forwarding request to LLM")

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to reach LLM: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("LLM returned status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var llmResponse ChatCompletionResponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if err := json.Unmarshal(body, &llmResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	h.logger.WithFields(logrus.Fields{
		"model":       req.Model,
		"endpoint":    llmURL,
		"message_id":  llmResponse.ID,
		"role":        "assistant",
		"token_count": llmResponse.Usage.TotalTokens,
	}).Debug("Received response from LLM")

	return &llmResponse, nil
}

// HealthCheck checks if the LLM service is available
func (h *WebChatHandler) HealthCheck() bool {
	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	// Try to reach the LLM server - it doesn't have a /health endpoint
	// so we'll just try a simple GET request to see if it's responding
	resp, err := client.Get(h.config.LLMEndpoint)
	if err != nil {
		h.logger.WithError(err).Debug("LLM health check failed")
		return false
	}
	defer resp.Body.Close()

	// Any response (even 404) means the server is up
	return resp.StatusCode != 0
}
