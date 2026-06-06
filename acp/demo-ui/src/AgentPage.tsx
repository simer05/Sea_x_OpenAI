import React, { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  ExternalLink,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react";
import {
  checkAgentApiHealth,
  getDemoSessionId,
  notifyCartSync,
} from "./shared/demoSession";

type ScoreBreakdown = {
  halal_trust: number;
  price_fit: number;
  product_rating: number;
  customer_reviews: number;
  seller_trust: number;
  sold_count: number;
  delivery_fit: number;
};

type AgentProduct = {
  rank: number;
  sku_id: string;
  product_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  seller_name: string;
  halal_status: string;
  certificate_authority: string | null;
  certificate_status: string;
  overall_score: number;
  tier: string;
  score_breakdown: ScoreBreakdown;
  recommendation_reason: string;
  product_url: string;
  cod_available: boolean;
  bnpl_available: boolean;
  delivery_days: string;
  image_url: string;
};

type PaymentChoice = {
  id: "cod" | "tokenized_card" | "bnpl" | "shopeepay_wallet";
  label: string;
  available: boolean;
  note?: string;
};

type DeliveryChoice = {
  id: string;
  label: string;
  fee: number;
  currency: string;
  eta: string;
  reliability_score: number;
};

type TraceEntry = {
  id: string;
  timestamp: string;
  message: string;
  detail?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
};

type AgentResponse = {
  sessionId: string;
  step: string;
  reply: string;
  products?: AgentProduct[];
  selected?: AgentProduct;
  paymentOptions?: PaymentChoice[];
  deliveryOptions?: DeliveryChoice[];
  order?: { order_id: string; lifecycle_state: string; summary?: Record<string, unknown> };
  tracking?: {
    current_status: string;
    expected_message: string;
    events: Array<{ step: number; label: string; completed: boolean }>;
  };
  trace?: TraceEntry[];
  filterSummary?: {
    total_found: number;
    eligible_count: number;
    rejections: Array<{ title: string; reason: string }>;
  };
  suggestions?: string[];
  cartSynced?: boolean;
  error?: string;
};

function money(price: number, currency: string) {
  const decimals = currency === "IDR" || currency === "VND" ? 0 : 2;
  return `${currency} ${new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(price)}`;
}

function tierClass(tier: string) {
  if (tier === "Legendary Pick") return "tier-legendary";
  if (tier === "Elite Pick") return "tier-elite";
  if (tier === "Safe Pick") return "tier-safe";
  return "tier-backup";
}

async function speak(text: string) {
  try {
    const res = await fetch("/api/agent/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
  } catch {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }
}

export function AgentPage() {
  const [sessionId, setSessionId] = useState<string>();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        'Hi! I use the Shopee ACP gateway to shop for you. Try: "I want to buy a Halal noodles pack under $10."',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<AgentProduct[]>([]);
  const [selected, setSelected] = useState<AgentProduct>();
  const [payments, setPayments] = useState<PaymentChoice[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryChoice[]>([]);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [filterSummary, setFilterSummary] = useState<AgentResponse["filterSummary"]>();
  const [orderSummary, setOrderSummary] = useState<AgentResponse["order"]>();
  const [tracking, setTracking] = useState<AgentResponse["tracking"]>();
  const [suggestions, setSuggestions] = useState<string[]>([
    "I want to buy a Halal noodles pack under $10",
  ]);
  const [recording, setRecording] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void checkAgentApiHealth().then((health) => setApiOnline(health.ok));
    void fetch("/.well-known/shopee-acp.json")
      .then((res) => res.json())
      .then((manifest) => {
        if (manifest.capabilities) {
          setTrace([
            {
              id: "boot",
              timestamp: new Date().toISOString(),
              message: "ACP capability discovery completed",
              detail: manifest.capabilities.join(", "),
            },
          ]);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, products, payments, deliveries, loading]);

  async function sendChat(body: Record<string, unknown>) {
    if (!apiOnline) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "error",
          content: "Agent API offline. Run `cd acp/demo-ui && pnpm dev`.",
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          demoSessionId: getDemoSessionId(),
          ...body,
        }),
      });
      const data = (await res.json()) as AgentResponse;
      if (!res.ok) throw new Error(data.error ?? "Agent request failed");

      setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
      if (data.products) setProducts(data.products);
      if (data.selected) setSelected(data.selected);
      if (data.paymentOptions) setPayments(data.paymentOptions);
      if (data.deliveryOptions) setDeliveries(data.deliveryOptions);
      if (data.trace) setTrace(data.trace);
      if (data.filterSummary) setFilterSummary(data.filterSummary);
      if (data.order) setOrderSummary(data.order);
      if (data.tracking) setTracking(data.tracking);
      setSuggestions(data.suggestions ?? []);
      if (data.cartSynced) notifyCartSync();
      if (voiceOn) void speak(data.reply);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent request failed";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "error", content: message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function onSend(message?: string, extra?: Record<string, unknown>) {
    const text = (message ?? input).trim();
    if (!text && !extra?.action) return;
    if (text) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: text }]);
    }
    setInput("");
    await sendChat({ message: text, ...extra });
  }

  async function onPick(product: AgentProduct) {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: `I'll go with option ${product.rank}`,
      },
    ]);
    await sendChat({
      message: `I'll go with option ${product.rank}`,
      action: "select_product",
      skuId: product.sku_id,
    });
  }

  async function onDelivery(option: DeliveryChoice) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Use ${option.label.toLowerCase()}` },
    ]);
    await sendChat({
      message: `Use ${option.label.toLowerCase()}`,
      action: "select_delivery",
      deliveryOptionId: option.id,
    });
  }

  async function onPay(method: PaymentChoice["id"]) {
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: `Pay with ${method}` },
    ]);
    await sendChat({ message: `Pay with ${method}`, action: "pay", paymentMethod: method });
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorder.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setLoading(true);
        try {
          const res = await fetch("/api/agent/transcribe", {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          const data = (await res.json()) as { text?: string; error?: string };
          if (!res.ok) throw new Error(data.error ?? "Transcription failed");
          if (data.text) await onSend(data.text);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Voice input failed";
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "error", content: message },
          ]);
        } finally {
          setLoading(false);
        }
      };
      mediaRecorder.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "error",
          content: "Microphone permission denied or unavailable.",
        },
      ]);
    }
  }

  return (
    <div className="agent-page agent-standalone">
      <header className="agent-topbar">
        <div>
          <p className="agent-kicker">
            <Sparkles size={16} /> Shopee ACP Agent
          </p>
          <h1>Halal-aware agentic commerce</h1>
        </div>
        <a className="agent-shop-link" href="/" target="_blank" rel="noreferrer">
          <ExternalLink size={16} /> Open Shopee shop
        </a>
      </header>

      {apiOnline === false && (
        <div className="agent-error-banner">
          Shopee ACP Gateway offline — start with <code>cd acp/demo-ui && pnpm dev</code>
        </div>
      )}

      <section className="agent-hero">
        <div>
          <h2>Halal noodles under $10 · Singapore</h2>
          <p>Search → verify → score → pay → deliver → track via Shopee ACP.</p>
        </div>
        <button
          type="button"
          className={`agent-voice-toggle ${voiceOn ? "on" : ""}`}
          onClick={() => setVoiceOn((v) => !v)}
        >
          <Volume2 size={16} /> Voice {voiceOn ? "on" : "off"}
        </button>
      </section>

      <div className="agent-layout agent-layout-3col">
        <aside className="agent-trace-panel">
          <h3>ACP Trace</h3>
          {filterSummary && (
            <div className="agent-filter-summary">
              <p>
                {filterSummary.total_found} found → {filterSummary.eligible_count} eligible
              </p>
              <ul>
                {filterSummary.rejections.slice(0, 5).map((r) => (
                  <li key={r.title}>
                    <strong>{r.title}</strong>: {r.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ol className="agent-trace-list">
            {trace.map((entry, index) => (
              <li key={entry.id}>
                <span className="trace-num">{index + 1}</span>
                <div>
                  <strong>{entry.message}</strong>
                  {entry.detail && <pre>{entry.detail}</pre>}
                </div>
              </li>
            ))}
          </ol>
        </aside>

        <div className="agent-chat">
          {messages.map((msg) => (
            <div key={msg.id} className={`agent-bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && <div className="agent-bubble assistant agent-typing">Thinking…</div>}
          <div ref={bottomRef} />
        </div>

        <aside className="agent-side">
          {products.length > 0 && (
            <div className="agent-cards">
              <h3>Top 3 explainable picks</h3>
              <div className="agent-card-grid agent-card-grid-single">
                {products.map((product) => (
                  <article
                    key={product.sku_id}
                    className={`agent-card agent-score-card ${tierClass(product.tier)}`}
                  >
                    <div className="agent-card-tier">{product.tier}</div>
                    <div className="agent-card-rank">#{product.rank}</div>
                    <img src={product.image_url} alt={product.title} />
                    <div className="agent-card-body">
                      <p className="agent-card-badge">
                        <BadgeCheck size={12} /> {product.certificate_status}
                      </p>
                      <h4>{product.title}</h4>
                      <p className="agent-card-price">{money(product.price, product.currency)}</p>
                      <p className="agent-card-score">Overall: {product.overall_score}/100</p>
                      <div className="score-breakdown">
                        <span>Halal {product.score_breakdown.halal_trust}/25</span>
                        <span>Price {product.score_breakdown.price_fit}/20</span>
                        <span>Rating {product.score_breakdown.product_rating}/15</span>
                        <span>Reviews {product.score_breakdown.customer_reviews}/15</span>
                        <span>Seller {product.score_breakdown.seller_trust}/10</span>
                        <span>Sold {product.score_breakdown.sold_count}/10</span>
                        <span>Delivery {product.score_breakdown.delivery_fit}/5</span>
                      </div>
                      <p className="agent-card-why">{product.recommendation_reason}</p>
                      <div className="agent-card-tags">
                        {product.cod_available && <span className="tag">COD</span>}
                        {product.bnpl_available && <span className="tag">BNPL</span>}
                        <span className="tag muted">{product.delivery_days}</span>
                      </div>
                      <a className="agent-product-link" href={product.product_url} target="_blank" rel="noreferrer">
                        View original product
                      </a>
                      <button type="button" className="agent-pick-btn" onClick={() => onPick(product)}>
                        Select option {product.rank}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {selected && (
            <div className="agent-selected">
              <h3>Your selection</h3>
              <img src={selected.image_url} alt={selected.title} />
              <strong>{selected.title}</strong>
              <p>{money(selected.price, selected.currency)}</p>
              <p className="agent-card-score">{selected.tier} · {selected.overall_score}/100</p>
            </div>
          )}

          {deliveries.length > 0 && (
            <div className="agent-deliveries">
              <h3>Delivery options</h3>
              {deliveries.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="agent-delivery-btn"
                  onClick={() => onDelivery(d)}
                >
                  <strong>{d.label}</strong>
                  <span>
                    {money(d.fee, d.currency)} · {d.eta} · {d.reliability_score}% reliable
                  </span>
                </button>
              ))}
            </div>
          )}

          {payments.length > 0 && (
            <div className="agent-payments">
              <h3>Payment options</h3>
              {payments.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`agent-pay-btn ${p.available ? "" : "disabled"}`}
                  disabled={!p.available}
                  onClick={() => onPay(p.id)}
                >
                  <strong>{p.label}</strong>
                  <span>{p.available ? p.note : "Not available for this order"}</span>
                </button>
              ))}
            </div>
          )}

          {orderSummary && (
            <div className="agent-order-summary">
              <h3>Order placed</h3>
              <p>
                <strong>{orderSummary.order_id}</strong>
              </p>
              {orderSummary.summary && (
                <ul>
                  {Object.entries(orderSummary.summary).map(([key, value]) => (
                    <li key={key}>
                      {key}: {String(value)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tracking && (
            <div className="agent-tracking">
              <h3>Delivery tracking</h3>
              <p>{tracking.expected_message}</p>
              <ol>
                {tracking.events.map((event) => (
                  <li key={event.step} className={event.completed ? "done" : ""}>
                    {event.label}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>

      <div className="agent-suggestions">
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => onSend(s)}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="agent-input"
        onSubmit={(e) => {
          e.preventDefault();
          void onSend();
        }}
      >
        <button
          type="button"
          className={`agent-mic ${recording ? "recording" : ""}`}
          onClick={() => void toggleRecording()}
          aria-label={recording ? "Stop recording" : "Start voice input"}
        >
          {recording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='e.g. I want to buy a Halal noodles pack under $10'
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
