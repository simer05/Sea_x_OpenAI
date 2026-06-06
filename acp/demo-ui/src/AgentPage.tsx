import React, { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Lock,
  Mic,
  MicOff,
  Send,
  ShoppingBag,
  Sparkles,
  Truck,
  Volume2,
  Wallet,
  X,
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
  price: number;
  currency: string;
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

type ChatMessage = { id: string; role: "user" | "assistant" | "error"; content: string };

type AgentResponse = {
  sessionId: string;
  step: string;
  reply: string;
  products?: AgentProduct[];
  selected?: AgentProduct;
  paymentOptions?: PaymentChoice[];
  deliveryOptions?: DeliveryChoice[];
  order?: { order_id: string; summary?: Record<string, unknown> };
  tracking?: {
    current_status: string;
    expected_message: string;
    events: Array<{ step: number; label: string; completed: boolean }>;
  };
  suggestions?: string[];
  cartSynced?: boolean;
  error?: string;
};

const EMPTY_BREAKDOWN: ScoreBreakdown = {
  halal_trust: 0,
  price_fit: 0,
  product_rating: 0,
  customer_reviews: 0,
  seller_trust: 0,
  sold_count: 0,
  delivery_fit: 0,
};

function money(price: number, currency: string) {
  return `${currency} ${price.toFixed(currency === "IDR" || currency === "VND" ? 0 : 2)}`;
}

function tierClass(tier: string) {
  if (tier === "Legendary Pick") return "tier-legendary";
  if (tier === "Elite Pick") return "tier-elite";
  return "tier-safe";
}

function shopUrl(productUrl: string) {
  if (productUrl.startsWith("http")) return productUrl;
  return productUrl.startsWith("/") ? productUrl : `/${productUrl}`;
}

function flowStatus(step: string) {
  if (step === "delivery") return "Choosing delivery";
  if (step === "payment") return "Checkout";
  if (step === "done" || step === "tracking") return "Order placed";
  if (step === "picks") return "Reviewing picks";
  return null;
}

function normalizeAgentProduct(raw: Partial<AgentProduct> | undefined): AgentProduct | undefined {
  if (!raw?.sku_id && !raw?.product_id) return undefined;
  const b = raw.score_breakdown ?? EMPTY_BREAKDOWN;
  return {
    rank: raw.rank ?? 0,
    sku_id: raw.sku_id ?? "",
    product_id: raw.product_id ?? "",
    title: raw.title ?? "Product",
    price: raw.price ?? 0,
    currency: raw.currency ?? "SGD",
    certificate_status: raw.certificate_status ?? "Verified",
    overall_score: raw.overall_score ?? 0,
    tier: raw.tier ?? "Pick",
    score_breakdown: {
      halal_trust: b.halal_trust ?? 0,
      price_fit: b.price_fit ?? 0,
      product_rating: b.product_rating ?? 0,
      customer_reviews: b.customer_reviews ?? 0,
      seller_trust: b.seller_trust ?? 0,
      sold_count: b.sold_count ?? 0,
      delivery_fit: b.delivery_fit ?? 0,
    },
    recommendation_reason: raw.recommendation_reason ?? "",
    product_url: raw.product_url ?? "/",
    cod_available: Boolean(raw.cod_available),
    bnpl_available: Boolean(raw.bnpl_available),
    delivery_days: raw.delivery_days ?? "2-3 days",
    image_url: raw.image_url ?? "/images/products/food_groceries.jpg",
  };
}

function speakShort(text: string) {
  const short = text.split(/[.!?]/)[0]?.trim().slice(0, 120) ?? text;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(short);
  utterance.rate = 1.05;
  window.speechSynthesis.speak(utterance);
}

function payIcon(id: PaymentChoice["id"]) {
  if (id === "cod") return <Wallet size={16} />;
  if (id === "bnpl") return <CreditCard size={16} />;
  return <CreditCard size={16} />;
}

function formatCardNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function AgentPage() {
  const [sessionId, setSessionId] = useState<string>();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I'm your shopping assistant. Tell me what you need: product, Halal preference, budget, and city.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<AgentProduct[]>([]);
  const [selected, setSelected] = useState<AgentProduct>();
  const [payments, setPayments] = useState<PaymentChoice[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryChoice[]>([]);
  const [orderSummary, setOrderSummary] = useState<AgentResponse["order"]>();
  const [tracking, setTracking] = useState<AgentResponse["tracking"]>();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chosenDeliveryId, setChosenDeliveryId] = useState<string>();
  const [chosenPaymentId, setChosenPaymentId] = useState<PaymentChoice["id"]>();
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [recording, setRecording] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  const statusLabel = flowStatus(currentStep);
  const showProducts = products.length > 0 && (currentStep === "picks" || currentStep === "chat");

  useEffect(() => {
    void checkAgentApiHealth().then((h) => setApiOnline(h.ok));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (showProducts) {
      productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showProducts, products.length]);

  function clearCheckoutState() {
    setProducts([]);
    setSelected(undefined);
    setPayments([]);
    setDeliveries([]);
    setOrderSummary(undefined);
    setTracking(undefined);
    setChosenDeliveryId(undefined);
    setChosenPaymentId(undefined);
  }

  function applyAgentState(data: AgentResponse) {
    setSessionId(data.sessionId);
    setCurrentStep(data.step);

    if (data.step === "chat" && !data.products?.length) {
      clearCheckoutState();
      setSuggestions(data.suggestions ?? []);
      return;
    }

    if (data.step === "picks") {
      setSelected(undefined);
      setPayments([]);
      setDeliveries([]);
      setOrderSummary(undefined);
      setTracking(undefined);
      setChosenDeliveryId(undefined);
      setChosenPaymentId(undefined);
      if (data.products) {
        setProducts(
          data.products
            .map(normalizeAgentProduct)
            .filter((x): x is AgentProduct => Boolean(x)),
        );
      }
      setSuggestions(data.suggestions ?? []);
      return;
    }

    if (data.products) {
      setProducts(
        data.products
          .map(normalizeAgentProduct)
          .filter((x): x is AgentProduct => Boolean(x)),
      );
    }
    if (data.selected !== undefined) {
      setSelected(data.selected ? normalizeAgentProduct(data.selected) : undefined);
    }
    if (data.deliveryOptions !== undefined) {
      setDeliveries(data.deliveryOptions);
    }
    if (data.paymentOptions !== undefined) {
      setPayments(data.paymentOptions);
    }
    if (data.order !== undefined) {
      setOrderSummary(data.order);
    }
    if (data.tracking !== undefined) {
      setTracking(data.tracking);
    }
    setSuggestions(data.suggestions ?? []);
  }

  async function sendChat(body: Record<string, unknown>) {
    if (!apiOnline) {
      setMessages((p) => [
        ...p,
        { id: crypto.randomUUID(), role: "error", content: "Agent offline — run pnpm dev in acp/demo-ui" },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, demoSessionId: getDemoSessionId(), ...body }),
      });
      const data = (await res.json()) as AgentResponse;
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      applyAgentState(data);
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: data.reply }]);
      if (data.cartSynced) notifyCartSync();
      if (voiceOn) speakShort(data.reply);
    } catch (error) {
      setMessages((p) => [
        ...p,
        {
          id: crypto.randomUUID(),
          role: "error",
          content: error instanceof Error ? error.message : "Something went wrong",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function onSend(message?: string, extra?: Record<string, unknown>) {
    const text = (message ?? input).trim();
    if (!text && !extra?.action) return;

    if (text === "Start a new search") {
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "user", content: text }]);
      setInput("");
      await sendChat({ action: "cancel", message: "" });
      return;
    }

    if (text) setMessages((p) => [...p, { id: crypto.randomUUID(), role: "user", content: text }]);
    setInput("");
    await sendChat({ message: text, ...extra });
  }

  async function onPick(product: AgentProduct) {
    setMessages((p) => [
      ...p,
      { id: crypto.randomUUID(), role: "user", content: `I'll take ${product.title}` },
    ]);
    await sendChat({ message: product.title, action: "select_product", skuId: product.sku_id });
  }

  async function onChooseDelivery(d: DeliveryChoice) {
    setChosenDeliveryId(d.id);
    await onSend(`Use ${d.label.toLowerCase()}`, {
      action: "select_delivery",
      deliveryOptionId: d.id,
    });
  }

  function onChoosePayment(p: PaymentChoice) {
    if (!p.available) return;
    if (p.id === "tokenized_card") {
      setChosenPaymentId(p.id);
      setCardModalOpen(true);
      return;
    }
    setChosenPaymentId(p.id);
    void onSend(`Pay with ${p.id}`, { action: "pay", paymentMethod: p.id });
  }

  async function onSubmitCardPayment(e: React.FormEvent) {
    e.preventDefault();
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 15 || !cardName.trim() || cardExpiry.length < 5 || cardCvv.length < 3) {
      return;
    }
    setCardModalOpen(false);
    setCardNumber("");
    setCardName("");
    setCardExpiry("");
    setCardCvv("");
    await onSend("Pay with card", { action: "pay", paymentMethod: "tokenized_card" });
  }

  return (
    <div className="agent-page agent-v3">
      <div className="agent-v3-bg" aria-hidden />

      <header className="agent-v3-header">
        <div className="agent-v3-brand">
          <div className="agent-v3-logo">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="agent-v3-kicker">Shopee ACP · Agentic Commerce</p>
            <h1>Shopping Assistant</h1>
          </div>
        </div>
        <div className="agent-v3-header-actions">
          {statusLabel && <span className="agent-v3-status">{statusLabel}</span>}
          <button
            type="button"
            className={`agent-voice-toggle ${voiceOn ? "on" : ""}`}
            onClick={() => setVoiceOn((v) => !v)}
          >
            <Volume2 size={14} /> Voice {voiceOn ? "on" : "off"}
          </button>
          <a className="agent-shop-link" href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Shop
          </a>
        </div>
      </header>

      {showProducts && (
        <section className="agent-v3-products" ref={productsRef}>
          <div className="agent-v3-products-head">
            <h3>Top verified picks</h3>
            <span>{products.length} Halal-scored options</span>
          </div>
          <div className="agent-v3-product-row">
            {products.map((product) => (
              <article key={product.sku_id} className={`agent-v3-card ${tierClass(product.tier)}`}>
                <div className="agent-v3-card-top">
                  <span className="agent-v3-rank">#{product.rank}</span>
                  <span className="agent-v3-tier">{product.tier}</span>
                </div>
                <img src={product.image_url} alt={product.title} />
                <div className="agent-v3-card-body">
                  <p className="agent-v3-halal"><BadgeCheck size={11} /> {product.certificate_status}</p>
                  <h4>{product.title}</h4>
                  <p className="agent-v3-price">{money(product.price, product.currency)}</p>
                  <div className="agent-v3-score-ring">
                    <span>{product.overall_score}</span>
                    <small>/100</small>
                  </div>
                  <p className="agent-v3-mini-scores">
                    Halal {product.score_breakdown.halal_trust} · Price {product.score_breakdown.price_fit}
                  </p>
                  <div className="agent-v3-card-actions">
                    <a
                      className="agent-v3-view-shop"
                      href={shopUrl(product.product_url)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} /> Shop
                    </a>
                    <button type="button" className="agent-v3-pick" onClick={() => void onPick(product)}>
                      Select
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="agent-v3-main">
        <section className="agent-v3-chat">
          <div className="agent-v3-chat-inner">
            {messages.map((msg) => (
              <div key={msg.id} className={`agent-bubble ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && <div className="agent-bubble assistant agent-typing">Working on it…</div>}
            <div ref={bottomRef} />
          </div>
        </section>

        <section className="agent-v3-flow">
          {selected && (
            <div className="agent-v3-panel">
              <h3><ShoppingBag size={16} /> Selected</h3>
              <div className="agent-v3-selected-row">
                <img src={selected.image_url} alt="" />
                <div>
                  <strong>{selected.title}</strong>
                  <p>{money(selected.price, selected.currency)} · {selected.overall_score}/100</p>
                  <a className="agent-v3-shop-link" href={shopUrl(selected.product_url)} target="_blank" rel="noreferrer">
                    <ExternalLink size={12} /> View on shop
                  </a>
                </div>
              </div>
            </div>
          )}

          {deliveries.length > 0 && (
            <div className="agent-v3-panel">
              <h3><Truck size={16} /> Delivery</h3>
              <div className="agent-v3-option-grid">
                {deliveries.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`agent-v3-option ${chosenDeliveryId === d.id ? "chosen" : ""}`}
                    onClick={() => void onChooseDelivery(d)}
                  >
                    <strong>{d.label}</strong>
                    <span>{money(d.fee, d.currency)} · {d.eta}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {payments.length > 0 && (
            <div className="agent-v3-panel">
              <h3><CreditCard size={16} /> Payment</h3>
              <div className="agent-v3-option-grid agent-v3-pay-grid">
                {payments.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`agent-v3-option ${p.available ? "" : "disabled"} ${chosenPaymentId === p.id ? "chosen" : ""}`}
                    disabled={!p.available}
                    onClick={() => onChoosePayment(p)}
                  >
                    {payIcon(p.id)}
                    <strong>{p.label}</strong>
                    <span>{p.available ? p.note : "Unavailable"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {orderSummary && (
            <div className="agent-v3-panel agent-v3-success">
              <h3><CheckCircle2 size={16} /> Order placed</h3>
              <p className="agent-v3-order-id">{orderSummary.order_id}</p>
              {orderSummary.summary && (
                <p>Total: SGD {String(orderSummary.summary.total)}</p>
              )}
            </div>
          )}

          {tracking && (
            <div className="agent-v3-panel">
              <h3>Tracking</h3>
              <p>{tracking.expected_message}</p>
              <ul className="agent-v3-track">
                {tracking.events.map((e) => (
                  <li key={e.step} className={e.completed ? "done" : ""}>{e.label}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {suggestions.length > 0 && (currentStep === "done" || currentStep === "tracking") && (
        <div className="agent-suggestions">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => void onSend(s)}>{s}</button>
          ))}
        </div>
      )}

      {cardModalOpen && (
        <div className="agent-card-overlay" onClick={() => setCardModalOpen(false)}>
          <form className="agent-card-modal" onClick={(e) => e.stopPropagation()} onSubmit={(e) => void onSubmitCardPayment(e)}>
            <div className="agent-card-modal-head">
              <h3><Lock size={16} /> Add card</h3>
              <button type="button" aria-label="Close" onClick={() => setCardModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="agent-card-modal-copy">Secure delegated payment via Shopee ACP — demo only, no real charge.</p>
            <label>
              Card number
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
              />
            </label>
            <label>
              Name on card
              <input
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="As shown on card"
                autoComplete="cc-name"
              />
            </label>
            <div className="agent-card-modal-row">
              <label>
                Expiry
                <input
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                />
              </label>
              <label>
                CVV
                <input
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                />
              </label>
            </div>
            <button type="submit" className="agent-card-submit">Pay securely</button>
          </form>
        </div>
      )}

      <form className="agent-input agent-v3-input" onSubmit={(e) => { e.preventDefault(); void onSend(); }}>
        <button
          type="button"
          className={`agent-mic ${recording ? "recording" : ""}`}
          onClick={() => {
            if (recording) {
              mediaRecorder.current?.stop();
              setRecording(false);
              return;
            }
            void navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
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
                  const data = (await res.json()) as { text?: string };
                  if (data.text) await onSend(data.text);
                } finally {
                  setLoading(false);
                }
              };
              mediaRecorder.current = recorder;
              recorder.start();
              setRecording(true);
            });
          }}
        >
          {recording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe what you want to buy…"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}><Send size={18} /></button>
      </form>
    </div>
  );
}
