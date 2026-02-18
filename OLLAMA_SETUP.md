# Ollama Setup Guide

To use the AI Assistant, you need to have Ollama running locally with the correct configurations.

## 1. Configure CORS
Ollama must allow requests from your browser. Set the `OLLAMA_ORIGINS` environment variable to `*`.

- **Windows (PowerShell)**:
  ```powershell
  $env:OLLAMA_ORIGINS="*"; ollama serve
  ```
- **Windows (Environment Variables)**:
  1. Open "Edit the system environment variables".
  2. Click "Environment Variables".
  3. Add a new User variable: `OLLAMA_ORIGINS` with value `*`.
  4. Restart Ollama.

## 2. Pull the Model
Ensure you have the model specified in your `.env` file pulled. Default is `phi3:mini` (based on your current setup).

```bash
ollama pull phi3:mini
```

## 3. Configuration
In your `.env` file, you can specify which model to use:
```env
VITE_OLLAMA_MODEL=phi3:mini
```
