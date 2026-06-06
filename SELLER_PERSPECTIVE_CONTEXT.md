# Seller Perspective Context

## Branch

- Current branch: `Pre-Product-Analysis`
- Target PR base: `main`
- Seller UI app: `apps/post-launch-seller-app`
- Local demo URL: `http://localhost:3002`

## Current Demo Scope

The seller perspective demo has two modes:

- `Pre-Launch`: seller uploads a new product photo, OpenAI fills an editable listing form, and the dashboard evaluates launch fit using mock Shopee Singapore market data.
- `Post-Launch`: seller selects an existing mock Shopee listing from the main screen and sees sales, marketing, market trend, competitor, review, buyer question, health, and action-plan dashboards.

The app uses mock Shopee data for demo purposes because Shopee OpenAPI credentials are not available.

## OpenAI Integration

- API route: `apps/post-launch-seller-app/src/app/api/seller-ai/route.ts`
- The route uses the OpenAI Responses API with function calling to produce seller recommendations.
- It supports image understanding for uploaded pre-launch product photos.
- It blocks risky automated edits for title, category, price, and photo fields.
- Safe edits can be previewed and then applied only after seller confirmation.
- If OpenAI is unavailable, the route returns a fallback response so the demo remains usable.
- Do not commit or expose `.env.local`; it contains local demo credentials.

## Pre-Launch UX

- The original editable form layout is retained.
- The right empty-state panel is the image upload target.
- Uploading a photo asks OpenAI to fill suggested product details.
- OpenAI-filled fields are highlighted with a light background.
- All fields remain editable by the seller.
- `Generate Pre-Launch Analysis` was removed.
- `Change Product` resets the current draft if the seller uploaded the wrong item.
- `Launch Product` is currently disabled for the demo.
- The AI Seller Summary panel was removed from pre-launch.

## Post-Launch UX

- Main screen shows seller items as cards, not a left sidebar list.
- Clicking an item expands the dashboard.
- AI Seller Summary remains in post-launch after the selected live item strip.
- Existing mock products include drinkware, shirts, and phone cases.
- Dashboard sections include sales and marketing, market trends, competitor benchmark, health drivers, response experience, review insights, review sentiment, buyer questions, AI action plan, and next improvement areas.

## Important Files

- `apps/post-launch-seller-app/src/app/page.tsx`: main seller UI, state flow, pre/post launch dashboard rendering.
- `apps/post-launch-seller-app/src/app/globals.css`: seller dashboard styling.
- `apps/post-launch-seller-app/src/app/api/seller-ai/route.ts`: OpenAI-backed seller AI route with fallback.
- `packages/shared-data/src/postLaunchSamples.ts`: mock seller products and Shopee-like market data.

## Verification Notes

- `npm test` in `apps/post-launch-seller-app` passes, but currently only runs the placeholder app test script.
- The Next dev server has been launched on `localhost:3002`.
- Avoid running `npm run build` while the dev server is active because it can rewrite `.next` and temporarily break the live dev UI.
