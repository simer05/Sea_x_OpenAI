"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { postLaunchSamples } from "@adaptlink/shared-data";
import { analyzePostLaunchProduct } from "@adaptlink/post-launch-seller";
import type { PostLaunchInput } from "@adaptlink/shared-types";

const inputs = postLaunchSamples as PostLaunchInput[];

const timeframes = [
  { label: "Last 30 days", volumeFactor: 0.34, ctrFactor: 0.98, conversionFactor: 0.92, adSpendFactor: 0.42, reviewFactor: 0.28, marginDelta: -0.02 },
  { label: "Last 3 months", volumeFactor: 1, ctrFactor: 1, conversionFactor: 1, adSpendFactor: 1, reviewFactor: 1, marginDelta: 0 },
  { label: "Last 6 months", volumeFactor: 1.92, ctrFactor: 1.04, conversionFactor: 1.06, adSpendFactor: 1.78, reviewFactor: 1.72, marginDelta: 0.01 }
];

const categorySuggestions = [
  "Mobile & Gadgets > Mobile Accessories > Cases Covers & Skins",
  "Home & Living > Kitchenware > Water Bottles",
  "Men Clothes > Tops > T-Shirts",
  "Women Clothes > Tops > T-Shirts",
  "Sports & Outdoors > Sports Accessories > Hydration Bottles",
  "Beauty > Skincare > Serum"
];

type Mode = "pre" | "post";

type PreForm = {
  title: string;
  category: string;
  productType: string;
  price: string;
  launchStock: string;
  shippingCost: string;
  packagingCost: string;
  adCost: string;
  targetArea: string;
  colors: string;
  features: string;
  description: string;
  keywords: string;
  photoName: string;
  photoDataUrl: string;
};

type PreReport = ReturnType<typeof analyzePreLaunch>;

type SellerPatch = {
  field: keyof PreForm;
  value: string;
  reason: string;
};

type SellerAiInsight = {
  modeUsed: "openai" | "fallback";
  summary: string;
  imageUnderstanding: string;
  safeChanges: SellerPatch[];
  blockedChanges: SellerPatch[];
  actionPlan: Array<{
    title: string;
    severity: "High" | "Medium" | "Low";
    expectedImpact: string;
    sellerStep: string;
  }>;
};

type PreDraft = {
  form: PreForm;
  insight: SellerAiInsight;
};

const emptyPreForm: PreForm = {
  title: "",
  category: "",
  productType: "",
  price: "",
  launchStock: "",
  shippingCost: "",
  packagingCost: "",
  adCost: "",
  targetArea: "Islandwide Singapore",
  colors: "",
  features: "",
  description: "",
  keywords: "",
  photoName: "",
  photoDataUrl: ""
};

export default function Page() {
  const [mode, setMode] = useState<Mode>("post");
  const [postInputs, setPostInputs] = useState<PostLaunchInput[]>(inputs);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedTimeframeIndex, setSelectedTimeframeIndex] = useState(1);
  const [preForm, setPreForm] = useState<PreForm>(emptyPreForm);
  const [preReport, setPreReport] = useState<PreReport | null>(null);
  const [aiInsight, setAiInsight] = useState<SellerAiInsight | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingSafeChanges, setPendingSafeChanges] = useState<SellerPatch[]>([]);
  const [preDraft, setPreDraft] = useState<PreDraft | null>(null);
  const [preManualEntry, setPreManualEntry] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Array<keyof PreForm>>([]);

  const timeframe = timeframes[selectedTimeframeIndex];
  const selectedInput = selectedIndex === null ? null : applyTimeframe(postInputs[selectedIndex], timeframe);
  const postReport = useMemo(() => selectedInput ? analyzePostLaunchProduct(selectedInput) : null, [selectedInput]);

  useEffect(() => {
    if (mode !== "post" || !selectedInput || !postReport) return;
    setAiInsight(null);
    setPendingSafeChanges([]);
    void requestSellerAi("post", selectedInput, postReport);
  }, [mode, selectedIndex, selectedTimeframeIndex]);

  function updatePreField(field: keyof PreForm, value: string) {
    setPreManualEntry(true);
    setAiFilledFields((fields) => fields.filter((item) => item !== field));
    setPreForm((current) => {
      const updated = { ...current, [field]: value };
      setPreReport(isPreFormAnalyzable(updated) ? analyzePreLaunch(updated) : null);
      return updated;
    });
    setAiInsight(null);
    setPendingSafeChanges([]);
    setPreDraft(null);
  }

  async function updatePrePhoto(file: File | null) {
    if (!file) {
      updatePreField("photoName", "");
      updatePreField("photoDataUrl", "");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const photoDataUrl = String(reader.result || "");
      const imageOnlyForm = { ...emptyPreForm, photoName: file.name, photoDataUrl };
      setPreForm(imageOnlyForm);
      setPreReport(null);
      setAiInsight(null);
      setPendingSafeChanges([]);
      setPreDraft(null);
      setAiFilledFields([]);
      setPreManualEntry(true);
      const insight = await requestSellerAi("pre", imageOnlyForm, {}, photoDataUrl);
      if (insight) {
        const draftForm = buildPreDraftForm(imageOnlyForm, insight);
        const report = analyzePreLaunch(draftForm);
        setPreForm(draftForm);
        setPreReport(report);
        setAiInsight(insight);
        setPendingSafeChanges([]);
        setAiFilledFields(aiRecommendedFields(insight));
        void requestSellerAi("pre", draftForm, report, draftForm.photoDataUrl);
      }
    };
    reader.readAsDataURL(file);
  }

  function runPreAnalysis(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const report = analyzePreLaunch(preForm);
    setPreReport(report);
    void requestSellerAi("pre", preForm, report);
  }

  function applyRecommendedPreChanges() {
    if (!preReport) return;
    const updated = applySafePreLaunchChanges(preForm, preReport);
    setPreForm(updated);
    setPreReport(analyzePreLaunch(updated));
  }

  async function requestSellerAi(aiMode: Mode, productInput: PreForm | PostLaunchInput, computedReport: unknown, photoDataUrlOverride?: string) {
    setAiLoading(true);
    try {
      const response = await fetch("/api/seller-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: aiMode,
          productInput,
          computedReport,
          photoDataUrl: aiMode === "pre" ? photoDataUrlOverride ?? ("photoDataUrl" in productInput ? productInput.photoDataUrl : preForm.photoDataUrl) : undefined
        })
      });
      const payload = await response.json() as SellerAiInsight;
      setAiInsight(payload);
      setPendingSafeChanges([]);
      return payload;
    } catch {
      setAiInsight(null);
      setPendingSafeChanges([]);
      return null;
    } finally {
      setAiLoading(false);
    }
  }

  function confirmPreDraft() {
    if (!preDraft) return;
    const report = analyzePreLaunch(preDraft.form);
    setPreForm(preDraft.form);
    setPreReport(report);
    setAiInsight(preDraft.insight);
    setPendingSafeChanges([]);
    setAiFilledFields(aiRecommendedFields(preDraft.insight));
    setPreManualEntry(true);
    void requestSellerAi("pre", preDraft.form, report, preDraft.form.photoDataUrl);
  }

  function startManualPreEntry() {
    setPreManualEntry(true);
    setPreDraft(null);
    setAiInsight(null);
    setPendingSafeChanges([]);
    setAiFilledFields([]);
  }

  function previewSafeChanges() {
    if (!aiInsight?.safeChanges.length) return;
    setPendingSafeChanges(aiInsight.safeChanges);
  }

  function confirmApplySafeChanges() {
    if (!pendingSafeChanges.length) return;
    const approved = window.confirm(`Apply ${pendingSafeChanges.length} safe AI-recommended change(s)? Risky edits like title, category, price, and photo will remain blocked.`);
    if (!approved) return;

    const updated = pendingSafeChanges.reduce((current, change) => {
      if (!isSafePreField(change.field)) return current;
      return { ...current, [change.field]: change.value };
    }, preForm);
    setPreForm(updated);
    setPreReport(analyzePreLaunch(updated));
    setPendingSafeChanges([]);
  }

  function addPreListingToPostLaunch() {
    if (!preReport) return;
    const approved = window.confirm("Add this validated product as a new seller listing in the post-launch dashboard?");
    if (!approved) return;
    const listing = createPostLaunchListing(preForm, preReport, postInputs.length + 1);
    setPostInputs((current) => [...current, listing]);
    setMode("post");
    setSelectedIndex(postInputs.length);
  }

  function cancelPreLaunchProduct() {
    const hasCurrentProduct = Object.values(preForm).some((value) => value.trim()) || Boolean(preReport || aiInsight);
    const approved = !hasCurrentProduct || window.confirm("Clear this pre-launch draft and choose a different product?");
    if (!approved) return;

    setPreForm(emptyPreForm);
    setPreReport(null);
    setAiInsight(null);
    setAiLoading(false);
    setPendingSafeChanges([]);
    setPreDraft(null);
    setPreManualEntry(false);
    setAiFilledFields([]);
  }

  return (
    <div className="seller-console two-mode-console">
      <aside className="seller-sidebar" aria-label="Seller intelligence navigation">
        <div className="seller-utility">
          <span>Seller Centre</span>
          <span>Mock Shopee SG</span>
          <span className="seller-utility-spacer" />
          <span>Notifications</span>
          <span>Help</span>
          <span>English</span>
        </div>

        <div className="shopee-lockup">
          <div className="shopee-logo" aria-label="AdaptLink">
            <span className="bag-mark">A</span>
            <strong>Shopee Seller</strong>
          </div>
          <div className="seller-search-shell" aria-label="Seller workspace context">
            <span>Seller Perspective</span>
            <strong>{mode === "post" ? "Optimize live listings, reviews, and campaign spend" : "Validate new listing ideas before launch"}</strong>
          </div>
        </div>

        <nav className="side-nav compact-nav" aria-label="Workflow">
          <button className={mode === "pre" ? "mode-nav active" : "mode-nav"} type="button" onClick={() => setMode("pre")}>
            <strong>Pre-Launch</strong>
            <span>Validate a new product idea</span>
          </button>
          <button className={mode === "post" ? "mode-nav active" : "mode-nav"} type="button" onClick={() => setMode("post")}>
            <strong>Post-Launch</strong>
            <span>Improve live Shopee items</span>
          </button>
        </nav>

      </aside>

      <main className="seller-main">
        <header className="global-bar">
          <div className="brand-area">
            <span className="adapt-mark" />
            <strong>{mode === "post" ? "Post-Launch Seller Intelligence" : "Pre-Launch Seller Intelligence"}</strong>
          </div>
          <div className="store-area">
            <div className="openai-pill" aria-label="Powered by OpenAI">
              <span className="openai-logo" />
              <strong>OpenAI-ready insights</strong>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="page-head">
            <div>
              <h1>{mode === "post" ? "Post-Launch Product Dashboard" : "Pre-Launch Product Validation"}</h1>
              <p>
                {mode === "post"
                  ? "Choose a live seller product to generate product health, market trend, competitor, review, and action dashboards."
                  : "Enter a new product idea to estimate launch fit, comparison pressure, Singapore target area, and initial stock size."}
              </p>
            </div>
            {mode === "post" ? (
              <div className="head-actions">
                <label className="range-picker">
                  <span className="calendar-icon" />
                  <select value={selectedTimeframeIndex} onChange={(event) => setSelectedTimeframeIndex(Number(event.target.value))}>
                    {timeframes.map((item, index) => <option key={item.label} value={index}>{item.label}</option>)}
                  </select>
                </label>
              </div>
            ) : null}
          </section>

          {mode === "pre" ? (
            <PreLaunchView
              aiInsight={aiInsight}
              aiLoading={aiLoading}
              aiFilledFields={aiFilledFields}
              form={preForm}
              pendingSafeChanges={pendingSafeChanges}
              preDraft={preDraft}
              preManualEntry={preManualEntry}
              report={preReport}
              onAddListing={addPreListingToPostLaunch}
              onApplyRecommendations={applyRecommendedPreChanges}
              onCancelProduct={cancelPreLaunchProduct}
              onChange={updatePreField}
              onConfirmPreDraft={confirmPreDraft}
              onConfirmApplySafeChanges={confirmApplySafeChanges}
              onPhotoChange={updatePrePhoto}
              onPreviewSafeChanges={previewSafeChanges}
              onStartManualEntry={startManualPreEntry}
              onSubmit={runPreAnalysis}
            />
          ) : (
            <PostLaunchView aiInsight={aiInsight} aiLoading={aiLoading} inputs={postInputs} selectedIndex={selectedIndex} input={selectedInput} report={postReport} timeframeLabel={timeframe.label} onSelect={setSelectedIndex} />
          )}
        </div>
      </main>
    </div>
  );
}

