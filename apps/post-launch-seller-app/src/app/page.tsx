"use client";

import { useMemo, useState } from "react";
import { postLaunchSamples } from "@adaptlink/shared-data";
import { analyzePostLaunchProduct } from "@adaptlink/post-launch-seller";
import type { PostLaunchInput } from "@adaptlink/shared-types";

const inputs = postLaunchSamples as PostLaunchInput[];

const timeframes = [
  {
    label: "Last 30 days",
    volumeFactor: 0.34,
    ctrFactor: 0.98,
    conversionFactor: 0.92,
    adSpendFactor: 0.42,
    reviewFactor: 0.28,
    marginDelta: -0.02,
    chatFactor: 0.36,
    responseMinutesFactor: 1.12,
    oneHourDelta: -0.06,
    unansweredDelta: 0.03,
    csatDelta: -0.1
  },
  {
    label: "Last 3 months",
    volumeFactor: 1,
    ctrFactor: 1,
    conversionFactor: 1,
    adSpendFactor: 1,
    reviewFactor: 1,
    marginDelta: 0,
    chatFactor: 1,
    responseMinutesFactor: 1,
    oneHourDelta: 0,
    unansweredDelta: 0,
    csatDelta: 0
  },
  {
    label: "Last 6 months",
    volumeFactor: 1.92,
    ctrFactor: 1.04,
    conversionFactor: 1.06,
    adSpendFactor: 1.78,
    reviewFactor: 1.72,
    marginDelta: 0.01,
    chatFactor: 1.85,
    responseMinutesFactor: 0.9,
    oneHourDelta: 0.05,
    unansweredDelta: -0.02,
    csatDelta: 0.12
  }
];

const preIdeas = [
  {
    title: "Insulated Stainless Steel Water Bottle",
    category: "Home & Living > Drinkware",
    score: 78,
    price: 18.9,
    metrics: [78, 66, 75, 72, 81],
    actions: ["Lead with leak-test image", "Use two-pack bundle to protect margin", "Add capacity guide before launch"]
  },
  {
    title: "Oversized Cotton T-Shirt",
    category: "Fashion > Men Clothing",
    score: 66,
    price: 15.9,
    metrics: [72, 61, 58, 63, 68],
    actions: ["Add model-height size chart", "Show fabric GSM and texture", "Limit launch colors to top variants"]
  },
  {
    title: "Shockproof Clear Phone Case",
    category: "Mobile Accessories > Phone Cases",
    score: 82,
    price: 9.9,
    metrics: [84, 64, 77, 73, 86],
    actions: ["Make model compatibility visible in image one", "Show camera-lip close-up", "Mention realistic yellowing expectation"]
  }
];

