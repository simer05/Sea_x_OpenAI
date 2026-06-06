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
