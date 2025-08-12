package internal

import (
	"os"

	"github.com/sirupsen/logrus"
)

type Logger struct {
	*logrus.Logger
}

func NewLogger() *Logger {
	logger := logrus.New()

	// Set output format
	logger.SetFormatter(&logrus.TextFormatter{
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05",
		ForceColors:     true,
		DisableQuote:    true,
	})

	// Set log level based on environment
	env := os.Getenv("ENVIRONMENT")
	if env == "production" {
		logger.SetLevel(logrus.InfoLevel)
		logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z",
		})
	} else {
		logger.SetLevel(logrus.DebugLevel)
	}

	// Set output destination
	if logFile := os.Getenv("LOG_FILE"); logFile != "" {
		file, err := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			logger.SetOutput(file)
		} else {
			logger.Warnf("Failed to open log file %s, using stdout: %v", logFile, err)
		}
	}

	return &Logger{Logger: logger}
}

// Convenience methods for structured logging

func (l *Logger) WithRequest(method, path, clientIP string) *logrus.Entry {
	return l.WithFields(logrus.Fields{
		"method":    method,
		"path":      path,
		"client_ip": clientIP,
	})
}

func (l *Logger) WithLLM(model, endpoint string) *logrus.Entry {
	return l.WithFields(logrus.Fields{
		"model":    model,
		"endpoint": endpoint,
	})
}

func (l *Logger) WithError(err error) *logrus.Entry {
	return l.WithFields(logrus.Fields{
		"error": err.Error(),
	})
}

func (l *Logger) WithChat(messageID, role string, tokenCount int) *logrus.Entry {
	return l.WithFields(logrus.Fields{
		"message_id":  messageID,
		"role":        role,
		"token_count": tokenCount,
	})
}
