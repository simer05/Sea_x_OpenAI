const analysisAreas = [
  "Conversion leakage",
  "Margin protection",
  "Competitor position",
  "Review and buyer-question themes",
  "Prioritized revenue actions"
];

export default function Page() {
  return (
    <main style={{ fontFamily: "Arial, sans-serif", margin: "40px", maxWidth: 960 }}>
      <h1>AdaptLink Post-Launch Seller</h1>
      <p>
        Person B branch for live Shopee seller intelligence. This dashboard will focus on product health,
        benchmark gaps, and revenue actions for products that are already launched.
      </p>
      <section>
        <h2>Analysis Focus</h2>
        <ul>
          {analysisAreas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
