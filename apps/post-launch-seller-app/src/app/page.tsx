import { postLaunchSample } from "@adaptlink/shared-data";
import { analyzePostLaunchProduct } from "@adaptlink/post-launch-seller";
import type { CompetitorSnapshot, PostLaunchInput, ProductHealthBreakdown } from "@adaptlink/shared-types";

const input = postLaunchSample as PostLaunchInput;
const report = analyzePostLaunchProduct(input);

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
  const product = input.product;
  const averageCompetitorPrice = average(input.competitors.map((competitor) => competitor.price));
  const averageCompetitorRating = average(input.competitors.map((competitor) => competitor.rating));
  const averageCompetitorReviews = Math.round(average(input.competitors.map((competitor) => competitor.reviews)));
  const roas = product.adSpend > 0 ? product.revenue / product.adSpend : 0;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Post-launch seller intelligence</p>
          <h1>{product.title}</h1>
          <p className="subhead">
            Live-product health, revenue leakage, competitor pressure, and next actions for Shopee Singapore sellers.
          </p>
        </div>
        <div className="status-panel" aria-label="Current data status">
          <span className="status-dot" />
          <div>
            <strong>Mock mode</strong>
            <span>Ready to switch to Shopee API data</span>
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
        <Metric label="CTR" value={percent(product.ctr)} detail={`${product.clicks.toLocaleString()} clicks`} />
        <Metric label="Click-to-order" value={percent(product.conversionRate)} detail="orders divided by clicks" />
        <Metric label="Net margin" value={percent(product.netMarginPercent)} detail={`ROAS ${roas.toFixed(1)}x`} />
        <Metric label="Rating" value={product.rating.toFixed(2)} detail={`${product.reviews} reviews`} />
        <Metric label="Stock" value={product.stock.toLocaleString()} detail="units available" />
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-heading">
            <span>Score Breakdown</span>
            <strong>{report.health.overall}/100</strong>
          </div>
          <div className="score-list">
            {scoreLabels.map(([key, label]) => (
              <ScoreRow key={key} label={label} value={report.health[key]} />
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <span>Funnel</span>
            <strong>{product.category}</strong>
          </div>
          <div className="funnel">
            <FunnelStep label="Visibility" value={product.views} detail="listing impressions/views" />
            <FunnelStep label="Clicks" value={product.clicks} detail={percent(product.ctr)} />
            <FunnelStep label="Orders" value={product.orders} detail={percent(product.conversionRate)} />
          </div>
          <p className="panel-note">
            Conversion is treated as click-to-order for this mock dataset. When Shopee data is connected, this should
            map to the exact seller metric returned by the API/export.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <span>Competitor Benchmark</span>
          <strong>
            Avg {currency(averageCompetitorPrice)} | {averageCompetitorRating.toFixed(2)} rating |{" "}
            {averageCompetitorReviews.toLocaleString()} reviews
          </strong>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Competitor</th>
                <th>Price</th>
                <th>Rating</th>
                <th>Reviews</th>
                <th>Voucher</th>
                <th>Gap to watch</th>
              </tr>
            </thead>
            <tbody>
              {input.competitors.map((competitor) => (
                <CompetitorRow key={competitor.competitorId} competitor={competitor} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="panel-heading">
            <span>Buyer Questions</span>
            <strong>{totalQuestionFrequency(input.buyerQuestions)} signals</strong>
          </div>
          <div className="signal-list">
            {input.buyerQuestions.map((question) => (
              <div className="signal-row" key={question.questionId}>
                <div>
                  <strong>{question.theme}</strong>
                  <span>{question.text}</span>
                </div>
                <b>{question.frequency}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <span>Review Themes</span>
            <strong>{input.reviews.length} samples</strong>
          </div>
          <div className="review-list">
            {input.reviews.map((review) => (
              <article className={`review-row ${review.sentiment}`} key={review.reviewId}>
                <div>
                  <strong>{review.theme}</strong>
                  <span>{review.text}</span>
                </div>
                <b>{review.rating}/5</b>
              </article>
            ))}
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

      <section className="warning-band" aria-label="Data quality warnings">
        <div>
          <span>Data quality</span>
          <strong>Use this for demo logic, not final live claims yet.</strong>
        </div>
        <ul>
          {report.dataQualityWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      </section>
    </main>
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

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-row">
      <div className="score-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="bar-track" aria-hidden="true">
        <div className={value < 50 ? "bar-fill weak" : value < 70 ? "bar-fill watch" : "bar-fill strong"} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function FunnelStep({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="funnel-step">
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      <small>{detail}</small>
    </div>
  );
}

function CompetitorRow({ competitor }: { competitor: CompetitorSnapshot }) {
  return (
    <tr>
      <td>
        <strong>{competitor.title}</strong>
        <span>{competitor.keyStrength}</span>
      </td>
      <td>{currency(competitor.price)}</td>
      <td>{competitor.rating.toFixed(2)}</td>
      <td>{competitor.reviews.toLocaleString()}</td>
      <td>{competitor.voucherPercent}%</td>
      <td>{competitor.keyWeakness}</td>
    </tr>
  );
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function totalQuestionFrequency(questions: PostLaunchInput["buyerQuestions"]): number {
  return questions.reduce((sum, question) => sum + question.frequency, 0);
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
  if (value >= 80) {
    return "Strong";
  }
  if (value >= 65) {
    return "Good";
  }
  if (value >= 50) {
    return "Needs action";
  }
  return "High risk";
}
