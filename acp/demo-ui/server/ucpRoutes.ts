import type { Express, Request, Response } from "express";
import {
  buildRichOrder,
  cancelCheckoutSession,
  completeCheckoutSession,
  createCheckoutSession,
  getCheckoutSession,
  getUcpWellKnown,
  toUcpCheckoutResponse,
  updateCheckoutSession,
} from "./checkoutBridge.js";
import { replayIdempotent, requireIdempotencyKey, saveIdempotent } from "./idempotency.js";

function parseUcpAgent(req: Request) {
  const header = req.header("UCP-Agent") ?? "";
  const match = header.match(/profile="([^"]+)"/);
  return match?.[1] ?? null;
}

function withIdempotency(req: Request, res: Response, body: unknown, run: () => unknown) {
  try {
    const key = req.header("Idempotency-Key");
    if (!key) {
      const result = run();
      return res.json(result);
    }
    const idemKey = requireIdempotencyKey(key);
    const replay = replayIdempotent(idemKey, body);
    if (replay) {
      res.setHeader("Idempotent-Replayed", "true");
      return res.status(replay.status).json(replay.body);
    }
    const result = run();
    saveIdempotent(idemKey, body, 200, result);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "request_failed";
    return res.status(400).json({ ucp: { status: "error" }, error: message });
  }
}

export function registerUcpRoutes(app: Express, baseUrl: string) {
  app.get("/.well-known/ucp", (_req, res) => {
    res.json(getUcpWellKnown(baseUrl));
  });

  app.post("/checkout-sessions", (req, res) => {
    res.status(201);
    withIdempotency(req, res, req.body, () => {
      void parseUcpAgent(req);
      const session = createCheckoutSession(req.body ?? {});
      return toUcpCheckoutResponse(session);
    });
  });

  app.get("/checkout-sessions/:id", (req, res) => {
    try {
      const session = getCheckoutSession(String(req.params.id));
      res.json(toUcpCheckoutResponse(session));
    } catch {
      res.status(404).json({ ucp: { status: "error" }, error: "checkout_session_not_found" });
    }
  });

  app.put("/checkout-sessions/:id", (req, res) => {
    withIdempotency(req, res, req.body, () => {
      const session = updateCheckoutSession(String(req.params.id), req.body ?? {});
      return toUcpCheckoutResponse(session);
    });
  });

  app.post("/checkout-sessions/:id/complete", (req, res) => {
    withIdempotency(req, res, req.body, () => {
      const { session, richOrder: order } = completeCheckoutSession(String(req.params.id), req.body ?? {});
      return { ...toUcpCheckoutResponse(session), order };
    });
  });

  app.post("/checkout-sessions/:id/cancel", (req, res) => {
    withIdempotency(req, res, req.body, () => {
      const session = cancelCheckoutSession(String(req.params.id));
      return toUcpCheckoutResponse(session);
    });
  });

  app.get("/ucp/v1/orders/:id", (req, res) => {
    try {
      res.json(buildRichOrder(String(req.params.id)));
    } catch (error) {
      res.status(404).json({
        ucp: { status: "error" },
        error: error instanceof Error ? error.message : "order_not_found",
      });
    }
  });
}
