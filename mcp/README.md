# Neural MCP Server

A Go-based Model Context Protocol (MCP) server that acts as a conduit between your Next.js frontend and local LLM instance. Built with industry best practices and designed for extensibility.

## Features

- **OpenAI-Compatible API**: Fully compatible with OpenAI's chat completion API
- **WebSocket Support**: Real-time chat capabilities for your frontend
- **Health Monitoring**: Built-in health checks and status endpoints
- **Flexible Authentication**: Optional API key authentication
- **CORS Support**: Properly configured for frontend integration
- **Structured Logging**: Comprehensive logging with request tracing
- **Graceful Shutdown**: Proper resource cleanup on termination

## Architecture

```
┌─────────────────┐    HTTP        ┌─────────────────┐    HTTP     ┌─────────────────┐
│  Next.js        │   ◄──────────► │  Neural MCP     │  ◄────────► │  Local LLM      │
│  Frontend       │                │  Server (Go)    │             │  (llama.cpp)    │
│  :3000          │                │  :3001          │             │  :8080          │
└─────────────────┘                └─────────────────┘             └─────────────────┘
```

## Quick Start

### Prerequisites

- Go 1.21 or higher
- Your local LLM running (llama.cpp server on port 8080)
- Node.js and Next.js frontend (already provided)

### Installation

1. **Make sure your LLM server is running on port 8080:**
   ```bash
   # Your LLM should be accessible like this:
   curl -X POST http://0.0.0.0:8080/v1/chat/completions \
     -H "Content-Type: application/json" \
     -d '{"model":"CodeLlama-7b-Instruct-hf.Q6_K.gguf","messages":[{"role":"user","content":"Hello"}],"max_tokens":128}'
   ```

2. **Setup the Go backend:**
   ```bash
   cd mcp
   cp .env.example .env
   go mod tidy
   ```

3. **Start the MCP server (on port 3001):**
   ```bash
   go run cmd/main.go
   ```

4. **Start your frontend (on port 3000):**
   ```bash
   cd ../neural-interface
   npm install
   npm run dev
   ```

Your beautiful neural interface will now work perfectly! 🚀

### Endpoints

#### REST API
- `GET /health` - Health check endpoint
- `GET /status` - Detailed status information
- `POST /v1/chat/completions` - OpenAI-compatible chat completions
- `GET /v1/chat/ws` - WebSocket connection for real-time chat

#### MCP Protocol (Future)
- `GET /mcp/capabilities` - MCP capabilities endpoint

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `ENVIRONMENT` | `development` | Environment mode |
| `LLM_ENDPOINT` | `http://localhost:8081` | Your LLM server URL |
| `MODEL_NAME` | `CodeLlama-7b-Instruct-hf.Q6_K.gguf` | Model identifier |
| `MAX_TOKENS` | `2048` | Maximum tokens per request |
| `TEMPERATURE` | `0.7` | LLM temperature setting |
| `REQUEST_TIMEOUT` | `30` | Request timeout in seconds |
| `API_KEY` | `` | Optional API key for authentication |
| `REQUIRE_AUTH` | `false` | Whether to require authentication |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |
| `LOG_LEVEL` | `info` | Logging level |

### LLM Server Setup

This server expects your LLM to be running on port 8080 with llama.cpp server in OpenAI-compatible mode:

```bash
# Example llama.cpp server startup (your current setup)
./server -m your-model.gguf -c 4096 --port 8080 --host 0.0.0.0

# Test it works:
curl -X POST http://0.0.0.0:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"CodeLlama-7b-Instruct-hf.Q6_K.gguf","messages":[{"role":"user","content":"Hello"}],"max_tokens":128}'
```

## API Usage

### Chat Completion Example

```bash
# Via your Neural MCP server (port 3001)
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "CodeLlama-7b-Instruct-hf.Q6_K.gguf",
    "messages": [
      {"role": "user", "content": "Hello, how are you?"}
    ],
    "max_tokens": 128
  }'
```

### WebSocket Example

```javascript
const ws = new WebSocket('ws://localhost:3001/v1/chat/ws');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send a chat message
ws.send(JSON.stringify({
  type: 'chat',
  content: 'Hello, AI!',
  timestamp: new Date()
}));
```

## Development

### Project Structure

```
mcp/
├── cmd/
│   └── main.go              # Application entry point
├── internal/
│   ├── config.go            # Configuration management
│   ├── logger.go            # Structured logging
│   └── api/
│       ├── auth.go          # Authentication handlers
│       └── webchat.go       # Chat API handlers
├── .env.example             # Environment template
├── go.mod                   # Go module definition
└── README.md               # This file
```

### Adding New Features

1. **New API endpoints**: Add handlers in `internal/api/`
2. **Configuration options**: Update `internal/config.go`
3. **Middleware**: Create new middleware in `internal/api/`
4. **Database integration**: Add new files in `internal/` (future Neo4j support)

### Logging

The server uses structured logging with automatic request correlation:

```go
// Example logging in handlers
h.logger.WithRequest(c.Request.Method, c.Request.URL.Path, c.ClientIP()).
  WithChat(messageID, "user", tokenCount).
  Info("Processing chat request")
```

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Human readable error message",
    "type": "error_type",
    "code": "specific_error_code"
  }
}
```

## Production Deployment

1. **Build the binary:**
   ```bash
   go build -o neural-mcp cmd/main.go
   ```

2. **Set production environment:**
   ```bash
   export ENVIRONMENT=production
   export LOG_LEVEL=warn
   ```

3. **Use process manager:**
   ```bash
   # Example with systemd, PM2, or Docker
   ./neural-mcp
   ```

## Frontend Integration

Your Next.js frontend is already configured to work with this backend. The frontend will automatically:

- Connect to `http://localhost:8080` for API calls
- Use the `/v1/chat/completions` endpoint for chat
- Handle connection status and errors gracefully
- Display responses in the neural interface theme

## Troubleshooting

### Common Issues

1. **LLM Connection Failed**
   - Verify your LLM server is running on the configured port
   - Check `LLM_ENDPOINT` in your `.env` file
   - Test with: `curl http://localhost:8081/health`

2. **CORS Errors**
   - Update `ALLOWED_ORIGINS` in `.env`
   - Ensure frontend and backend ports match expectations

3. **Authentication Issues**
   - Set `REQUIRE_AUTH=false` for development
   - Check API key configuration if auth is enabled

### Logs

Monitor the server logs for detailed information:

```bash
# Development
go run cmd/main.go

# Production with file logging
LOG_FILE=neural-mcp.log go run cmd/main.go
```

## Next Steps

1. **Neo4j Integration**: Add graph database support for advanced context management
2. **MCP Protocol**: Implement full MCP specification
3. **Streaming Responses**: Add server-sent events for streaming completions
4. **Rate Limiting**: Add request rate limiting and quotas
5. **Metrics**: Add Prometheus metrics for monitoring

## Contributing

1. Follow Go best practices and conventions
2. Add tests for new functionality
3. Update documentation for new features
4. Use structured logging for all operations

## License

This project is part of your neural interface system.