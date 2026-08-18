# Is It Cooked? — Resume Roast (Next.js MVP)

Upload a resume PDF, get a Cooked / Undercooked / Burnt verdict plus a
line-item "receipt" breakdown, powered by a server-side heuristic engine
(no external AI API needed for this MVP).

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## How it works

- `app/page.tsx` — client UI: drag-and-drop PDF upload, gauge + receipt display
- `app/api/analyze/route.ts` — server route: accepts the PDF, extracts text with
  `pdf-parse`, runs it through the scoring engine
- `lib/analyze.ts` — the actual heuristic logic (length, quantified-proof
  detection, buzzword "bluff detector", action-verb bullet check, contact info)

## Notes

- Only text-based PDFs are supported right now — scanned/image PDFs would need
  an OCR step first (easy next addition via an OCR API).
- Nothing is persisted; each upload is parsed in-memory and discarded after
  the response.
- To swap the canned roast lines for real AI-generated roasts, call the
  Claude API from inside `route.ts` after `analyzeResume()` runs, passing it
  the extracted text and the computed checks.

## Deploy

Ships cleanly to Vercel — just push this folder to a repo and import it.
