import type { Express, Request, Response } from "express";
import {
  cancelCheckoutSession,
  completeCheckoutSession,
  createCheckoutSession,
  delegatePayment,
  getAcpWellKnown,
  getCheckoutSession,
  toAcpCheckoutResponse,
  updateCheckoutSession,
} from "./checkoutBridge.js";
import { listOrderWebhookEvents } from "./orderWebhooks.js";
import { replayIdempotent, requireIdempotencyKey, saveIdempotent } from "./idempotency.js";
import { buildRichOrder } from "./checkoutBridge.js";

const ACP_VERSION = "2026-04-17";

function apiVersion(req: Request) {
  return String(req.header("API-Version") ?? ACP_VERSION);
}

function withIdempotency(
  req: Request,
  res: Response,
  body: unknown,
  status: number,
  run: () => unknown,
) {
  try {
    const key = requireIdempotencyKey(req.header("Idempotency-Key"));
    const replay = replayIdempotent(key, body);
    if (replay) {
      res.setHeader("Idempotent-Replayed", "true");
      return res.status(replay.status).json(replay.body);
    }
    const result = run();
    saveIdempotent(key, body, status, result);
    return res.status(status).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    if (message === "idempotency_key_required") return res.status(400).json({ error: { code: message } });
    if (message === "idempotency_conflict") return res.status(422).json({ error: { code: message } });
    return res.status(400).json({ error: { code: message, message } });
  }
}

export function registerAcpRoutes(app: Express, baseUrl: string) {
  app.get("/.well-known/acp.json", (_req, res) => {
    res.json(getAcpWellKnown(baseUrl));
  });

  app.post("/agentic_commerce/delegate_payment", (req, res) => {
    void apiVersion(req);
    withIdempotency(req, res, req.body, 200, () => delegatePayment(req.body ?? {}));
  });

  app.post("/checkout_sessions", (req, res) => {
    withIdempotency(req, res, req.body, 201, () => {
      const session = createCheckoutSession({
        ...req.body,
        demo_session_id: req.body?.demo_session_id,
        session_id: req.body?.session_id,
      });
      return toAcpCheckoutResponse(session);
    });
  });

  app.get("/checkout_sessions/:id", (req, res) => {
    try {
      const session = getCheckoutSession(String(req.params.id));
      res.json(toAcpCheckoutResponse(session));
    } catch {
      res.status(404).json({ error: { code: "checkout_session_not_found" } });
    }
  });

  app.post("/checkout_sessions/:id", (req, res) => {
    withIdempotency(req, res, req.body, 200, () => {
      const session = updateCheckoutSession(String(req.params.id), req.body ?? {});
      return toAcpCheckoutResponse(session);
    });
  });

  app.post("/checkout_sessions/:id/complete", (req, res) => {
    withIdempotency(req, res, req.body, 200, () => {
      const { session, richOrder: order } = completeCheckoutSession(String(req.params.id), req.body ?? {});
      return { ...toAcpCheckoutResponse(session), order };
    });
  });

  app.post("/checkout_sessions/:id/cancel", (req, res) => {
    withIdempotency(req, res, req.body, 200, () => {
      const session = cancelCheckoutSession(String(req.params.id));
      return toAcpCheckoutResponse(session);
    });
  });

  app.get("/orders/:id", (req, res) => {
    try {
      res.json(buildRichOrder(String(req.params.id)));
    } catch (error) {
      res.status(404).json({
        error: error instanceof Error ? error.message : "order_not_found",
      });
    }
  });

  app.post("/agentic_checkout/webhooks/order_events", (req, res) => {
    res.json({ received: true, events: listOrderWebhookEvents(10) });
  });
}
