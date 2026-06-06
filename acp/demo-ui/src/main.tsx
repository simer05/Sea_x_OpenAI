import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
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
  image_url?: string;
  rating?: number;
  sold_count?: number;
  discount_pct?: number;
};

type CartItem = Product & { quantity: number };

const typedCatalog = catalog as Product[];
const typedSellers = sellers as Seller[];
const sellerById = new Map(typedSellers.map((s) => [s.seller_id, s]));

const SHOPEE_CATEGORIES: Record<string, { label: string; icon: string }> = {
  bottle: { label: "Bottle", icon: "🧴" },
  tshirt: { label: "T-Shirt", icon: "👕" },
  phone_case: { label: "Phone Case", icon: "📱" },
  food_groceries: { label: "Food & Groceries", icon: "🛒" },
  beauty_personal_care: { label: "Beauty & Care", icon: "💄" },
};

const CATEGORY_IMAGES: Record<string, string> = {
  bottle: "/images/products/bottle.jpg",
  tshirt: "/images/products/tshirt.jpg",
  phone_case: "/images/products/phone_case.jpg",
  food_groceries: "/images/products/food_groceries.jpg",
  beauty_personal_care: "/images/products/beauty_personal_care.jpg",
};

const HOT_SEARCHES = [
  "Water Bottle",
  "Chicken Nuggets",
  "Lipstick",
  "iPhone Case",
  "Instant Noodles",
];

function money(value: number, currency: string) {
  const decimals = currency === "IDR" || currency === "VND" ? 0 : 2;
  const formatted = new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return { symbol: currency === "SGD" ? "$" : currency, amount: formatted };
}

