import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  Banknote,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Filter,
  MapPin,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import catalog from "../../data/catalog.json";
import sellers from "../../data/sellers.json";
import "./styles.css";

type Seller = {
  seller_id: string;
  seller_name: string;
  country: string;
  city: string;
  default_currency: string;
};

type Product = {
  product_id: string;
  variant_id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  availability: "in_stock" | "out_of_stock" | "preorder" | "discontinued";
  country: string;
  city: string;
  delivery_starts_at: string;
  delivery_ends_at: string;
  halal_status: "certified" | "not_certified" | "unknown";
  bpom_status: "registered" | "not_registered" | "not_required" | "unknown";
  cod_available: boolean;
  bnpl_available: boolean;
  return_window_days: number;
};

type CartItem = Product & { quantity: number };

const typedCatalog = catalog as Product[];
const typedSellers = sellers as Seller[];

const sellerById = new Map(typedSellers.map((seller) => [seller.seller_id, seller]));

const categoryLabels: Record<string, string> = {
  baby: "Baby",
  beauty: "Beauty",
  electronics: "Electronics",
  fashion: "Fashion",
  groceries: "Groceries",
  home: "Home",
};

const categoryArtwork: Record<string, string> = {
  baby: "🧸",
  beauty: "✦",
  electronics: "⌁",
  fashion: "◒",
  groceries: "◈",
  home: "⌂",
};

const cityAccent: Record<string, string> = {
  Bangkok: "#8a5dff",
  "Ho Chi Minh City": "#128c7e",
  Jakarta: "#ee4d2d",
  "Kuala Lumpur": "#0b8f62",
  Manila: "#1767d1",
  Singapore: "#c72845",
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" || currency === "VND" ? 0 : 2,
  }).format(value);
}

