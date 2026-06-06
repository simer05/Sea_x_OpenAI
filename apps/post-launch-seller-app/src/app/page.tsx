"use client";

import { useMemo, useState } from "react";
import { postLaunchSamples } from "@adaptlink/shared-data";
import { analyzePostLaunchProduct } from "@adaptlink/post-launch-seller";
import type { PostLaunchInput, ProductHealthBreakdown } from "@adaptlink/shared-types";

const inputs = postLaunchSamples as PostLaunchInput[];

const scoreLabels: Array<[keyof ProductHealthBreakdown, string]> = [
  ["conversion", "Conversion"],
  ["margin", "Margin"],
  ["reviewRating", "Reviews"],
  ["competitorPosition", "Competition"],
  ["traffic", "Traffic"],
  ["customerInteraction", "Buyer clarity"],
  ["fulfillment", "Fulfilment"]
];

export default function Page() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const input = inputs[selectedIndex];
  const report = useMemo(() => analyzePostLaunchProduct(input), [input]);
  const product = input.product;
  const roas = product.adSpend > 0 ? product.revenue / product.adSpend : 0;

  return (
    <div className="seller-frame">
      <aside className="seller-sidebar" aria-label="Seller navigation">
        <div className="seller-brand">
          <span className="seller-bag">S</span>
          <div>
            <strong>Shopee Seller</strong>
            <small>AdaptLink Lab</small>
          </div>
        </div>
        <nav>
          <a className="active" href="#">Business Insights</a>
          <a href="#">Products</a>
          <a href="#">Marketing Centre</a>
          <a href="#">Customer Service</a>
          <a href="#">Shop Health</a>
        </nav>
      </aside>

      <main className="dashboard-shell">
        <header className="seller-topbar">
          <div>
            <p className="eyebrow">Post-launch seller intelligence</p>
            <h1>{product.title}</h1>
            <p className="subhead">
              {input.context?.segment ?? "Seller product"} | {product.category} | {product.productId}
            </p>
          </div>
          <div className="topbar-actions">
            <label className="product-picker">
              <span>Product</span>
              <select value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
                {inputs.map((item, index) => (
                  <option key={item.product.productId} value={index}>
                    {item.product.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="openai-badge" aria-label="Powered by OpenAI">
              <span className="openai-mark">OpenAI</span>
              <strong>AI routed</strong>
            </div>
          </div>
        </header>

        <section className="summary-band" aria-label="Product summary">
          <div className="health-meter">
            <span className="meter-label">Product Health</span>
            <strong>{report.health.overall}</strong>
            <span className="meter-caption">{healthLabel(report.health.overall)}</span>
          </div>
          <div className="diagnosis">
            <h2>Diagnosis</h2>
            <p>{report.diagnosis}</p>
          </div>
          <div className="primary-action">
            <span>Top revenue move</span>
            <strong>{report.actions[0]?.area ?? "Monitor"}</strong>
            <p>{report.actions[0]?.expectedImpact ?? "Keep watching product health."}</p>
          </div>
        </section>

        <section className="metric-grid" aria-label="Key metrics">
          <Metric label="Revenue" value={currency(product.revenue)} detail={`${product.orders} orders`} />
          <Metric label="CTR" value={percent(product.ctr)} detail={`${product.clicks.toLocaleString()} clicks from views`} />
          <Metric label="Click-to-order" value={percent(product.conversionRate)} detail="orders divided by clicks" />
          <Metric label="Net margin" value={percent(product.netMarginPercent)} detail={`ROAS ${roas.toFixed(1)}x`} />
          <Metric label="Rating" value={product.rating.toFixed(2)} detail={`${product.reviews} reviews`} />
          <Metric label="Stock" value={product.stock.toLocaleString()} detail="units available" />
        </section>

        <section className="selector-strip" aria-label="Product selector cards">
          {inputs.map((item, index) => (
            <button
              className={index === selectedIndex ? "product-tab active" : "product-tab"}
              key={item.product.productId}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <strong>{item.product.title}</strong>
              <span>{item.product.category}</span>
            </button>
          ))}
        </section>

        <section className="two-column">
          <div className="panel">
            <div className="panel-heading">
              <span>Health Graph</span>
              <strong>Weak spots first</strong>
            </div>
            <div className="mini-chart">
              {scoreLabels.map(([key, label]) => (
                <ChartBar key={key} label={label} value={report.health[key]} />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <span>Communication Experience</span>
              <strong>{input.communication?.totalChats ?? 0} chats</strong>
            </div>
            <div className="communication-grid">
              <MetricMini label="Avg response" value={`${input.communication?.averageResponseMinutes ?? 0}m`} />
              <MetricMini label="Within 1h" value={percent(input.communication?.responseWithinOneHourPercent ?? 0)} />
              <MetricMini label="Unanswered" value={percent(input.communication?.unansweredRate ?? 0)} />
              <MetricMini label="CSAT" value={`${(input.communication?.buyerSatisfactionScore ?? 0).toFixed(1)}/5`} />
            </div>
            <p className="panel-note">CTR means click-through rate: clicks divided by product views or impressions.</p>
          </div>
        </section>

        <section className="two-column">
          <div className="panel">
            <div className="panel-heading">
              <span>Category-Specific Trust Signals</span>
              <strong>{input.context?.segment ?? "Product context"}</strong>
            </div>
            <div className="trust-list">
              {input.context?.trustSignals.map((signal) => (
                <article className="trust-card" key={signal.label}>
                  <strong>{signal.label}</strong>
                  <p>{signal.evidence}</p>
                  <small>{signal.action}</small>
                </article>
              ))}
            </div>
            <p className="panel-note">{input.context?.nonApplicableSignals.join(" ")}</p>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <span>OpenAI Usage Plan</span>
              <strong>Efficient routing</strong>
            </div>
            <div className="ai-route-list">
              <div><b>Agent workflow</b><span>Coordinator routes data to specialist agents, then merges one action plan.</span></div>
              <div><b>gpt-5.4-mini</b><span>Extract review themes, chat themes, and data quality flags.</span></div>
              <div><b>gpt-5.5</b><span>Deep revenue diagnosis and tradeoff reasoning.</span></div>
              <div><b>Structured outputs</b><span>Return stable JSON for dashboard cards and actions.</span></div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <span>Revenue Action Plan</span>
            <strong>{report.actions.length} priorities</strong>
          </div>
          <div className="action-grid">
            {report.actions.map((action, index) => (
              <article className="action-card" key={`${action.area}-${index}`}>
                <div className="action-index">{index + 1}</div>
                <div>
                  <div className="action-title">
                    <span className={`priority ${action.priority.toLowerCase()}`}>{action.priority}</span>
                    <strong>{action.area}</strong>
                  </div>
                  <p>{action.action}</p>
                  <small>{action.revenueLogic}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ChartBar({ label, value }: { label: string; value: number }) {
  const state = value < 50 ? "weak" : value < 70 ? "watch" : "strong";

  return (
    <div className="chart-row">
      <span>{label}</span>
      <div>
        <i className={state} style={{ height: `${Math.max(value, 8)}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 2
  }).format(value);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function healthLabel(value: number): string {
  if (value >= 80) return "Strong";
  if (value >= 65) return "Good";
  if (value >= 50) return "Needs action";
  return "High risk";
}
