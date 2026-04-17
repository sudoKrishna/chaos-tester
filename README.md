# ⚡ API Chaos Tester

> Automatically fuzz your API with malformed inputs and surface validation failures.

This dashboard lets you upload or paste an OpenAPI spec, point it at a running API, and execute mutation-based requests to detect broken validation, injection flaws, and server errors.

---

## What it does

- **Type mutations** — sends wrong types such as strings instead of numbers or booleans instead of objects
- **Boundary attacks** — empty values, huge strings, extreme numbers, and oversized arrays
- **Injection probes** — SQL and XSS-style payloads to expose unsanitized responses
- **Missing-field checks** — removes required fields to test validation enforcement
- **Findings classification** — scores issues as Critical / High / Medium / Info
- **Reproducible curl output** — every finding includes a generated curl command

---

## Getting started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### Usage

1. Obtain your API OpenAPI spec (`.json` or `.yaml`).
   - Many servers expose it automatically: FastAPI `/docs`, Swagger UI, etc.
2. Upload the file or paste the spec text into the dashboard.
3. Set the API base URL for your target service.
4. Click **Run scan**.
5. Review the generated report and reproduce issues with curl commands.

---

## How it works

### 1. Parse the spec (`app/lib/parser.ts`)

The app reads the OpenAPI document and builds a `ParsedAPI` object containing:

- base URL
- endpoint paths and methods
- request fields with name, type, format, and required state

### 2. Generate mutations (`app/lib/engine.ts`)

For each field, the engine creates attack vectors such as:

- wrong type values
- null / missing required fields
- oversized strings and arrays
- injection strings

### 3. Run requests (`app/lib/engine.ts`)

Each mutation is executed against the target API using `fetch()`.
Requests are built as JSON bodies or query strings based on the endpoint method.

### 4. Classify findings (`app/lib/engine.ts`)

Responses are analyzed for:

- stack traces and error leaks
- SQL or file path strings
- accepted invalid input
- server errors and slow responses

---

## File structure to know

- `app/page.tsx` — main dashboard UI
- `app/api/upload/route.ts` — upload or paste OpenAPI spec
- `app/api/run/route.ts` — execute scan and save report
- `app/api/report/route.ts` — read stored report
- `app/lib/parser.ts` — OpenAPI parsing logic
- `app/lib/engine.ts` — mutation generation, request runner, and classification
- `lib/prisma.ts` — Prisma client setup
- `prisma/schema.prisma` — database schema definitions

---

## Notes

- The dashboard is primarily a browser-based tester, so target APIs must allow browser requests via CORS.
- Authentication is not automated yet; add custom headers in `app/lib/engine.ts` if needed.
- Stateful APIs may require manual setup before test runs.

---

## License

MIT
 
## FAQ
 
**Q: Will this work on production APIs?**  
Not directly from the browser due to CORS. Use Phase 2 CLI for production, or set up a CORS proxy. Always get permission before running against any API you don't own.
 
**Q: Is this a load tester?**  
No. This is a correctness and security tester. For load testing use k6 or Locust. The goal here is finding bugs — wrong inputs that crash the server or bypass validation — not measuring throughput.
 
**Q: Why does it show "Info" findings for 400 responses?**  
A 400 means the API correctly rejected invalid input. That's good behaviour. Info findings are included so you can see coverage — which mutations were tested and handled properly.
 
**Q: Can I test APIs that need authentication?**  
Manually for now. Open `dashboard/lib/engine/runner.ts`, find the `headers` object, and add:
```typescript
"Authorization": "Bearer your-token-here"
```
Proper auth flow support is on the roadmap.
 
---
 
## License
 
MIT
