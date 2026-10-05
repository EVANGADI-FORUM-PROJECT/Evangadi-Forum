# Milestone 2 — User Task Status

Implemented and wired:

## T-11 — Semantic Search Questions

`GET /api/questions/search`

- Validates `query`, `k`, and `threshold`.
- Generates a Gemini embedding with `RETRIEVAL_QUERY`.
- Reads only `question_vectors` rows with `status = 'ready'`.
- Calculates cosine similarity in application code.
- Filters by threshold, sorts descending, and returns the top `k` results.
- Hydrates matching question, author, and answer-count data.

## T-11 — Find Similar Questions

`GET /api/questions/:questionHash/similar`

- Validates the 16-character lowercase hexadecimal `questionHash`.
- Resolves the source question and its ready embedding.
- Compares it with all other ready question embeddings.
- Explicitly excludes the source question.
- Filters, sorts, limits, and hydrates the results.

## T-17 — AI Question Draft Coach

`POST /api/questions/draft-coach`

- Validates the required draft content and optional title.
- Sends the draft to Gemini as a programming-forum coaching prompt.
- Requests JSON output containing feedback and actionable suggestions.
- Parses JSON responses with a text fallback when needed.
- Returns `feedback`, `suggestions`, and `tips` in `data`.

## Important setup

The ZIP deliberately does **not** include `.env` or `node_modules`.

Copy `.env.example` to `.env` and set:

- `DB_USER`
- `DB_PASS`
- `DB_HOST`
- `DB_NAME`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_EMBEDDING_MODEL`
- `GEMINI_TEXT_MODEL`

The project already contains a `package-lock.json`, so install dependencies with:

```bash
npm ci
```

Then start the backend:

```bash
npm run dev
```

The three protected endpoints require a valid Bearer token from the existing authentication flow.

## Postman examples

Semantic search:

```http
GET http://localhost:3777/api/questions/search?query=how%20to%20connect%20react&k=5&threshold=0.75
Authorization: Bearer <JWT>
```

Similar questions:

```http
GET http://localhost:3777/api/questions/a1b2c3d4e5f67890/similar?k=5&threshold=0.75
Authorization: Bearer <JWT>
```

Draft coach:

```http
POST http://localhost:3777/api/questions/draft-coach
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "title": "React login returns 401",
  "content": "My React app sends the login request, but the API returns 401. I am using JWT authentication. What should I check?"
}
```
