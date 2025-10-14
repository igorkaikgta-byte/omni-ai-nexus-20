# Backend - Omni AI Nexo (Sienge + OpenAI)

This backend is a minimal FastAPI service that demonstrates:
- Authenticating with the Sienge API (placeholder endpoints)
- Detecting user intent via OpenAI
- Calling appropriate Sienge endpoints and returning JSON

## How to use

1. Copy `.env.example` to `.env` and fill in:
   - `SIENGE_BASE_URL`, `SIENGE_USER`, `SIENGE_PASS`
   - `OPENAI_API_KEY`

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. Open API docs:
   http://127.0.0.1:8000/docs

## Notes & Next steps

- The Sienge endpoints and auth flow may differ by installation. Update `sienge_api.py` to match real endpoints.
- Improve intent parsing or use a structured approach (OpenAI function-calling or tools).
- Add caching, rate-limiting and secure storage for API credentials.