function daysBetween(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");
  const [codOnly, setCodOnly] = useState(false);
  const [bnplOnly, setBnplOnly] = useState(false);
  const [complianceOnly, setComplianceOnly] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const categories = useMemo(() => [...new Set(typedCatalog.map((item) => item.category))].sort(), []);
  const cities = useMemo(() => [...new Set(typedCatalog.map((item) => item.city))].sort(), []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();

    return typedCatalog.filter((product) => {
      const seller = sellerById.get(product.seller_id);
      const text = `${product.title} ${product.description} ${seller?.seller_name ?? ""}`.toLowerCase();

      if (term && !text.includes(term)) return false;
      if (category !== "all" && product.category !== category) return false;
      if (city !== "all" && product.city !== city) return false;
      if (codOnly && !product.cod_available) return false;
      if (bnplOnly && !product.bnpl_available) return false;
      if (complianceOnly && product.halal_status !== "certified" && product.bpom_status !== "registered") return false;
      return product.availability === "in_stock";
    });
  }, [bnplOnly, category, city, codOnly, complianceOnly, query]);

  const cartGroups = useMemo(() => {
    const groups = new Map<string, CartItem[]>();
    for (const item of cart) {
      groups.set(item.seller_id, [...(groups.get(item.seller_id) ?? []), item]);
    }
    return Array.from(groups.entries()).map(([sellerId, items]) => ({
      seller: sellerById.get(sellerId),
      items,
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      currency: items[0]?.currency ?? "IDR",
      codAvailable: items.every((item) => item.cod_available),
      bnplAvailable: items.every((item) => item.bnpl_available),
    }));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.product_id);
      if (existing) {
        return current.map((item) =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.product_id !== productId));
  };

  return (
    <main className="shell">
      <section className="topbar">
        <div className="brand-mark">
          <ShoppingBag size={24} />
        </div>
        <div>
          <p className="eyebrow">ACP-SEA Bridge</p>
          <h1>Agent-ready marketplace cart</h1>
        </div>
        <div className="topbar-stat">
          <Store size={18} />
          <span>{typedSellers.length} sellers</span>
        </div>
        <div className="topbar-stat">
          <PackageCheck size={18} />
          <span>{typedCatalog.length} SKUs</span>
        </div>
      </section>

      <section className="commerce-board">
        <aside className="control-rail">
          <div className="panel search-panel">
            <label className="searchbox">
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search serum, charger, baby..."
              />
            </label>

            <label className="select-row">
              <Filter size={17} />
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {categoryLabels[item] ?? item}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>

            <label className="select-row">
              <MapPin size={17} />
              <select value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="all">All cities</option>
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </label>
          </div>

          <div className="panel filter-panel">
            <button className={codOnly ? "toggle active" : "toggle"} onClick={() => setCodOnly((value) => !value)}>
              <Banknote size={18} />
              COD eligible
            </button>
            <button className={bnplOnly ? "toggle active" : "toggle"} onClick={() => setBnplOnly((value) => !value)}>
              <WalletCards size={18} />
              BNPL available
            </button>
            <button
              className={complianceOnly ? "toggle active" : "toggle"}
              onClick={() => setComplianceOnly((value) => !value)}
            >
              <ShieldCheck size={18} />
              Halal or BPOM
            </button>
          </div>

          <div className="panel market-strip">
            <div>
              <strong>{filteredProducts.length}</strong>
              <span>matching products</span>
            </div>
            <div>
              <strong>{cartGroups.length}</strong>
              <span>seller sessions</span>
            </div>
          </div>
        </aside>

        <section className="product-deck">
          <div className="section-head">
            <div>
              <p className="eyebrow">Marketplace search</p>
              <h2>Common data, seller-split checkout</h2>
            </div>
            <div className="signal-pill">
              <Sparkles size={16} />
              shared mock catalog
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.product_id} product={product} onAdd={addToCart} />
            ))}
          </div>
        </section>

        <aside className="cart-panel">
          <div className="cart-head">
            <div>
              <p className="eyebrow">Agent cart</p>
              <h2>{cart.length} items</h2>
            </div>
            {cart.length > 0 && (
              <button className="icon-button" onClick={() => setCart([])} aria-label="Clear cart">
                <X size={17} />
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={34} />
              <p>Add products to see seller checkout sessions.</p>
            </div>
          ) : (
            <div className="seller-sessions">
              {cartGroups.map((group) => (
                <div className="session-card" key={group.seller?.seller_id}>
                  <div className="session-top">
                    <Store size={17} />
                    <div>
                      <strong>{group.seller?.seller_name}</strong>
                      <span>{group.seller?.city}</span>
                    </div>
                  </div>
                  {group.items.map((item) => (
                    <div className="cart-line" key={item.product_id}>
                      <span>{item.title}</span>
                      <button onClick={() => removeFromCart(item.product_id)} aria-label={`Remove ${item.title}`}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="session-flags">
                    <span className={group.codAvailable ? "flag ok" : "flag muted"}>COD</span>
                    <span className={group.bnplAvailable ? "flag ok" : "flag muted"}>BNPL</span>
                    <span className="flag">{money(group.subtotal, group.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const seller = sellerById.get(product.seller_id);
  const accent = cityAccent[product.city] ?? "#ee4d2d";
  const deliveryDays = daysBetween(product.delivery_starts_at, product.delivery_ends_at);

  return (
    <article className="product-card">
      <div className="product-art" style={{ "--accent": accent } as React.CSSProperties}>
        <span>{categoryArtwork[product.category] ?? "◦"}</span>
        <div className="art-gloss" />
      </div>
      <div className="product-body">
        <div className="product-meta">
          <span>{categoryLabels[product.category] ?? product.category}</span>
          <span>{product.city}</span>
        </div>
        <h3>{product.title}</h3>
        <p>{product.description}</p>
        <div className="price-row">
          <strong>{money(product.price, product.currency)}</strong>
          <span>{deliveryDays}d delivery</span>
        </div>
        <div className="badge-row">
          {product.halal_status === "certified" && (
            <span className="badge green">
              <BadgeCheck size={13} />
              halal
            </span>
          )}
          {product.bpom_status === "registered" && (
            <span className="badge blue">
              <CheckCircle2 size={13} />
              BPOM
            </span>
          )}
          {product.cod_available && (
            <span className="badge orange">
              <Banknote size={13} />
              COD
            </span>
          )}
          {product.bnpl_available && (
            <span className="badge ink">
              <CreditCard size={13} />
              BNPL
            </span>
          )}
        </div>
        <div className="seller-row">
          <span>
            <Store size={14} />
            {seller?.seller_name}
          </span>
          <span>
            <Truck size={14} />
            {product.country}
          </span>
        </div>
        <button className="add-button" onClick={() => onAdd(product)}>
          Add to cart
        </button>
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
