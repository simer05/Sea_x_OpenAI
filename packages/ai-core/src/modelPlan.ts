export const openAiModelPlan = {
  deepAnalysisModel: process.env.OPENAI_MODEL || "gpt-5.5",
  fallbackModel: process.env.OPENAI_FALLBACK_MODEL || "gpt-5.4-mini",
  responseStyle: "structured_json",
  requiredCapabilities: [
    "reasoning over seller metrics",
    "structured outputs",
    "function calling for future Shopee tools",
    "vision input later for listing image audit"
  ]
};

export const postLaunchModelRouting = [
  {
    task: "review_theme_extraction",
    model: "gpt-5.4-mini",
    reason: "Fast, cheaper extraction for repeated review text."
  },
  {
    task: "buyer_chat_experience",
    model: "gpt-5.4-mini",
    reason: "Classifies buyer questions and response timing risk without expensive reasoning."
  },
  {
    task: "revenue_strategy",
    model: "gpt-5.5",
    reason: "Needs deeper tradeoff reasoning across margin, conversion, competitor gaps, and fulfilment."
  },
  {
    task: "seller_workflow_agent",
    model: "gpt-5.5",
    reason: "Use only when Shopee API tools are connected and the model must coordinate fetch-normalize-analyze steps."
  }
];
