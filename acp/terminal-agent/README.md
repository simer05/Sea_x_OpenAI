# ACP Terminal Agent (OpenAI Codex SDK)

Interactive terminal shopping using the official [**OpenAI Codex SDK**](https://developers.openai.com/codex/sdk) (`@openai/codex-sdk`). Codex runs shell commands against the ACP gateway via `src/acp-tool.ts`.

## Prerequisites

1. Node.js 18+ and [pnpm](https://pnpm.io/)
2. [Codex CLI](https://developers.openai.com/codex) installed (`codex --version`)
3. `OPENAI_API_KEY` in `acp/demo-ui/.env.local` or your shell
4. ACP API on port `8787`

## Run

**Terminal 1** — API:

```bash
cd acp/demo-ui
pnpm install
pnpm dev:api
```

**Terminal 2** — interactive Codex agent:

```bash
cd acp/terminal-agent
pnpm install
pnpm start
```

You'll see `What would you like to buy?` — type e.g. `I want halal noodles under 10 dollars`, then follow along (`option 1`, `standard delivery`, `cod`, etc.).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start` | **Interactive Codex SDK** — multi-turn shopping chat |
| `pnpm demo` | One-shot REST script (no Codex, for smoke/debug) |
| `pnpm test` | Smoke test (API must be running) |

## How it works

- `src/codex-agent.ts` — `Codex` + `thread.runStreamed()` per your message ([SDK docs](https://developers.openai.com/codex/sdk))
- `src/acp-tool.ts` — CLI Codex invokes: `search`, `delivery`, `payment`, `order`, `track`
- Auth: `OPENAI_API_KEY` (or `CODEX_API_KEY`) passed to `new Codex({ apiKey })`

## Optional env

```bash
export ACP_BASE_URL=http://127.0.0.1:8787
export ACP_SESSION_ID=terminal-demo
export ACP_PAYMENT=cod   # or card
```
