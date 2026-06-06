import { createHmac } from "node:crypto";

export interface ShopeeCredentials {
  baseUrl: string;
  partnerId: string;
  partnerKey: string;
  shopId: string;
  accessToken: string;
}

export interface ShopeeRequestOptions {
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
}

export function loadShopeeCredentialsFromEnv(): ShopeeCredentials {
  const credentials = {
    baseUrl: process.env.SHOPEE_API_BASE_URL || "https://partner.shopeemobile.com",
    partnerId: process.env.SHOPEE_PARTNER_ID || "",
    partnerKey: process.env.SHOPEE_PARTNER_KEY || "",
    shopId: process.env.SHOPEE_SHOP_ID || "",
    accessToken: process.env.SHOPEE_ACCESS_TOKEN || ""
  };

  const missing = Object.entries(credentials)
    .filter(([key, value]) => key !== "baseUrl" && !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Shopee credentials: ${missing.join(", ")}`);
  }

  return credentials;
}

export class RealShopeeClient {
  constructor(private readonly credentials: ShopeeCredentials) {}

  async request<T>(options: ShopeeRequestOptions): Promise<T> {
    const method = options.method || "GET";
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.sign(options.path, timestamp);
    const url = new URL(options.path, this.credentials.baseUrl);

    url.searchParams.set("partner_id", this.credentials.partnerId);
    url.searchParams.set("timestamp", String(timestamp));
    url.searchParams.set("access_token", this.credentials.accessToken);
    url.searchParams.set("shop_id", this.credentials.shopId);
    url.searchParams.set("sign", sign);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: method === "POST" ? JSON.stringify(options.body ?? {}) : undefined
    });

    if (!response.ok) {
      throw new Error(`Shopee API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }

  private sign(path: string, timestamp: number): string {
    const baseString = [
      this.credentials.partnerId,
      path,
      timestamp,
      this.credentials.accessToken,
      this.credentials.shopId
    ].join("");

    return createHmac("sha256", this.credentials.partnerKey).update(baseString).digest("hex");
  }
}

export function createRealShopeeClient(): RealShopeeClient {
  return new RealShopeeClient(loadShopeeCredentialsFromEnv());
}