export default function Page() {
  const [mode, setMode] = useState<"pre" | "post">("post");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTimeframeIndex, setSelectedTimeframeIndex] = useState(1);
  const [preIdeaIndex, setPreIdeaIndex] = useState(2);
  const timeframe = timeframes[selectedTimeframeIndex];
  const input = useMemo(() => applyTimeframe(inputs[selectedIndex], timeframe), [selectedIndex, timeframe]);
  const report = useMemo(() => analyzePostLaunchProduct(input), [input]);
  const product = input.product;
  const selectedPreIdea = preIdeas[preIdeaIndex];
  const competitorRank = product.rating >= 4.65 && product.reviews > 250 ? 1 : product.rating >= 4.4 ? 2 : 3;

  return (
    <div className="seller-console">
      <aside className="seller-sidebar" aria-label="Shopee seller navigation">
        <div className="shopee-lockup">
          <button className="icon-button" type="button" aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
          <div className="shopee-logo" aria-label="Shopee">
            <span className="bag-mark">S</span>
            <strong>Shopee</strong>
          </div>
        </div>
        <nav className="side-nav">
          <a href="#"><span className="nav-icon home" />Overview</a>
          <a className="open" href="#"><span className="nav-icon analytics" />Product Analytics</a>
          <button className={mode === "pre" ? "side-subnav active" : "side-subnav"} type="button" onClick={() => setMode("pre")}>Pre-Launch</button>
          <button className={mode === "post" ? "side-subnav active" : "side-subnav"} type="button" onClick={() => setMode("post")}>Post-Launch</button>
          <a href="#"><span className="nav-icon trend" />Performance Trends</a>
          <a href="#"><span className="nav-icon competitor" />Competitor Insights</a>
          <a href="#"><span className="nav-icon market" />Market Insights</a>
          <a href="#"><span className="nav-icon report" />Reports</a>
        </nav>
        <section className="sidebar-card product-switcher" aria-label="Seller existing products">
          <div className="sidebar-card-title">
            <span>Seller Existing Products</span>
            <strong>{inputs.length}</strong>
          </div>
          <div className="product-list">
            {inputs.map((item, index) => (
              <button
                className={mode === "post" && index === selectedIndex ? "product-option active" : "product-option"}
                key={item.product.productId}
                onClick={() => {
                  setSelectedIndex(index);
                  setMode("post");
                }}
                type="button"
              >
                <img className="product-thumb" src={productImageSrc(imageKind(item.product.title))} alt={item.product.title} />
                <span>
                  <strong>{shortProductName(item.product.title)}</strong>
                  <small>{item.product.productId}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      </aside>

      <main className="seller-main">
        <header className="global-bar">
          <div className="brand-area">
            <span className="adapt-mark" />
            <strong>AdaptLink</strong>
            <span>Seller Intelligence</span>
          </div>
          <div className="store-area">
            <div className="store-card">
              <span className="store-icon" />
              <div>
                <strong>My Home Living Store</strong>
                <small>Shopee Mall</small>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-head">
            <div>
              <h1>{mode === "post" ? "Post-Launch Product Intelligence" : "Pre-Launch Product Intelligence"}</h1>
              <p>
                {mode === "post"
                  ? "Track performance, benchmark competitors, and optimize existing listings for growth."
                  : "Validate product ideas before launch with market, margin, competitor, and readiness analysis."}
              </p>
            </div>
            <div className="head-actions">
              <label className="range-picker">
                <span className="calendar-icon" />
                <select value={selectedTimeframeIndex} onChange={(event) => setSelectedTimeframeIndex(Number(event.target.value))}>
                  {timeframes.map((item, index) => (
                    <option key={item.label} value={index}>{item.label}</option>
                  ))}
                </select>
              </label>
              <div className="openai-pill" aria-label="Powered by OpenAI">
                <span className="openai-logo" />
                <strong>Powered by OpenAI</strong>
              </div>
            </div>
          </section>

          <section className="mode-switch" aria-label="Analysis stage">
            <button className={mode === "pre" ? "mode-button active" : "mode-button"} type="button" onClick={() => setMode("pre")}>
              <span>Pre-Launch</span>
              <strong>Validate new product idea</strong>
            </button>
            <button className={mode === "post" ? "mode-button active" : "mode-button"} type="button" onClick={() => setMode("post")}>
              <span>Post-Launch</span>
              <strong>Improve existing product</strong>
            </button>
          </section>

          {mode === "post" ? (
            <section className="analysis-view">
              <section className="kpi-grid" aria-label="Post-launch key metrics">
                <KpiCard accent="orange" icon="sales" label="Sales" value={currency(product.revenue)} detail={`${product.orders} orders`} />
                <KpiCard accent="orange" icon="funnel" label="Conversion Rate" value={percent(product.conversionRate)} detail="orders divided by clicks" />
                <KpiCard accent="green" icon="health" label="Product Health Score" value={`${report.health.overall}/100`} detail={healthLabel(report.health.overall)} />
                <KpiCard accent="orange" icon="margin" label="Net Margin" value={percent(product.netMarginPercent)} detail={`ROAS ${(product.revenue / Math.max(product.adSpend, 1)).toFixed(1)}x`} />
                <KpiCard accent="purple" icon="reviews" label="Reviews" value={product.reviews.toLocaleString()} detail={`${product.rating.toFixed(2)} rating`} />
                <KpiCard accent="blue" icon="trophy" label="Competitor Position" value={`#${competitorRank}`} detail="current benchmark set" />
              </section>

              <section className="main-grid">
                <article className="panel sales-funnel-panel">
                  <div className="panel-heading"><h2>Sales Funnel</h2><span>{timeframe.label}</span></div>
                  <div className="funnel-layout">
                    <div className="funnel-visual">
                      <div className="funnel-slice slice-1"><span>Impressions</span></div>
                      <div className="funnel-slice slice-2"><span>Clicks</span></div>
                      <div className="funnel-slice slice-3"><span>Add-to-Cart</span></div>
                      <div className="funnel-slice slice-4"><span>Orders</span></div>
                      <div className="funnel-circle">{percent(product.conversionRate)}</div>
                    </div>
                    <div className="funnel-table">
                      <FunnelRow label="Impressions" value={product.views.toLocaleString()} rate="" />
                      <FunnelRow label="Clicks" value={product.clicks.toLocaleString()} rate={percent(product.ctr)} />
                      <FunnelRow label="Orders" value={product.orders.toLocaleString()} rate={percent(product.conversionRate)} />
                    </div>
                  </div>
                  <p className="panel-note">CTR means click-through rate: clicks divided by listing views. It shows whether shoppers who saw the product were interested enough to click.</p>
                </article>

                <article className="panel trend-panel">
                  <div className="panel-heading"><h2>Sales Trend</h2><span>{timeframe.label}</span></div>
                  <MiniTrend />
                </article>

                <article className="panel benchmark-panel">
                  <div className="panel-heading"><h2>Competitor Benchmark</h2><span>Current product</span></div>
                  <div className="benchmark-table">
                    <div className="table-row head"><span>Metric</span><span>You</span><span>Competitor Avg</span><span>Gap</span></div>
                    <div className="table-row"><span>Price</span><span>{currency(product.price)}</span><span>{currency(average(input.competitors.map((item) => item.price)))}</span><span className="positive">watch</span></div>
                    <div className="table-row"><span>Rating</span><span>{product.rating.toFixed(2)}</span><span>{average(input.competitors.map((item) => item.rating)).toFixed(2)}</span><span className="positive">trust gap</span></div>
                    <div className="table-row"><span>Reviews</span><span>{product.reviews.toLocaleString()}</span><span>{Math.round(average(input.competitors.map((item) => item.reviews))).toLocaleString()}</span><span className="negative">build base</span></div>
                  </div>
                </article>

                <article className="panel questions-panel">
                  <div className="panel-heading"><h2>Buyer Questions Insights</h2><span>{input.buyerQuestions.length} themes</span></div>
                  <div className="question-list">
                    {input.buyerQuestions.map((question) => (
                      <div className="question-row" key={question.questionId}><span>{question.text}</span><strong>{question.frequency}</strong></div>
                    ))}
                  </div>
                </article>

                <article className="panel action-panel">
                  <div className="panel-heading"><h2>AI Action Plan</h2><span>{report.actions.length} actions</span></div>
                  <div className="action-plan">
                    {report.actions.map((action, index) => (
                      <div className="action-item" key={`${action.area}-${index}`}>
                        <span className="action-number">{index + 1}</span>
                        <p>{action.action}</p>
                        <b className={action.priority.toLowerCase()}>{action.priority}</b>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </section>
          ) : (
            <section className="analysis-view">
              <section className="pre-grid">
                <article className="panel pre-input-panel">
                  <div className="panel-heading"><h2>Pre-Launch Product Input</h2><span>Idea</span></div>
                  <form className="pre-form">
                    <label>
                      Product idea
                      <select value={preIdeaIndex} onChange={(event) => setPreIdeaIndex(Number(event.target.value))}>
                        {preIdeas.map((idea, index) => (
                          <option key={idea.title} value={index}>{idea.title}</option>
                        ))}
                      </select>
                    </label>
                    <label>Product title<input value={selectedPreIdea.title} readOnly /></label>
                    <label>Shopee category<input value={selectedPreIdea.category} readOnly /></label>
                    <label>Target price<input value={currency(selectedPreIdea.price)} readOnly /></label>
                  </form>
                </article>
                <article className="panel pre-decision-panel">
                  <div className="panel-heading"><h2>Launch Decision</h2><span>{selectedPreIdea.score + 8}% confidence</span></div>
                  <div className="decision-card">
                    <div>
                      <span>Recommendation</span>
                      <strong>{selectedPreIdea.score >= 78 ? "Launch with focused positioning" : "Launch after improvements"}</strong>
                      <p>{selectedPreIdea.title} should launch only after the first action item is reflected in listing images and copy.</p>
                    </div>
                    <div className="score-ring" style={{ background: `conic-gradient(#ee4d2d 0 ${selectedPreIdea.score}%, #eef0f4 ${selectedPreIdea.score}% 100%)` }}>{selectedPreIdea.score}</div>
                  </div>
                </article>
                <article className="panel pre-metrics-panel">
                  <div className="panel-heading"><h2>Market Readiness</h2><span>Before launch</span></div>
                  <div className="pre-metrics">
                    {["Demand", "Competition", "Margin", "Differentiation", "Readiness"].map((label, index) => (
                      <div className="pre-metric watch" key={label}><span>{label}</span><strong>{selectedPreIdea.metrics[index]}</strong><p>Pre-launch signal</p></div>
                    ))}
                  </div>
                </article>
                <article className="panel pre-actions-panel">
                  <div className="panel-heading"><h2>Launch Action Plan</h2><span>{selectedPreIdea.actions.length} actions</span></div>
                  <div className="action-plan">
                    {selectedPreIdea.actions.map((action, index) => (
                      <div className="action-item" key={action}><span className="action-number">{index + 1}</span><p>{action}</p><b className={index === 0 ? "high" : "medium"}>{index === 0 ? "High" : "Medium"}</b></div>
                    ))}
                  </div>
                </article>
              </section>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function KpiCard({ accent, icon, label, value, detail }: { accent: string; icon: string; label: string; value: string; detail: string }) {
  return (
    <article className={`kpi-card accent-${accent}`}>
      <div className="kpi-top"><span className={`kpi-icon ${icon}`} /><span>{label}</span></div>
      <strong>{value}</strong>
      <small>{detail}</small>
      <div className="sparkline"><MiniSpark /></div>
    </article>
  );
}

function FunnelRow({ label, value, rate }: { label: string; value: string; rate: string }) {
  return <div className="funnel-row"><span>{label}</span><strong>{value}</strong><small>{rate}</small><b>+12.4%</b></div>;
}

function MiniSpark() {
  return <svg viewBox="0 0 150 42" aria-hidden="true"><path d="M4 30 L28 27 L52 29 L76 20 L100 18 L124 12 L146 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>;
}

function MiniTrend() {
  return (
    <div className="line-chart">
      <svg viewBox="0 0 640 260" role="img" aria-label="Sales trend chart">
        <line x1="38" x2="602" y1="48" y2="48" className="grid-line" />
        <line x1="38" x2="602" y1="104" y2="104" className="grid-line" />
        <line x1="38" x2="602" y1="160" y2="160" className="grid-line" />
        <path d="M38 188 L160 126 L282 88 L404 150 L526 92 L602 116" className="trend-line current" />
        <path d="M38 210 L160 172 L282 130 L404 190 L526 142 L602 156" className="trend-line previous" />
      </svg>
    </div>
  );
}

function applyTimeframe(input: PostLaunchInput, timeframe: (typeof timeframes)[number]): PostLaunchInput {
  const adjusted = structuredClone(input);
  const base = input.product;
  const product = adjusted.product;

  product.views = Math.max(1, Math.round(base.views * timeframe.volumeFactor));
  product.ctr = clamp(base.ctr * timeframe.ctrFactor, 0.005, 0.2);
  product.clicks = Math.max(1, Math.round(product.views * product.ctr));
  product.conversionRate = clamp(base.conversionRate * timeframe.conversionFactor, 0.005, 0.2);
  product.orders = Math.max(1, Math.round(product.clicks * product.conversionRate));
  product.revenue = roundMoney(product.orders * product.price);
  product.adSpend = roundMoney(base.adSpend * timeframe.adSpendFactor);
  product.netMarginPercent = clamp(base.netMarginPercent + timeframe.marginDelta, 0.03, 0.6);
  product.reviews = Math.max(1, Math.round(base.reviews * timeframe.reviewFactor));

  if (adjusted.communication && input.communication) {
    adjusted.communication.totalChats = Math.max(1, Math.round(input.communication.totalChats * timeframe.chatFactor));
    adjusted.communication.averageResponseMinutes = Math.max(1, Math.round(input.communication.averageResponseMinutes * timeframe.responseMinutesFactor));
    adjusted.communication.responseWithinOneHourPercent = clamp(input.communication.responseWithinOneHourPercent + timeframe.oneHourDelta, 0, 1);
    adjusted.communication.unansweredRate = clamp(input.communication.unansweredRate + timeframe.unansweredDelta, 0, 1);
    adjusted.communication.buyerSatisfactionScore = clamp(input.communication.buyerSatisfactionScore + timeframe.csatDelta, 1, 5);
  }

  return adjusted;
}

function imageKind(title: string): "bottle" | "shirt" | "case" {
  if (title.toLowerCase().includes("shirt")) return "shirt";
  if (title.toLowerCase().includes("case")) return "case";
  return "bottle";
}

function productImageSrc(kind: "bottle" | "shirt" | "case"): string {
  const svgs = {
    bottle: `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92"><rect width="92" height="92" rx="14" fill="#fff1ec"/><rect x="35" y="13" width="22" height="11" rx="3" fill="#ee4d2d"/><rect x="30" y="24" width="32" height="54" rx="12" fill="#f97316"/><rect x="37" y="32" width="18" height="32" rx="8" fill="#fed7aa"/></svg>`,
    shirt: `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92"><rect width="92" height="92" rx="14" fill="#eff6ff"/><path d="M32 21l10 8h8l10-8 16 12-8 14-8-4v31H32V43l-8 4-8-14 16-12z" fill="#2563eb"/></svg>`,
    case: `<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92"><rect width="92" height="92" rx="14" fill="#f5f3ff"/><rect x="28" y="12" width="36" height="68" rx="10" fill="#7c3aed"/><rect x="33" y="18" width="26" height="56" rx="7" fill="#ddd6fe"/></svg>`
  };
  return `data:image/svg+xml,${encodeURIComponent(svgs[kind])}`;
}

function shortProductName(title: string): string {
  return title.replace("Insulated Stainless Steel ", "").replace("Shockproof Clear ", "");
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2 }).format(value);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function healthLabel(value: number): string {
  if (value >= 80) return "Strong";
  if (value >= 65) return "Good";
  if (value >= 50) return "Needs action";
  return "High risk";
}