function formatSold(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k sold`;
  return `${count} sold`;
}

function stableSoldCount(productId: string, fallback: number) {
  let hash = 0;
  for (const ch of productId) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return fallback || (hash % 36000) + 500;
}

function productImage(product: Product) {
  return product.image_url ?? CATEGORY_IMAGES[product.category] ?? CATEGORY_IMAGES.bottle;
}

function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("all");
  const [codOnly, setCodOnly] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [sessionPreview, setSessionPreview] = useState(false);
  const productGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    productGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [category, city, codOnly, query]);

  const categories = useMemo(
    () => [...new Set(typedCatalog.map((p) => p.category))].sort(),
    [],
  );
  const cities = useMemo(() => [...new Set(typedCatalog.map((p) => p.city))].sort(), []);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of typedCatalog) {
      if (product.availability !== "in_stock") continue;
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    return counts;
  }, []);

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return typedCatalog.filter((product) => {
      const seller = sellerById.get(product.seller_id);
      const text = `${product.title} ${product.description} ${seller?.seller_name ?? ""}`.toLowerCase();
      if (term && !text.includes(term)) return false;
      if (category !== "all" && product.category !== category) return false;
      if (city !== "all" && product.city !== city) return false;
      if (codOnly && !product.cod_available) return false;
      return product.availability === "in_stock";
    });
  }, [category, city, codOnly, query]);

  const flashSaleProducts = useMemo(
    () =>
      typedCatalog
        .filter((p) => (p.discount_pct ?? 0) >= 30 && p.availability === "in_stock")
        .slice(0, 6),
    [],
  );

  const cartGroups = useMemo(() => {
    const groups = new Map<string, CartItem[]>();
    for (const item of cart) {
      groups.set(item.seller_id, [...(groups.get(item.seller_id) ?? []), item]);
    }
    return Array.from(groups.entries()).map(([sellerId, items]) => ({
      seller: sellerById.get(sellerId),
      items,
      subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      currency: items[0]?.currency ?? "SGD",
      codAvailable: items.every((item) => item.cod_available),
    }));
  }, [cart]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setCity("all");
    setCodOnly(false);
  };

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
    setToast(`Added “${product.title}” to cart`);
    setCartOpen(true);
  };

  const selectCategory = (next: string) => {
    setCategory((current) => (current === next ? "all" : next));
  };

  const removeFromCart = (productId: string) => {
    setCart((current) => current.filter((item) => item.product_id !== productId));
  };

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="utility-bar">
            <span>Seller Centre</span>
            <span>Start Selling</span>
            <span>Download</span>
            <span>Follow us on</span>
            <span className="utility-spacer" />
            <span>Notifications</span>
            <span>Help</span>
            <span>English</span>
          </div>

          <div className="main-header">
            <button type="button" className="brand" onClick={clearFilters}>
              <div className="brand-icon">
                <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 4C15.2 4 8 11.2 8 20c0 10.4 16 24 16 24s16-13.6 16-24C40 11.2 32.8 4 24 4zm0 26c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z" />
                </svg>
              </div>
              <h1>Shopee</h1>
            </button>

            <div className="search-wrap">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in Shopee"
              />
              <button className="search-btn" aria-label="Search">
                <Search size={18} />
              </button>
            </div>

            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Open cart">
              <ShoppingCart size={26} />
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
          </div>

          <div className="hot-searches">
            {HOT_SEARCHES.map((term) => (
              <button key={term} onClick={() => setQuery(term)}>
                {term}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="page-body">
        <section className="hero-row">
          <div className="hero-main">
            <img src="/images/banners/sale-1.jpg" alt="6.6 Mega Sale" />
            <div className="hero-overlay">
              <p>6.6 Mega Sale</p>
              <h2>Up to 70% Off Storewide</h2>
              <span>
                Shop {typedCatalog.length} deals from {typedSellers.length} stores
              </span>
            </div>
          </div>
          <div className="hero-side">
            <img src="/images/banners/sale-2.jpg" alt="Free Shipping" />
            <img src="/images/banners/sale-3.jpg" alt="Beauty Sale" />
          </div>
        </section>

        <section className="service-strip">
          <div className="service-item">
            <RotateCcw size={20} />
            <span>15-Day Free Returns</span>
          </div>
          <div className="service-item">
            <ShieldCheck size={20} />
            <span>100% Authentic</span>
          </div>
          <div className="service-item">
            <Truck size={20} />
            <span>Free Shipping</span>
          </div>
        </section>

        <section className="category-section">
          <h2>Categories</h2>
          <div className="category-grid">
            <button
              type="button"
              className={category === "all" ? "category-item active" : "category-item"}
              onClick={() => setCategory("all")}
            >
              <span className="category-icon">🏪</span>
              All
              <em className="category-count">{typedCatalog.length}</em>
            </button>
            {categories.map((cat) => {
              const meta = SHOPEE_CATEGORIES[cat];
              return (
                <button
                  type="button"
                  key={cat}
                  className={category === cat ? "category-item active" : "category-item"}
                  onClick={() => selectCategory(cat)}
                >
                  <span className="category-icon">{meta?.icon ?? "📦"}</span>
                  {meta?.label ?? cat}
                  <em className="category-count">{categoryCounts.get(cat) ?? 0}</em>
                </button>
              );
            })}
          </div>
        </section>

        {category === "all" && flashSaleProducts.length > 0 && (
          <section className="flash-sale">
            <div className="flash-header">
              <h2>Flash Sale</h2>
              <div className="flash-timer">
                <span>Ends in</span>
                <span className="timer-digit">02</span>
                <span>:</span>
                <span className="timer-digit">45</span>
                <span>:</span>
                <span className="timer-digit">18</span>
              </div>
              <ChevronRight size={16} color="#ee4d2d" />
            </div>
            <div className="flash-scroll">
              {flashSaleProducts.map((product) => {
                const price = money(product.price, product.currency);
                const original = product.discount_pct
                  ? product.price / (1 - product.discount_pct / 100)
                  : product.price;
                const origPrice = money(original, product.currency);
                return (
                  <div className="flash-card" key={product.product_id} onClick={() => addToCart(product)}>
                    <img src={productImage(product)} alt={product.title} loading="lazy" />
                    <div className="flash-price">
                      {price.symbol}
                      {price.amount}
                    </div>
                    {product.discount_pct ? (
                      <div className="flash-discount">
                        {origPrice.symbol}
                        {origPrice.amount}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="filter-bar">
          <label>
            Location
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="all">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={codOnly ? "filter-chip active" : "filter-chip"}
            onClick={() => setCodOnly((v) => !v)}
          >
            COD Available
          </button>
          {(category !== "all" || city !== "all" || codOnly || query) && (
            <button type="button" className="filter-chip reset" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <span className="filter-spacer" />
          <span className="result-count">{filteredProducts.length} products found</span>
        </div>

        <section className="discover-section" ref={productGridRef}>
          <div className="discover-header">
            <h2>
              Daily Discover
              {category !== "all" && (
                <span className="discover-subtitle">
                  · {SHOPEE_CATEGORIES[category]?.label ?? category}
                </span>
              )}
            </h2>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="empty-results">
              <p>No products match your current filters.</p>
              <button type="button" className="filter-chip reset" onClick={clearFilters}>
                Reset and show all {typedCatalog.length} products
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} onAdd={addToCart} />
              ))}
            </div>
          )}
        </section>
      </div>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-col">
            <h3>Customer Service</h3>
            <a href="#">Help Centre</a>
            <a href="#">How To Buy</a>
            <a href="#">Payment Methods</a>
            <a href="#">Shopee Guarantee</a>
          </div>
          <div className="footer-col">
            <h3>About Shopee</h3>
            <a href="#">About Us</a>
            <a href="#">Shopee Careers</a>
            <a href="#">Policies</a>
            <a href="#">Privacy Policy</a>
          </div>
          <div className="footer-col">
            <h3>Payment</h3>
            <p>COD · SPayLater · Credit Card · Bank Transfer</p>
          </div>
          <div className="footer-col">
            <h3>Follow Us</h3>
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
            <a href="#">Twitter</a>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 Demo Marketplace · Mock data · Not affiliated with Shopee
        </div>
      </footer>

      <div className={`cart-overlay ${cartOpen ? "open" : ""}`} onClick={() => setCartOpen(false)} />
      <aside className={`cart-drawer ${cartOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <h2>Shopping Cart ({cart.length})</h2>
          <button className="cart-close" onClick={() => setCartOpen(false)} aria-label="Close cart">
            <X size={22} />
          </button>
        </div>

        <div className="cart-drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={64} />
              <p>Your cart is empty.<br />Find something you love below.</p>
            </div>
          ) : (
            cartGroups.map((group) => (
              <div className="session-card" key={group.seller?.seller_id}>
                <div className="session-header">
                  <Store size={16} />
                  <div>
                    <strong>{group.seller?.seller_name}</strong>
                    <span> · {group.seller?.city}</span>
                  </div>
                </div>
                {group.items.map((item) => {
                  const price = money(item.price, item.currency);
                  return (
                    <div className="cart-line" key={item.product_id}>
                      <img src={productImage(item)} alt={item.title} />
                      <div className="cart-line-info">
                        <div className="cart-line-title">{item.title}</div>
                        <div className="cart-line-price">
                          {price.symbol}
                          {price.amount} × {item.quantity}
                        </div>
                      </div>
                      <button
                        className="cart-line-remove"
                        onClick={() => removeFromCart(item.product_id)}
                        aria-label={`Remove ${item.title}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
                <div className="session-footer">
                  <div className="session-flags">
                    <span className={group.codAvailable ? "flag ok" : "flag muted"}>COD</span>
                    <span className="flag">
                      <Package size={12} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                      {group.items[0]?.return_window_days ?? 7}-day returns
                    </span>
                  </div>
                  <span className="session-total">
                    {(() => {
                      const p = money(group.subtotal, group.currency);
                      return `${p.symbol}${p.amount}`;
                    })()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <button type="button" className="checkout-btn" onClick={() => setSessionPreview(true)}>
              Checkout ({cartGroups.length} store{cartGroups.length > 1 ? "s" : ""}) ·{" "}
              {(() => {
                const p = money(cartTotal, cart[0]?.currency ?? "SGD");
                return `${p.symbol}${p.amount}`;
              })()}
            </button>
          </div>
        )}
      </aside>

      {toast && <div className="toast">{toast}</div>}

      {sessionPreview && (
        <div className="session-modal-overlay" onClick={() => setSessionPreview(false)}>
          <div className="session-modal" onClick={(e) => e.stopPropagation()}>
            <div className="session-modal-head">
              <h3>Order by store</h3>
              <button type="button" onClick={() => setSessionPreview(false)} aria-label="Close preview">
                <X size={18} />
              </button>
            </div>
            <p className="session-modal-copy">
              Items from different stores are grouped and checked out separately.
            </p>
            <pre>{JSON.stringify(cartGroups, null, 2)}</pre>
          </div>
        </div>
      )}
    </>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const price = money(product.price, product.currency);
  const rating = product.rating ?? 4.8;
  const sold = stableSoldCount(product.product_id, product.sold_count ?? 0);
  const discount = product.discount_pct ?? 0;

  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      aria-label={`Add ${product.title} to cart`}
      onClick={() => onAdd(product)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAdd(product);
        }
      }}
    >
      <div className="product-img-wrap">
        <img src={productImage(product)} alt={product.title} loading="lazy" />
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
      </div>
      <div className="product-info">
        <div className="product-title">{product.title}</div>
        <div className="product-price-row">
          <span className="product-price">
            <span className="currency">{price.symbol}</span>
            {price.amount}
          </span>
        </div>
        <div className="product-rating">
          <span className="star">
            <Star size={12} fill="#ee4d2d" color="#ee4d2d" />
          </span>
          <span>{rating}</span>
          <span className="product-sold">| {formatSold(sold)}</span>
        </div>
        {(product.cod_available || product.halal_status === "certified" || product.bpom_status === "registered") && (
          <div className="product-badges">
            {product.cod_available && <span className="mini-badge cod">COD</span>}
            {product.halal_status === "certified" && (
              <span className="mini-badge halal">
                <BadgeCheck size={9} style={{ display: "inline" }} /> Halal
              </span>
            )}
            {product.bpom_status === "registered" && (
              <span className="mini-badge bpom">
                <CheckCircle2 size={9} style={{ display: "inline" }} /> BPOM
              </span>
            )}
            {product.city === "Singapore" && <span className="mini-badge mall">Shopee Mall</span>}
          </div>
        )}
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
