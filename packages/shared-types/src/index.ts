export type Sentiment = "positive" | "neutral" | "negative" | "mixed";
export type Priority = "High" | "Medium" | "Low";

export interface LiveProductStats {
  productId: string;
  title: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  views: number;
  clicks: number;
  orders: number;
  revenue: number;
  adSpend: number;
  rating: number;
  reviews: number;
  refundRate: number;
  cancellationRate: number;
  netMarginPercent: number;
  conversionRate: number;
  ctr: number;
}

export interface CompetitorSnapshot {
  competitorId: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  estimatedSales: number;
  shippingDays: number;
  voucherPercent: number;
  keyStrength: string;
  keyWeakness: string;
}

export interface ReviewInsight {
  reviewId: string;
  rating: number;
  text: string;
  sentiment: Sentiment;
  theme: string;
}

export interface BuyerQuestionInsight {
  questionId: string;
  text: string;
  theme: string;
  frequency: number;
}

export interface PostLaunchInput {
  product: LiveProductStats;
  context?: ProductContext;
  communication?: SellerCommunicationStats;
  competitors: CompetitorSnapshot[];
  reviews: ReviewInsight[];
  buyerQuestions: BuyerQuestionInsight[];
  dataQualityWarnings: string[];
}

export interface SellerCommunicationStats {
  totalChats: number;
  averageResponseMinutes: number;
  responseWithinOneHourPercent: number;
  unansweredRate: number;
  buyerSatisfactionScore: number;
}

export interface ProductContext {
  segment: string;
  trustSignals: ProductTrustSignal[];
  nonApplicableSignals: string[];
  listingFocus: string[];
}

export interface ProductTrustSignal {
  label: string;
  applies: boolean;
  evidence: string;
  action: string;
}

export interface ProductHealthBreakdown {
  overall: number;
  conversion: number;
  margin: number;
  reviewRating: number;
  competitorPosition: number;
  traffic: number;
  customerInteraction: number;
  fulfillment: number;
}

export interface ActionRecommendation {
  priority: Priority;
  area: string;
  action: string;
  revenueLogic: string;
  expectedImpact: string;
}

export interface PostLaunchReport {
  productId: string;
  productTitle: string;
  health: ProductHealthBreakdown;
  diagnosis: string;
  actions: ActionRecommendation[];
  dataQualityWarnings: string[];
}
