export type OrderWebhookEvent = {
  id: string;
  type: "order_create" | "order_update";
  created_at: string;
  data: {
    order: Record<string, unknown>;
  };
};

const events: OrderWebhookEvent[] = [];

export function emitOrderEvent(type: OrderWebhookEvent["type"], order: Record<string, unknown>) {
  const event: OrderWebhookEvent = {
    id: `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    type,
    created_at: new Date().toISOString(),
    data: { order },
  };
  events.push(event);
  return event;
}

export function listOrderWebhookEvents(limit = 50) {
  return events.slice(-limit);
}

export function clearOrderWebhookEvents() {
  events.length = 0;
}