function PreLaunchView({
  aiInsight,
  aiLoading,
  aiFilledFields,
  form,
  pendingSafeChanges,
  preDraft,
  preManualEntry,
  report,
  onAddListing,
  onApplyRecommendations,
  onCancelProduct,
  onChange,
  onConfirmPreDraft,
  onConfirmApplySafeChanges,
  onPhotoChange,
  onPreviewSafeChanges,
  onStartManualEntry,
  onSubmit
}: {
  aiInsight: SellerAiInsight | null;
  aiLoading: boolean;
  aiFilledFields: Array<keyof PreForm>;
  form: PreForm;
  pendingSafeChanges: SellerPatch[];
  preDraft: PreDraft | null;
  preManualEntry: boolean;
  report: PreReport | null;
  onAddListing: () => void;
  onApplyRecommendations: () => void;
  onCancelProduct: () => void;
  onChange: (field: keyof PreForm, value: string) => void;
  onConfirmPreDraft: () => void;
  onConfirmApplySafeChanges: () => void;
  onPhotoChange: (file: File | null) => void;
  onPreviewSafeChanges: () => void;
  onStartManualEntry: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const fieldClass = (field: keyof PreForm) => aiFilledFields.includes(field) ? "ai-filled-field" : undefined;
  const hasCurrentProduct = Object.values(form).some((value) => value.trim()) || Boolean(report);
  return (
    <section className="analysis-view">
      <section className="pre-workspace">
        <article className="panel pre-input-panel">
          <div className="panel-heading">
            <h2>New Product Details</h2>
            <div className="panel-heading-actions">
              <span>Editable seller review</span>
              {hasCurrentProduct ? <button className="panel-action-button secondary" type="button" onClick={onCancelProduct}>Change Product</button> : null}
            </div>
          </div>
          <form className="pre-form live-pre-form" onSubmit={onSubmit}>
            <label className={fieldClass("title")}>Product title<input value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="e.g. Purple iPhone 15 case with strap" required /></label>
            <label className={fieldClass("category")}>Shopee category<input list="category-suggestions" value={form.category} onChange={(event) => onChange("category", event.target.value)} placeholder="Type or choose category path" required /></label>
            <datalist id="category-suggestions">{categorySuggestions.map((item) => <option key={item} value={item} />)}</datalist>
            <label className={fieldClass("productType")}>Product type<input value={form.productType} onChange={(event) => onChange("productType", event.target.value)} placeholder="e.g. phone case, thermal bottle, custom tee" required /></label>
            <div className="form-pair">
              <label className={fieldClass("price")}>Selling price<input type="number" min="0" step="0.1" value={form.price} onChange={(event) => onChange("price", event.target.value)} placeholder="SGD" required /></label>
              <label className={fieldClass("launchStock")}>Initial launch stock<input type="number" min="0" step="1" value={form.launchStock} onChange={(event) => onChange("launchStock", event.target.value)} placeholder="Units seller plans to list" /></label>
            </div>
            <div className="form-pair">
              <label className={fieldClass("shippingCost")}>Shipping/order<input type="number" min="0" step="0.1" value={form.shippingCost} onChange={(event) => onChange("shippingCost", event.target.value)} placeholder="SGD" /></label>
              <label className={fieldClass("packagingCost")}>Packaging/order<input type="number" min="0" step="0.1" value={form.packagingCost} onChange={(event) => onChange("packagingCost", event.target.value)} placeholder="SGD" /></label>
            </div>
            <div className="form-pair">
              <label className={fieldClass("adCost")}>Ad cost/order<input type="number" min="0" step="0.1" value={form.adCost} onChange={(event) => onChange("adCost", event.target.value)} placeholder="SGD" /></label>
              <label className={fieldClass("targetArea")}>Target area in Singapore<input value={form.targetArea} onChange={(event) => onChange("targetArea", event.target.value)} placeholder="Central, East, West, North-East, Islandwide" /></label>
            </div>
            <label className={fieldClass("colors")}>Colors<input value={form.colors} onChange={(event) => onChange("colors", event.target.value)} placeholder="purple, black, white" /></label>
            <label className={fieldClass("features")}>Features<textarea rows={3} value={form.features} onChange={(event) => onChange("features", event.target.value)} placeholder="Comma-separated features" /></label>
            <label className={fieldClass("description")}>Description<textarea rows={4} value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Main buyer benefits and proof points" required /></label>
            <label className={fieldClass("keywords")}>Keywords<input value={form.keywords} onChange={(event) => onChange("keywords", event.target.value)} placeholder="Comma-separated buyer search keywords" /></label>
            <div className="edit-hint">Upload a photo in the panel on the right to let OpenAI fill this form. Every field remains editable for seller review.</div>
          </form>
        </article>

        {report ? (
          <PreLaunchReport
            aiInsight={aiInsight}
            aiLoading={aiLoading}
            pendingSafeChanges={pendingSafeChanges}
            report={report}
            onAddListing={onAddListing}
            onApplyRecommendations={onApplyRecommendations}
            onCancelProduct={onCancelProduct}
            onConfirmApplySafeChanges={onConfirmApplySafeChanges}
            onPreviewSafeChanges={onPreviewSafeChanges}
          />
        ) : <EmptyPreLaunch aiLoading={aiLoading} onPhotoChange={onPhotoChange} />}
      </section>
    </section>
  );
}

function EmptyPreLaunch({
  aiLoading,
  onPhotoChange
}: {
  aiLoading: boolean;
  onPhotoChange: (file: File | null) => void;
}) {
  return (
    <article className="panel empty-state-panel">
      <label className="empty-state upload-empty-state" htmlFor="prelaunch-photo-upload">
        <input
          id="prelaunch-photo-upload"
          className="upload-input"
          type="file"
          accept="image/*"
          onChange={(event) => onPhotoChange(event.target.files?.[0] || null)}
        />
        <span className="empty-icon">+</span>
        <h2>No pre-launch product loaded</h2>
        <p>Upload a product photo here. OpenAI will fill the editable form with suggested title, category, price, target region, features, description, and keywords.</p>
        <span className="image-upload-card">
          <strong>{aiLoading ? "Reading product image..." : "Upload Product Photo"}</strong>
          <span>{aiLoading ? "OpenAI is filling the form." : "No image added yet"}</span>
        </span>
      </label>
    </article>
  );
}

function PreDraftReview({ draft, onConfirmPreDraft, onStartManualEntry }: { draft: PreDraft; onConfirmPreDraft: () => void; onStartManualEntry: () => void }) {
  const fields = [
    ["Product title", draft.form.title],
    ["Shopee category", draft.form.category],
    ["Suggested selling price", currency(numberValue(draft.form.price))],
    ["Product type", draft.form.productType],
    ["Target region", draft.form.targetArea],
    ["Features", draft.form.features],
    ["Description", draft.form.description],
    ["Keywords", draft.form.keywords]
  ];
  return (
    <div className="pre-draft-review">
      <div className="panel-heading">
        <h2>OpenAI Draft for Seller Confirmation</h2>
        <span>{draft.insight.modeUsed === "openai" ? "Image understanding" : "Fallback draft"}</span>
      </div>
      <p>{draft.insight.imageUnderstanding}</p>
      <div className="draft-field-grid">
        {fields.map(([label, value]) => (
          <div className="draft-field" key={label}>
            <span>{label}</span>
            <strong>{value || "Needs seller input"}</strong>
          </div>
        ))}
      </div>
      <div className="draft-actions">
        <button className="primary-cta" type="button" onClick={onConfirmPreDraft}>Confirm AI Draft & Analyze</button>
        <button className="manual-entry-button" type="button" onClick={onStartManualEntry}>Update manually</button>
      </div>
    </div>
  );
}

function PreLaunchReport({
  aiInsight,
  aiLoading,
  pendingSafeChanges,
  report,
  onAddListing,
  onApplyRecommendations,
  onCancelProduct,
  onConfirmApplySafeChanges,
  onPreviewSafeChanges
}: {
  aiInsight: SellerAiInsight | null;
  aiLoading: boolean;
  pendingSafeChanges: SellerPatch[];
  report: PreReport;
  onAddListing: () => void;
  onApplyRecommendations: () => void;
  onCancelProduct: () => void;
  onConfirmApplySafeChanges: () => void;
  onPreviewSafeChanges: () => void;
}) {
  return (
    <section className="pre-results">
      <article className="panel pre-decision-panel">
        <div className="panel-heading"><h2>Launch Decision</h2><span>{report.confidence} confidence</span></div>
        <div className="decision-card">
          <div>
            <span>Recommendation</span>
            <strong>{report.recommendation}</strong>
            <p>{report.summary}</p>
          </div>
          <div className="score-ring" style={{ background: `conic-gradient(#ee4d2d 0 ${report.overall}%, #eef0f4 ${report.overall}% 100%)` }}>{report.overall}</div>
        </div>
      </article>

      <article className="panel comparison-panel">
        <div className="panel-heading"><h2>Comparison Snapshot</h2><span>{report.competitors.length} matched competitors</span></div>
        <div className="comparison-cards">
          <InsightBox label="Your price" value={currency(report.price)} detail={report.pricePosition} />
          <InsightBox label="Competitor avg" value={currency(report.competitorAveragePrice)} detail={`Range ${currency(report.competitorMinPrice)} - ${currency(report.competitorMaxPrice)}`} />
          <InsightBox label="Initial stock" value={`${report.stock.suggested} units`} detail={`Suggested range ${report.stock.min}-${report.stock.max}; planned ${report.stock.planned || "not provided"}`} />
          <InsightBox label="Best SG area" value={report.bestRegion.name} detail={report.bestRegion.reason} />
        </div>
      </article>

      <article className="panel pre-metrics-panel">
        <div className="panel-heading"><h2>Current vs Potential Market Fit</h2><span>After suggested fixes</span></div>
        <div className="bar-chart" aria-label="Pre-launch score comparison">
          {report.metricRows.map((row) => (
            <div className="bar-row" key={row.label}>
              <span>{row.label}</span>
              <div className="bar-track"><i style={{ width: `${row.current}%` }} /><b style={{ width: `${row.potential}%` }} /></div>
              <strong>{row.current} → {row.potential}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="panel competitor-match-panel">
        <div className="panel-heading"><h2>Competitor Matches</h2><span>{report.competitors.length} mock Shopee matches</span></div>
        <div className="competitor-match-table">
          <div className="competitor-row head"><span>Competitor</span><span>Match</span><span>Price</span><span>Reviews</span><span>Risk</span></div>
          {report.competitors.map((competitor) => (
            <div className="competitor-row" key={competitor.title}>
              <span>{competitor.title}</span>
              <strong>{competitor.matchScore}/100</strong>
              <span>{currency(competitor.price)}</span>
              <span>{competitor.reviews.toLocaleString()}</span>
              <em>{competitor.risk}</em>
            </div>
          ))}
        </div>
      </article>

      <article className="panel listing-readiness-panel">
        <div className="panel-heading"><h2>Listing Readiness</h2><span>{report.readinessItems.filter((item) => item.status === "complete").length}/{report.readinessItems.length} complete</span></div>
        <div className="readiness-list">
          {report.readinessItems.map((item) => (
            <div className={`readiness-item ${item.status}`} key={item.label}>
              <strong>{item.status === "complete" ? "Complete" : "Missing"}</strong>
              <span>{item.label}</span>
              <p>{item.fix}</p>
            </div>
          ))}
        </div>
      </article>

      <article className="panel region-panel">
        <div className="panel-heading"><h2>Singapore Area Fit</h2><span>{report.bestRegion.name}</span></div>
        <div className="region-mini-grid">
          {report.regions.map((region) => (
            <div className={region.name === report.bestRegion.name ? "region-pill active" : "region-pill"} key={region.name}>
              <strong>{region.name.replace(" Singapore", "")}</strong>
              <span>{region.score}/100</span>
            </div>
          ))}
        </div>
      </article>

      <article className="panel pre-actions-panel">
        <div className="panel-heading">
          <h2>Recommended Changes</h2>
          <div className="panel-button-row">
            <button className="panel-action-button secondary" type="button" onClick={onApplyRecommendations}>Use Rule-Based Safe Changes</button>
            <button
              className="panel-action-button"
              type="button"
              disabled={aiLoading || !aiInsight?.safeChanges.length}
              onClick={onPreviewSafeChanges}
            >
              {aiLoading ? "Loading AI Changes" : aiInsight?.safeChanges.length ? "Preview AI Safe Changes" : "No AI Changes Yet"}
            </button>
          </div>
        </div>
        <div className="action-plan">
          {report.actions.map((action, index) => (
            <div className="action-item" key={action}><span className="action-number">{index + 1}</span><p>{action}</p><b className={index === 0 ? "high" : "medium"}>{index === 0 ? "High" : "Medium"}</b></div>
          ))}
        </div>
      </article>

      <AiAutomationPanel insight={aiInsight} pendingSafeChanges={pendingSafeChanges} onConfirmApplySafeChanges={onConfirmApplySafeChanges} />

      <article className="panel listing-publish-panel">
        <div className="panel-heading"><h2>Seller Approval</h2><span>Human in loop</span></div>
        <p className="panel-note">If the seller is satisfied with the analysis and editable listing details, launch this product into the live post-launch dashboard for monitoring.</p>
        <div className="approval-actions">
          <button className="cancel-product-button" type="button" onClick={onCancelProduct}>Change Product</button>
          <button className="primary-cta" type="button" disabled title="Launch is disabled for this demo.">
            Launch Product
          </button>
        </div>
      </article>
    </section>
  );
}

function PostLaunchView({
  aiInsight,
  aiLoading,
  inputs,
  selectedIndex,
  input,
  report,
  timeframeLabel,
  onSelect
}: {
  aiInsight: SellerAiInsight | null;
  aiLoading: boolean;
  inputs: PostLaunchInput[];
  selectedIndex: number | null;
  input: PostLaunchInput | null;
  report: ReturnType<typeof analyzePostLaunchProduct> | null;
  timeframeLabel: string;
  onSelect: (index: number) => void;
}) {
  if (!input || !report) {
    return (
      <section className="analysis-view">
        <SellerProductGrid inputs={inputs} selectedIndex={selectedIndex} onSelect={onSelect} />
      </section>
    );
  }

  const product = input.product;
  const competitorRank = product.rating >= 4.65 && product.reviews > 250 ? 1 : product.rating >= 4.4 ? 2 : 3;

  return (
    <section className="analysis-view">
      <SellerProductGrid inputs={inputs} selectedIndex={selectedIndex} onSelect={onSelect} />

      <section className="selected-product-strip">
        <img className="selected-product-image" src={productImageSrc(imageKind(product.title))} alt={product.title} />
        <div>
          <span>Selected live item</span>
          <h2>{product.title}</h2>
          <p>{product.productId} · {product.category} · {timeframeLabel}</p>
        </div>
      </section>

      <AiSellerSummaryPanel insight={aiInsight} loading={aiLoading} />

      <section className="kpi-grid compact-kpis" aria-label="Post-launch key metrics">
        <KpiCard accent="orange" icon="sales" label="Sales" value={currency(product.revenue)} detail={`${product.orders} orders`} />
        <KpiCard accent="orange" icon="funnel" label="Conversion Rate" value={percent(product.conversionRate)} detail="orders divided by clicks" />
        <KpiCard accent="green" icon="health" label="Product Health Score" value={`${report.health.overall}/100`} detail={healthLabel(report.health.overall)} />
        <KpiCard accent="orange" icon="margin" label="Net Margin" value={percent(product.netMarginPercent)} detail={`ROAS ${(product.revenue / Math.max(product.adSpend, 1)).toFixed(1)}x`} />
        <KpiCard accent="purple" icon="reviews" label="Reviews" value={product.reviews.toLocaleString()} detail={`${product.rating.toFixed(2)} rating`} />
        <KpiCard accent="blue" icon="trophy" label="Competitor Position" value={`#${competitorRank}`} detail="current benchmark set" />
      </section>

      <section className="post-evaluation-grid">
        <SalesMarketingPanel input={input} timeframeLabel={timeframeLabel} />
        <MarketTrendsPanel input={input} />
        <CompetitorBenchmarkPanel input={input} />
        <HealthDriversPanel report={report} />
        <SellerResponsePanel input={input} report={report} />
        <ReviewInsightsPanel input={input} />
        <ReviewSentimentPanel input={input} />
        <BuyerQuestionsPanel input={input} />
        <ActionPlanPanel report={report} />
        <NextImprovementPanel report={report} />
      </section>
    </section>
  );
}

function InsightBox({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="insight-box"><span>{label}</span><strong>{value}</strong><p>{detail}</p></div>;
}

function AiSellerSummaryPanel({ insight, loading }: { insight: SellerAiInsight | null; loading: boolean }) {
  return (
    <article className="panel ai-summary-panel">
      <div className="panel-heading">
        <h2>AI Seller Summary</h2>
        <span>{loading ? "Generating" : insight ? `${insight.modeUsed === "openai" ? "OpenAI" : "Fallback"} mode` : "Waiting"}</span>
      </div>
      <p>{loading ? "Reading seller metrics, listing details, and uploaded product evidence..." : insight?.summary || "Run analysis or select a live item to generate a concise seller explanation."}</p>
      <div className="ai-image-note">
        <strong>Image understanding</strong>
        <span>{insight?.imageUnderstanding || "Upload a product photo in pre-launch to include visual understanding."}</span>
      </div>
      {insight?.actionPlan?.length ? (
        <div className="ai-ranked-actions">
          {insight.actionPlan.map((action, index) => (
            <div className="ai-ranked-action" key={`${action.title}-${index}`}>
              <span>{index + 1}</span>
              <div>
                <strong>{action.title}</strong>
                <p>{action.sellerStep}</p>
                <small>{action.expectedImpact}</small>
              </div>
              <b className={action.severity.toLowerCase()}>{action.severity}</b>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function AiAutomationPanel({
  insight,
  pendingSafeChanges,
  onConfirmApplySafeChanges
}: {
  insight: SellerAiInsight | null;
  pendingSafeChanges: SellerPatch[];
  onConfirmApplySafeChanges: () => void;
}) {
  return (
    <article className="panel ai-automation-panel">
      <div className="panel-heading">
        <h2>Automated Change Review</h2>
        <span>{pendingSafeChanges.length} safe changes ready</span>
      </div>
      <div className="automation-grid">
        <div>
          <h3>Safe to automate after confirmation</h3>
          {pendingSafeChanges.length ? pendingSafeChanges.map((change) => (
            <div className="automation-row safe" key={`${change.field}-${change.value}`}>
              <strong>{change.field}</strong>
              <p>{change.value}</p>
              <small>{change.reason}</small>
            </div>
          )) : <p className="panel-note">Click “Preview AI Safe Changes” to review proposed edits before applying them.</p>}
        </div>
        <div>
          <h3>Blocked risky auto-edits</h3>
          {insight?.blockedChanges?.length ? insight.blockedChanges.map((change) => (
            <div className="automation-row blocked" key={`${change.field}-${change.value}`}>
              <strong>{change.field}</strong>
              <p>{change.value || "Manual seller approval required"}</p>
              <small>{change.reason}</small>
            </div>
          )) : <p className="panel-note">Title, category, price, and photo changes are blocked from automatic application.</p>}
        </div>
      </div>
      <button className="primary-cta" type="button" disabled={!pendingSafeChanges.length} onClick={onConfirmApplySafeChanges}>Confirm & Apply Safe Changes</button>
    </article>
  );
}

function SellerProductGrid({ inputs, selectedIndex, onSelect }: { inputs: PostLaunchInput[]; selectedIndex: number | null; onSelect: (index: number) => void }) {
  return (
    <section className="seller-product-grid" aria-label="Seller live Shopee products">
      <div className="product-grid-heading">
        <div>
          <h2>Seller Live Shopee Items</h2>
          <p>Select an item to expand market evaluation metrics.</p>
        </div>
        <span>{inputs.length} live items</span>
      </div>
      <div className="live-product-cards">
        {inputs.map((item, index) => (
          <button className={selectedIndex === index ? "live-product-card active" : "live-product-card"} key={item.product.productId} type="button" onClick={() => onSelect(index)}>
            <img src={productImageSrc(imageKind(item.product.title))} alt={item.product.title} />
            <span>
              <strong>{item.product.title}</strong>
              <small>{item.product.productId} · {item.product.category}</small>
            </span>
            <b>{currency(item.product.price)}</b>
            <em>{item.product.orders} orders</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function SalesMarketingPanel({ input, timeframeLabel }: { input: PostLaunchInput; timeframeLabel: string }) {
  const product = input.product;
  const ctrPercent = product.ctr * 100;
  const conversionPercent = product.conversionRate * 100;
  const roas = product.revenue / Math.max(product.adSpend, 1);
  const costPerOrder = product.adSpend / Math.max(product.orders, 1);

  return (
    <article className="panel sales-marketing-panel">
      <div className="panel-heading">
        <h2>Sales & Marketing</h2>
        <span>{timeframeLabel}</span>
      </div>
      <div className="sales-marketing-grid">
        <div className="sales-score-card">
          <span>Revenue</span>
          <strong>{currency(product.revenue)}</strong>
          <p>{product.orders.toLocaleString()} orders from {product.clicks.toLocaleString()} clicks</p>
        </div>
        <div className="sales-score-card">
          <span>Ad Spend</span>
          <strong>{currency(product.adSpend)}</strong>
          <p>{roas.toFixed(1)}x ROAS · {currency(costPerOrder)} per order</p>
        </div>
        <div className="sales-score-card">
          <span>Conversion</span>
          <strong>{percent(product.conversionRate)}</strong>
          <p>{ctrPercent.toFixed(1)}% CTR · {conversionPercent.toFixed(1)}% click-to-order</p>
        </div>
      </div>
      <div className="marketing-funnel" aria-label="Sales funnel">
        <FunnelRow label="Views" value={product.views.toLocaleString()} rate="Top of funnel" />
        <FunnelRow label="Clicks" value={product.clicks.toLocaleString()} rate={`${ctrPercent.toFixed(1)}% CTR`} />
        <FunnelRow label="Orders" value={product.orders.toLocaleString()} rate={`${conversionPercent.toFixed(1)}% CVR`} />
      </div>
    </article>
  );
}

function MarketTrendsPanel({ input }: { input: PostLaunchInput }) {
  const product = input.product;
  return (
    <article className="panel market-trends-panel">
      <div className="panel-heading">
        <h2>Market Trends</h2>
        <span>{trendDemandLabel(product.views, product.orders)} demand</span>
      </div>
      <MiniTrend />
      <div className="market-summary-grid">
        <InsightBox label="Reach" value={product.views.toLocaleString()} detail="Shop and search exposure" />
        <InsightBox label="Sales Velocity" value={`${Math.round(product.orders / 12)}/mo`} detail="Estimated monthly orders" />
        <InsightBox label="Review Trust" value={product.rating.toFixed(2)} detail={`${product.reviews.toLocaleString()} buyer reviews`} />
      </div>
    </article>
  );
}

function CompetitorBenchmarkPanel({ input }: { input: PostLaunchInput }) {
  const product = input.product;
  const competitors = input.competitors.slice(0, 3);
  return (
    <article className="panel competitor-benchmark-panel">
      <div className="panel-heading">
        <h2>Competitor Benchmark</h2>
        <span>{competitors.length} closest Shopee matches</span>
      </div>
      <div className="competitor-benchmark-grid">
        <div className="benchmark-lead">
          <span>Your live item</span>
          <strong>{currency(product.price)}</strong>
          <p>{product.rating.toFixed(2)} rating · {product.reviews.toLocaleString()} reviews · {percent(product.conversionRate)} conversion</p>
        </div>
        {competitors.map((competitor) => (
          <div className="benchmark-card" key={competitor.title}>
            <span>{competitor.title}</span>
            <strong>{currency(competitor.price)}</strong>
            <p>{competitor.rating.toFixed(2)} rating · {competitor.reviews.toLocaleString()} reviews</p>
            <b>{competitor.price < product.price ? "Cheaper" : "Premium"}</b>
          </div>
        ))}
      </div>
    </article>
  );
}

function HealthDriversPanel({ report }: { report: ReturnType<typeof analyzePostLaunchProduct> }) {
  const drivers = [
    ["Conversion", report.health.conversion, "Click-to-order strength"],
    ["Margin", report.health.margin, "Profit after costs and ads"],
    ["Reviews", report.health.reviewRating, "Rating and trust quality"],
    ["Competition", report.health.competitorPosition, "Price, reviews, rating position"],
    ["Traffic", report.health.traffic, "Listing demand and reach"],
    ["Buyer response", report.health.customerInteraction, "Chat speed and answer coverage"],
    ["Fulfillment", report.health.fulfillment, "Refund and cancellation control"]
  ] as const;
  return (
    <article className="panel health-drivers-panel">
      <div className="panel-heading"><h2>Health Score Drivers</h2><span>{report.health.overall}/100 overall</span></div>
      <div className="driver-grid">
        {drivers.map(([label, score, detail]) => <DriverCard key={label} label={label} score={score} detail={detail} />)}
      </div>
    </article>
  );
}

function DriverCard({ label, score, detail }: { label: string; score: number; detail: string }) {
  return (
    <div className="driver-card">
      <div><strong>{label}</strong><b>{score}</b></div>
      <div className="driver-bar"><span style={{ width: `${score}%` }} className={score < 55 ? "danger" : score < 70 ? "warn" : ""} /></div>
      <p>{detail}</p>
    </div>
  );
}

function SellerResponsePanel({ input }: { input: PostLaunchInput; report: ReturnType<typeof analyzePostLaunchProduct> }) {
  const communication = input.communication;
  return (
    <article className="panel seller-response-panel">
      <div className="panel-heading"><h2>Seller Response Experience</h2><span>Response timing should be watched</span></div>
      <div className="response-grid">
        <ResponseMetric label="Avg response" value={communication ? `${communication.averageResponseMinutes}m` : "N/A"} detail="Lower is better" />
        <ResponseMetric label="Within 1h" value={communication ? percent(communication.responseWithinOneHourPercent) : "N/A"} detail="Fast-answer rate" />
        <ResponseMetric label="Unanswered" value={communication ? percent(communication.unansweredRate) : "N/A"} detail="Lost confidence risk" />
        <ResponseMetric label="Buyer CSAT" value={communication ? `${communication.buyerSatisfactionScore.toFixed(1)}/5` : "N/A"} detail="Chat experience" />
      </div>
    </article>
  );
}

function ResponseMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="response-metric"><span>{label}</span><strong>{value}</strong><p>{detail}</p></div>;
}

function ReviewInsightsPanel({ input }: { input: PostLaunchInput }) {
  const positive = themeRows(input.reviews.filter((review) => review.sentiment === "positive"), input.reviews.length, "positive");
  const negative = themeRows(input.reviews.filter((review) => review.sentiment !== "positive"), input.reviews.length, "negative");
  return (
    <article className="panel review-insights-panel">
      <div className="panel-heading"><h2>Review Insights</h2><span>Based on {input.product.reviews} reviews</span></div>
      <div className="review-theme-columns">
        <div><h3>Positive Themes</h3>{positive.map((row) => <ThemeBar key={row.label} row={row} />)}</div>
        <div><h3>Negative Themes</h3>{negative.map((row) => <ThemeBar key={row.label} row={row} negative />)}</div>
      </div>
    </article>
  );
}

function ReviewSentimentPanel({ input }: { input: PostLaunchInput }) {
  const counts = sentimentCounts(input.reviews);
  const total = Math.max(input.reviews.length, 1);
  const positive = Math.round((counts.positive / total) * 100);
  const neutral = Math.round((counts.neutral / total) * 100);
  const negative = Math.max(0, 100 - positive - neutral);
  const score = positive - negative;
  return (
    <article className="panel review-sentiment-panel">
      <div className="panel-heading"><h2>Review Sentiment</h2></div>
      <div className="donut" style={{ background: `conic-gradient(#10b981 0 ${positive}%, #d1d5db ${positive}% ${positive + neutral}%, #ef4444 ${positive + neutral}% 100%)` }}><span>+{score}</span></div>
      <div className="sentiment-legend">
        <span><i className="good" />Positive <b>{positive.toFixed(1)}%</b></span>
        <span><i className="neutral" />Neutral <b>{neutral.toFixed(1)}%</b></span>
        <span><i className="bad" />Negative <b>{negative.toFixed(1)}%</b></span>
      </div>
      <div className="sentiment-score"><span>Sentiment Score</span><strong>+{score}</strong></div>
    </article>
  );
}

function BuyerQuestionsPanel({ input }: { input: PostLaunchInput }) {
  const total = input.buyerQuestions.reduce((sum, question) => sum + question.frequency, 0);
  return (
    <article className="panel buyer-question-panel">
      <div className="panel-heading"><h2>Buyer Questions Insights</h2><span>{total} signals</span></div>
      <div className="question-list">
        {input.buyerQuestions.map((question) => <div className="question-row" key={question.questionId}><span>{question.text}</span><strong>{question.frequency}</strong></div>)}
      </div>
    </article>
  );
}

function ActionPlanPanel({ report }: { report: ReturnType<typeof analyzePostLaunchProduct> }) {
  return (
    <article className="panel ai-action-panel">
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
  );
}

function NextImprovementPanel({ report }: { report: ReturnType<typeof analyzePostLaunchProduct> }) {
  const areas = [
    ["Competition", report.health.competitorPosition, "Watch competitor voucher, price, shipping, and review gaps."],
    ["Margin", report.health.margin, "Protect profit with bundles, voucher limits, and ad caps."],
    ["Buyer response", report.health.customerInteraction, "Use quick replies for repeated buyer questions."],
    ["Reviews", report.health.reviewRating, "Fix repeated negative themes before asking for more reviews."]
  ].sort((a, b) => Number(a[1]) - Number(b[1]));
  return (
    <article className="panel next-improvement-panel">
      <div className="panel-heading"><h2>Next Improvement Areas</h2><span>{areas.length} ranked areas</span></div>
      <div className="improvement-list">
        {areas.map(([label, score, detail], index) => (
          <div className="improvement-row" key={label}>
            <span>{index + 1}</span>
            <div><strong>{label}</strong><p>{detail}</p></div>
            <b>{score}</b>
          </div>
        ))}
      </div>
    </article>
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

function analyzePreLaunch(form: PreForm) {
  const price = numberValue(form.price);
  const shipping = numberValue(form.shippingCost);
  const packaging = numberValue(form.packagingCost);
  const ad = numberValue(form.adCost);
  const stock = numberValue(form.launchStock);
  const competitors = mockCompetitorsFor(form.productType, form.category).map((competitor) => ({
    ...competitor,
    matchScore: competitorMatchScore(competitor, form.productType, form.category, price),
    risk: competitorRisk(competitor, price)
  }));
  const competitorPrices = competitors.map((item) => item.price);
  const competitorAveragePrice = average(competitorPrices);
  const competitorMinPrice = Math.min(...competitorPrices);
  const competitorMaxPrice = Math.max(...competitorPrices);
  const priceGap = competitorAveragePrice ? ((price - competitorAveragePrice) / competitorAveragePrice) * 100 : 0;
  const operatingRoom = price - price * 0.102 - shipping - packaging - ad - (price >= 25 ? 1 : 0.5);
  const operatingRoomPercent = price ? Math.round((operatingRoom / price) * 100) : 0;

  const demand = clamp(Math.round(72 + average(competitors.map((item) => Math.min(24, Math.log10(item.reviews + 1) * 6)))), 25, 100);
  const competition = clamp(Math.round(82 - competitors.filter((item) => item.tier === "direct").length * 9 - (Math.abs(priceGap) > 80 ? 6 : 0)), 20, 100);
  const margin = clamp(operatingRoomPercent + 25, 10, 100);
  const differentiation = clamp(58 + (form.features ? 14 : 0) + (form.photoName ? 8 : 0) + (form.description.length > 90 ? 8 : 0), 20, 100);
  const readinessItems = listingReadinessItems(form);
  const readiness = Math.round((readinessItems.filter((item) => item.status === "complete").length / readinessItems.length) * 100);
  const overall = Math.round(demand * 0.22 + competition * 0.18 + margin * 0.24 + differentiation * 0.2 + readiness * 0.16);
  const potential = {
    demand,
    competition: clamp(competition + 5, 0, 100),
    margin: clamp(margin + 3, 0, 100),
    differentiation: clamp(differentiation + 12, 0, 100),
    readiness: clamp(readiness + 18, 0, 100)
  };
  const stockRange = stockRangeFor(demand, competition, readiness, margin);
  const regions = scoreRegions(form.productType, form.category, price, readiness, form.targetArea);
  const recommendation = overall >= 78 ? "Launch with focused positioning" : overall >= 62 ? "Proceed after priority fixes" : "Do not launch yet";

  return {
    recommendation,
    overall,
    confidence: competitors.length >= 2 ? "Medium" : "Low",
    summary: `${form.title} has ${demand >= 80 ? "strong" : "moderate"} demand signals, ${competition < 65 ? "high" : "manageable"} competitor pressure, and ${operatingRoomPercent}% operating room before buying cost.`,
    price,
    competitorAveragePrice,
    competitorMinPrice,
    competitorMaxPrice,
    pricePosition: `${priceGap >= 0 ? "Priced above" : "Priced below"} competitor average by ${Math.abs(priceGap).toFixed(0)}%.`,
    competitors,
    readinessItems,
    bestRegion: regions[0],
    regions,
    stock: {
      planned: stock || null,
      min: stockRange.min,
      max: stockRange.max,
      suggested: Math.round((stockRange.min + stockRange.max) / 2)
    },
    metricRows: [
      { label: "Demand", current: demand, potential: potential.demand },
      { label: "Competition", current: competition, potential: potential.competition },
      { label: "Cost Room", current: margin, potential: potential.margin },
      { label: "Differentiation", current: differentiation, potential: potential.differentiation },
      { label: "Readiness", current: readiness, potential: potential.readiness }
    ],
    actions: [
      differentiationAction(form.productType),
      `Start with ${Math.round((stockRange.min + stockRange.max) / 2)} units; keep first batch inside ${stockRange.min}-${stockRange.max} units.`,
      `Target ${regions[0].name} first, then expand based on conversion.`,
      priceGap > 40 ? "If priced premium, add proof photos, warranty or bundle value before launch." : "Use competitor price range to keep the launch offer clear."
    ]
  };
}

function listingReadinessItems(form: PreForm) {
  return [
    readinessItem("Title includes product, model, and key benefit", Boolean(form.title.trim().length >= 18), "Use product type plus key value, e.g. model compatibility, insulation, custom print or strap."),
    readinessItem("Shopee category is selected", Boolean(form.category.trim()), "Pick the closest Shopee category path so competitor matching is meaningful."),
    readinessItem("Description explains buyer benefits", form.description.trim().length >= 90, "Add proof points, usage context, and what problem the product solves."),
    readinessItem("Buyer keywords are present", splitList(form.keywords).length >= 3, "Add at least three buyer search phrases."),
    readinessItem("Photo is uploaded", Boolean(form.photoName), "Upload a main product photo and add close-up proof photos before launch."),
    readinessItem("Initial launch stock is planned", numberValue(form.launchStock) > 0, "Add first-batch units so the agent can compare planned stock against market risk."),
    readinessItem("Operating costs are estimated", numberValue(form.shippingCost) + numberValue(form.packagingCost) + numberValue(form.adCost) > 0, "Add shipping, packaging, and ad cost per order for launch viability.")
  ];
}

function readinessItem(label: string, complete: boolean, fix: string) {
  return {
    label,
    status: complete ? "complete" : "missing",
    fix
  };
}

function mockCompetitorsFor(productType: string, category: string) {
  const text = `${productType} ${category}`.toLowerCase();
  if (text.includes("shirt") || text.includes("tee")) {
    return [
      { title: "Plain Cotton Unisex Basic T-Shirt", price: 10.9, reviews: 2100, tier: "direct" },
      { title: "Cyberpunk Space Graphic T-Shirt", price: 17.9, reviews: 680, tier: "comparable" },
      { title: "Custom Name Logo Photo Print T-Shirt", price: 22.9, reviews: 450, tier: "adjacent" }
    ];
  }
  if (text.includes("bottle") || text.includes("tumbler")) {
    return [
      { title: "BPA Free Plastic Water Bottle 700ml", price: 7.9, reviews: 760, tier: "adjacent" },
      { title: "Large Stainless Steel Tumbler with Handle and Straw", price: 28.9, reviews: 980, tier: "direct" },
      { title: "Thermal Stainless Steel Vacuum Bottle 500ml", price: 16.9, reviews: 1350, tier: "comparable" }
    ];
  }
  return [
    { title: "Premium iPhone 15 MagSafe Case Purple", price: 29.9, reviews: 620, tier: "direct" },
    { title: "iPhone 15 Silicone Phone Case with Wrist Strap", price: 15.9, reviews: 950, tier: "comparable" },
    { title: "Clear iPhone 15 Case with Lanyard Strap", price: 9.9, reviews: 1800, tier: "adjacent" }
  ];
}

function competitorMatchScore(competitor: { title: string; price: number; tier: string }, productType: string, category: string, price: number) {
  const text = `${productType} ${category}`.toLowerCase();
  const competitorText = competitor.title.toLowerCase();
  const typeOverlap = text.split(/\W+/).filter((token) => token.length > 3 && competitorText.includes(token)).length;
  const tierBase = competitor.tier === "direct" ? 72 : competitor.tier === "comparable" ? 58 : 42;
  const priceScore = price ? Math.max(0, 18 - Math.abs(price - competitor.price) / Math.max(price, 1) * 30) : 8;
  return clamp(Math.round(tierBase + typeOverlap * 3 + priceScore), 35, 96);
}

function competitorRisk(competitor: { price: number; reviews: number }, price: number) {
  if (competitor.reviews > 1200 && competitor.price < price) return "High review moat + cheaper";
  if (competitor.price < price * 0.6) return "Low-price pressure";
  if (competitor.reviews > 900) return "Established reviews";
  return "Manageable";
}

function applySafePreLaunchChanges(form: PreForm, report: PreReport): PreForm {
  const stock = String(report.stock.suggested);
  const keywords = mergeCommaList(form.keywords, suggestedKeywords(form.productType, form.category));
  const features = mergeCommaList(form.features, suggestedFeatures(form.productType));
  const description = appendSentence(
    form.description,
    proofSentence(form.productType, report.bestRegion.name)
  );

  return {
    ...form,
    launchStock: stock,
    targetArea: report.bestRegion.name,
    keywords,
    features,
    description,
    shippingCost: form.shippingCost || "1",
    packagingCost: form.packagingCost || "0.5",
    adCost: form.adCost || "1"
  };
}

function buildPreDraftForm(base: PreForm, insight: SellerAiInsight): PreForm {
  const draft = { ...base };
  for (const change of [...insight.safeChanges, ...insight.blockedChanges]) {
    if (change.field in draft && change.value) draft[change.field] = change.value;
  }
  return {
    ...draft,
    title: draft.title || "AI drafted product title",
    category: draft.category || "Mobile & Gadgets > Mobile Accessories > Cases Covers & Skins",
    productType: draft.productType || "image-detected product",
    price: draft.price || "19.9",
    launchStock: draft.launchStock || "30",
    shippingCost: draft.shippingCost || "1",
    packagingCost: draft.packagingCost || "0.5",
    adCost: draft.adCost || "1",
    targetArea: draft.targetArea || "Islandwide Singapore",
    features: draft.features || "Visible product photo, local seller, fast delivery",
    description: draft.description || "AI drafted product description. Seller should confirm product proof, sizing, compatibility, and local delivery details before launch.",
    keywords: draft.keywords || "shopee singapore, local seller, fast delivery"
  };
}

function aiRecommendedFields(insight: SellerAiInsight): Array<keyof PreForm> {
  const fields = new Set<keyof PreForm>();
  for (const change of [...insight.safeChanges, ...insight.blockedChanges]) {
    if (change.field && change.value) fields.add(change.field);
  }
  return [...fields].filter((field) => field !== "photoDataUrl" && field !== "photoName");
}

function isSafePreField(field: keyof PreForm) {
  return ["productType", "launchStock", "targetArea", "keywords", "features", "description", "shippingCost", "packagingCost", "adCost"].includes(field);
}

function isPreFormAnalyzable(form: PreForm) {
  return Boolean(form.title.trim() && form.category.trim() && form.productType.trim() && numberValue(form.price) > 0 && form.description.trim());
}

function createPostLaunchListing(form: PreForm, report: PreReport, index: number): PostLaunchInput {
  const price = numberValue(form.price);
  const stock = report.stock.suggested || numberValue(form.launchStock) || 30;
  const clicks = Math.max(16, Math.round(report.overall * 8));
  const conversionRate = clamp(report.overall / 1250, 0.025, 0.095);
  const orders = Math.max(3, Math.round(clicks * conversionRate));
  const views = Math.max(600, Math.round(clicks / 0.048));
  const competitors = report.competitors.slice(0, 3).map((competitor, competitorIndex) => ({
    competitorId: `AI-C-${index}-${competitorIndex + 1}`,
    title: competitor.title,
    price: competitor.price,
    rating: competitor.reviews > 1000 ? 4.7 : 4.45,
    reviews: competitor.reviews,
    estimatedSales: Math.round(competitor.reviews * 1.8),
    shippingDays: competitorIndex + 1,
    voucherPercent: competitorIndex === 0 ? 12 : 8,
    keyStrength: competitor.risk,
    keyWeakness: competitor.tier === "direct" ? "Needs proof gap comparison" : "Less direct product match"
  }));

  return {
    product: {
      productId: `PRE-SG-${String(index).padStart(3, "0")}`,
      title: form.title,
      category: form.category,
      price,
      cost: 0,
      stock,
      views,
      clicks,
      orders,
      revenue: roundMoney(price * orders),
      adSpend: roundMoney(numberValue(form.adCost) * Math.max(orders, 1)),
      rating: 4.5,
      reviews: 0,
      refundRate: 0.01,
      cancellationRate: 0.01,
      netMarginPercent: clamp((price - numberValue(form.shippingCost) - numberValue(form.packagingCost) - numberValue(form.adCost)) / Math.max(price, 1), 0.05, 0.5),
      conversionRate,
      ctr: clicks / Math.max(views, 1)
    },
    context: {
      segment: form.productType || "Seller listing",
      trustSignals: [
        { label: "Pre-launch proof", applies: Boolean(form.photoName), evidence: form.photoName ? "Seller uploaded a product photo." : "No product photo uploaded.", action: "Add close-up proof images before scaling." },
        { label: "Keyword coverage", applies: splitList(form.keywords).length >= 3, evidence: form.keywords || "No keywords provided.", action: "Keep buyer search terms visible in listing copy." }
      ],
      nonApplicableSignals: ["Live order metrics are estimated until the listing has real Shopee activity."],
      listingFocus: report.actions.slice(0, 4)
    },
    communication: {
      totalChats: 0,
      averageResponseMinutes: 90,
      responseWithinOneHourPercent: 0.55,
      unansweredRate: 0.05,
      buyerSatisfactionScore: 4
    },
    competitors,
    reviews: [
      { reviewId: `PRE-R-${index}-1`, rating: 4, text: "New seller listing added from pre-launch validation.", sentiment: "neutral", theme: "new listing" }
    ],
    buyerQuestions: [
      { questionId: `PRE-Q-${index}-1`, text: "Can you show more proof photos?", theme: "proof", frequency: 6 },
      { questionId: `PRE-Q-${index}-2`, text: "Is local delivery available?", theme: "delivery", frequency: 4 }
    ],
    dataQualityWarnings: ["Listing was added from pre-launch mock evaluation; live Shopee metrics are not connected yet."]
  };
}

function suggestedKeywords(productType: string, category: string) {
  const text = `${productType} ${category}`.toLowerCase();
  if (text.includes("shirt") || text.includes("tee")) return ["size chart", "cotton t shirt", "comfortable tee"];
  if (text.includes("bottle") || text.includes("tumbler")) return ["leakproof bottle", "thermal bottle", "water bottle singapore"];
  if (text.includes("case") || text.includes("phone")) return ["iphone case", "phone case with strap", "shockproof phone case"];
  return ["shopee singapore", "fast delivery", "local seller"];
}

function suggestedFeatures(productType: string) {
  const text = productType.toLowerCase();
  if (text.includes("case")) return ["strap durability proof", "model compatibility", "close-up fit photo"];
  if (text.includes("bottle") || text.includes("tumbler")) return ["leak test proof", "capacity guide", "temperature retention claim"];
  if (text.includes("shirt") || text.includes("tee")) return ["size chart", "fabric thickness", "wash care proof"];
  return ["local delivery", "clear product proof", "buyer use case"];
}

function proofSentence(productType: string, area: string) {
  const text = productType.toLowerCase();
  if (text.includes("case")) return `Add proof for strap attachment, camera-lip protection, and compatibility, then target ${area} first for launch testing.`;
  if (text.includes("bottle") || text.includes("tumbler")) return `Add leak-test, capacity, and use-case proof, then target ${area} first for launch testing.`;
  if (text.includes("shirt") || text.includes("tee")) return `Add fit, fabric, size-chart, and wash-care proof, then target ${area} first for launch testing.`;
  return `Add product proof and local delivery details, then target ${area} first for launch testing.`;
}

function mergeCommaList(existing: string, additions: string[]) {
  const values = new Set([...splitList(existing), ...additions].map((item) => item.trim()).filter(Boolean));
  return [...values].join(", ");
}

function appendSentence(existing: string, sentence: string) {
  if (!existing.trim()) return sentence;
  if (existing.toLowerCase().includes(sentence.toLowerCase())) return existing;
  return `${existing.trim()} ${sentence}`;
}

function stockRangeFor(demand: number, competition: number, readiness: number, margin: number) {
  let min = demand >= 80 ? 50 : demand >= 55 ? 30 : 15;
  let max = demand >= 80 ? 90 : demand >= 55 ? 60 : 35;
  if (margin >= 78) max += 20;
  if (competition < 65) max -= 20;
  if (readiness < 80) {
    min = Math.max(10, min - 15);
    max = Math.max(min + 10, max - 30);
  }
  return { min, max };
}

function scoreRegions(productType: string, category: string, price: number, readiness: number, selectedArea: string) {
  const text = `${productType} ${category}`.toLowerCase();
  const regions = [
    { name: "Central Singapore", score: 72, reason: "strongest for premium, office, lifestyle and fast-delivery positioning" },
    { name: "East Singapore", score: 68, reason: "good for commuters, families and travel-oriented daily products" },
    { name: "West Singapore", score: 66, reason: "good for students, value buys, school items and basics" },
    { name: "North-East Singapore", score: 64, reason: "good for younger households, casual apparel and lifestyle buys" },
    { name: "North Singapore", score: 60, reason: "better for value-led listings and practical essentials" },
    { name: "Islandwide Singapore", score: 70, reason: "safest for early test launch before narrowing targeting" }
  ];
  for (const region of regions) {
    if (region.name === selectedArea) region.score += 4;
    if (text.includes("case") && ["Central Singapore", "North-East Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if (text.includes("bottle") && ["Central Singapore", "East Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if ((text.includes("shirt") || text.includes("tee")) && ["Central Singapore", "North-East Singapore", "Islandwide Singapore"].includes(region.name)) region.score += 8;
    if (price >= 30 && region.name === "Central Singapore") region.score += 6;
    if (price <= 15 && ["West Singapore", "North Singapore"].includes(region.name)) region.score += 5;
    if (readiness < 80 && region.name !== "Islandwide Singapore") region.score -= 4;
    region.score = clamp(region.score, 0, 100);
  }
  return regions.sort((a, b) => b.score - a.score);
}

function differentiationAction(productType: string) {
  const text = productType.toLowerCase();
  if (text.includes("case")) return "Lead with durability proof: show strap attachment, drop protection, and close-up fit photos.";
  if (text.includes("bottle") || text.includes("tumbler")) return "Show leak test, size comparison, heat/cold retention, and bag/cupholder fit.";
  if (text.includes("custom")) return "Show proof approval flow, print durability, production lead time, and event-date promise.";
  if (text.includes("shirt") || text.includes("tee")) return "Show model fit, size chart, fabric thickness, print close-up, and wash guidance.";
  return "Turn competitor complaints into visible proof points in photos and listing copy.";
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
  return adjusted;
}

function imageKind(title: string): "bottle" | "shirt" | "case" {
  if (title.toLowerCase().includes("shirt")) return "shirt";
  if (title.toLowerCase().includes("case")) return "case";
  return "bottle";
}

function productImageSrc(kind: "bottle" | "shirt" | "case"): string {
  const photos = {
    bottle: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=240&q=80",
    shirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=240&q=80",
    case: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=240&q=80"
  };
  return photos[kind];
}

function shortProductName(title: string): string {
  return title.replace("Insulated Stainless Steel ", "").replace("Shockproof Clear ", "");
}

function currency(value: number): string {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2 }).format(value || 0);
}

function percent(value: number): string {
  return `${((value || 0) * 100).toFixed(1)}%`;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function numberValue(value: string): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
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

function trendDemandLabel(views: number, orders: number): string {
  if (views > 50000 || orders > 1000) return "High";
  if (views > 15000 || orders > 300) return "Moderate";
  return "Developing";
}

function themeRows(reviews: PostLaunchInput["reviews"], totalReviews: number, tone: "positive" | "negative") {
  const fallback = tone === "positive"
    ? ["Fast delivery", "Good value", "Nice color"]
    : ["Leak-proof unclear", "Capacity unclear", "Care instructions missing", "Packaging dents"];
  const counts = new Map<string, number>();
  for (const review of reviews) counts.set(titleCase(review.theme), (counts.get(titleCase(review.theme)) || 0) + 1);
  const rows = [...counts.entries()].map(([label, count]) => ({ label, percent: Math.max(14, Math.round((count / Math.max(totalReviews, 1)) * 100)) }));
  const filled = rows.length ? rows : fallback.map((label, index) => ({ label, percent: [32, 22, 18, 14][index] || 12 }));
  return filled.slice(0, 4);
}

function ThemeBar({ row, negative = false }: { row: { label: string; percent: number }; negative?: boolean }) {
  return (
    <div className={negative ? "theme-bar negative" : "theme-bar"}>
      <span>{row.label}</span>
      <div><i style={{ width: `${row.percent}%` }} /></div>
      <strong>{row.percent}%</strong>
    </div>
  );
}

function sentimentCounts(reviews: PostLaunchInput["reviews"]) {
  return reviews.reduce(
    (counts, review) => {
      if (review.sentiment === "positive") counts.positive += 1;
      else if (review.sentiment === "neutral") counts.neutral += 1;
      else if (review.sentiment === "negative") counts.negative += 1;
      else counts.neutral += 1;
      return counts;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
