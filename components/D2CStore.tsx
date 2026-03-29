
import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { 
  Search, 
  ShoppingBag, 
  Heart, 
  Filter, 
  ShieldCheck,
  Globe,
  ArrowRight,
  Menu,
  Loader2,
  X,
  Truck,
  CheckCircle2,
  Info,
  MapPin,
  ClipboardCheck
} from 'lucide-react';

interface Product {
  csvId?: string;
  id: string;
  name: string;
  price: string;
  units: string;
  category: string;
  categories?: string[];
  style: string;
  color: string;
  description: string;
  img: string;
  availableSizes: string[];
  details?: string[];
}

interface D2CStoreProps {
  onBack: () => void;
}

/**
 * Robust image processing for Google Drive and external links
 */
const getProcessedImg = (url: string) => {
  if (!url) return '';
  if (url.startsWith('data:image') || url.startsWith('/')) return url;
  const driveId = url.match(/[-\w]{25,}/)?.[0];
  if (driveId) {
    const rawUrl = `https://drive.google.com/uc?export=view&id=${driveId}`;
    return `https://images.weserv.nl/?url=${encodeURIComponent(rawUrl)}&w=1200&fit=contain`;
  }
  return url;
};

/** Sidebar order: audience + garment type (mapped from English tags in CSV `categories`). */
const SHOP_NAV_ORDER = ['Shop All', 'Ladies', 'Unisex', 'Tops', 'Bottoms', 'Accessories'] as const;

const TOP_TYPE_TAGS = new Set([
  'jacket',
  'outerwear',
  'knitwear',
  'tee',
  'top',
  'vest',
  'sweatshirt',
  'hoodie',
  'shirt',
  'blouse',
  'cardigan',
  'pullover',
  'fleece',
  'coat',
]);

const BOTTOM_TYPE_TAGS = new Set([
  'pants',
  'bottoms',
  'shorts',
  'skirt',
  'jeans',
  'trousers',
  'leggings',
]);

const ACCESSORY_TYPE_TAGS = new Set([
  'accessories',
  'accessory',
  'scarf',
  'beanie',
  'headwear',
  'hat',
  'cap',
  'bag',
  'belt',
  'gloves',
  'socks',
  'jewelry',
  'wallet',
]);

function productTagSet(p: Product): Set<string> {
  const raw = p.categories?.length ? p.categories : [p.category];
  return new Set(
    raw
      .map((c) => c.replace(/\s+/g, ' ').trim().toLowerCase())
      .filter(Boolean)
  );
}

function productMatchesShopCategory(p: Product, navKey: string): boolean {
  if (navKey === 'Shop All') return true;
  const tags = productTagSet(p);
  const tagList = [...tags];
  const hasBottom = tagList.some((t) => BOTTOM_TYPE_TAGS.has(t));
  const hasAccessory = tagList.some((t) => ACCESSORY_TYPE_TAGS.has(t));
  const hasTopShape = tagList.some((t) => TOP_TYPE_TAGS.has(t));

  switch (navKey) {
    case 'Ladies':
      return tags.has('ladies');
    case 'Unisex':
      return tags.has('unisex');
    case 'Bottoms':
      return hasBottom;
    case 'Accessories':
      return hasAccessory && !hasBottom;
    case 'Tops':
      // Knitwear on pants made every bottom also match "Tops"; exclude bottoms and pure accessories.
      return hasTopShape && !hasBottom && !hasAccessory;
    default:
      return false;
  }
}

const ArchiveImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
    setImgSrc(getProcessedImg(src));
  }, [src]);

  return (
    <div className={`relative bg-[#F9F9F9] overflow-hidden ${className}`}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-slate-200" />
        </div>
      )}
      <img 
        src={imgSrc} 
        alt={alt} 
        className={`w-full h-full object-cover scale-[1.02] transition-all duration-1000 ${status === 'success' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('success')}
        onError={() => {
          if (src.startsWith('data:image')) {
            setStatus('error');
            return;
          }
          const driveId = src.match(/[-\w]{25,}/)?.[0];
          if (driveId && !imgSrc.includes('thumbnail')) {
            setImgSrc(`https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`);
          } else {
            setStatus('error');
            setImgSrc('https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=800');
          }
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const D2CStore: React.FC<D2CStoreProps> = () => {
  const INITIAL_VISIBLE_COUNT = 24;
  const LOAD_MORE_STEP = 12;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [cartJustUpdated, setCartJustUpdated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<
    {
      id: string;
      name: string;
      size: string | null;
      priceLabel: string;
      priceValue: number;
      img: string;
      quantity: number;
      selected: boolean;
    }[]
  >([]);
  const [activeCategory, setActiveCategory] = useState('Shop All');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [navDrawerEntered, setNavDrawerEntered] = useState(false);
  const [cartDrawerEntered, setCartDrawerEntered] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickPicksOpen, setQuickPicksOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const searchCloseTimerRef = useRef<number | null>(null);
  const cartCloseTimerRef = useRef<number | null>(null);
  const productGridAnchorRef = useRef<HTMLDivElement>(null);

  const CART_DRAWER_MS = 300;

  const scrollToProductGrid = useCallback(() => {
    const run = () => {
      const el = productGridAnchorRef.current;
      if (!el) return;
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    };
    if (typeof window === 'undefined') return;
    const narrow = window.matchMedia('(max-width: 1023px)').matches;
    if (narrow) {
      window.setTimeout(run, 320);
    } else {
      window.requestAnimationFrame(run);
    }
  }, []);

  const closeCartAnimated = useCallback(() => {
    const w = typeof window !== 'undefined' ? window : null;
    const reduce = !!(w && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const isLg = !!(w && w.matchMedia('(min-width: 1024px)').matches);
    if (cartCloseTimerRef.current) {
      window.clearTimeout(cartCloseTimerRef.current);
      cartCloseTimerRef.current = null;
    }
    setCartDrawerEntered(false);
    if (reduce || isLg) {
      setCartOpen(false);
      return;
    }
    cartCloseTimerRef.current = window.setTimeout(() => {
      setCartOpen(false);
      cartCloseTimerRef.current = null;
    }, CART_DRAWER_MS);
  }, []);

  useEffect(() => {
    fetch('/products.json')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  // When opening a product, auto-select size if only one available
  useEffect(() => {
    if (selectedProduct) {
      if (selectedProduct.availableSizes.length === 1) {
        setSelectedSize(selectedProduct.availableSizes[0]);
      } else {
        setSelectedSize(null);
      }
    } else {
      setSelectedSize(null);
    }
  }, [selectedProduct]);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = productMatchesShopCategory(p, activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory;
    const haystack = [
      p.name,
      p.style,
      p.color,
      p.category,
      ...(p.categories || []),
    ]
      .join(' ')
      .toLowerCase();
    return matchesCategory && haystack.includes(q);
  });
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = filteredProducts.length > visibleCount;

  const categories = SHOP_NAV_ORDER.filter(
    (key) => key === 'Shop All' || products.some((p) => productMatchesShopCategory(p, key))
  );

  const parsePrice = (price: string): number => {
    const numeric = parseFloat(price.replace(/[^0-9.]/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => (item.selected ? sum + item.priceValue * item.quantity : sum),
    0
  );

  // Ensure items are selected by default when cart opens
  useEffect(() => {
    if (cartOpen) {
      setCartItems((prev) => prev.map((item) => ({ ...item, selected: item.selected ?? true })));
    }
  }, [cartOpen]);

  // Reset listing pagination when filters/search/data change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeCategory, searchQuery, products.length]);

  // Mobile nav drawer slide-in (no reset-to-false on open — avoids Strict Mode double animation)
  useLayoutEffect(() => {
    if (!mobileFiltersOpen) {
      setNavDrawerEntered(false);
      return undefined;
    }
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      if (!cancelled) setNavDrawerEntered(true);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [mobileFiltersOpen]);

  // Mobile: slide in after mount (single rAF). Desktop (lg+): no motion; CSS keeps panel visible.
  useLayoutEffect(() => {
    if (!cartOpen) {
      setCartDrawerEntered(false);
      return undefined;
    }
    if (cartCloseTimerRef.current) {
      window.clearTimeout(cartCloseTimerRef.current);
      cartCloseTimerRef.current = null;
    }
    const isLg = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
    if (isLg) {
      setCartDrawerEntered(true);
      return undefined;
    }
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      if (!cancelled) setCartDrawerEntered(true);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [cartOpen]);

  useEffect(() => {
    if (!cartOpen || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cartOpen]);

  useEffect(() => {
    if (!mobileFiltersOpen || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) setMobileFiltersOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const categoryNavInner = (
    <>
      <div className="space-y-2 lg:space-y-6">
        <div className="hidden lg:flex items-center justify-between border-b border-slate-900 pb-3">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Categories</h4>
          <Filter className="w-3 h-3" />
        </div>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setMobileFiltersOpen(false);
                scrollToProductGrid();
              }}
              className={`text-left text-[11px] py-2.5 px-1 rounded-sm transition-all ${activeCategory === cat ? 'text-black font-bold pl-2 border-l-2 border-black bg-slate-50/80' : 'text-slate-400 hover:text-black hover:bg-slate-50'}`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-5 bg-slate-50 border border-slate-100 rounded-sm">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-slate-900">
          <MapPin className="w-3 h-3" /> Warehouse Origin
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase">Hong Kong Hub</p>
        <div className="h-px bg-slate-200" />
        <p className="text-[10px] text-slate-400 italic">Limited quantities per style, with global logistics support.</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-black selection:text-white antialiased font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-[100] border-b border-slate-100">
        <div className="max-w-screen-2xl mx-auto h-14 md:h-16 px-6 lg:px-12 flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <button
              type="button"
              className="lg:hidden p-1 -ml-1 rounded-sm text-slate-400 hover:text-black transition-colors"
              aria-label={mobileFiltersOpen ? 'Hide categories' : 'Show categories'}
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((v) => !v)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <h1 className="serif text-lg md:text-xl font-bold tracking-tight leading-none text-black">STILL GOOD</h1>
          </div>
          <div className="flex-1 flex items-center justify-end gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((v) => {
                    const next = !v;
                    setQuickPicksOpen(next);
                    return next;
                  });
                }}
                className="flex items-center justify-center text-slate-400 hover:text-black transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
              {searchOpen && (
                <div
                  className="relative"
                  onMouseEnter={() => {
                    if (searchCloseTimerRef.current) {
                      window.clearTimeout(searchCloseTimerRef.current);
                      searchCloseTimerRef.current = null;
                    }
                    setQuickPicksOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (searchCloseTimerRef.current) window.clearTimeout(searchCloseTimerRef.current);
                    searchCloseTimerRef.current = window.setTimeout(() => {
                      setQuickPicksOpen(false);
                    }, 180);
                  }}
                >
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-0.5">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search archive…"
                    onFocus={() => {
                      if (searchCloseTimerRef.current) {
                        window.clearTimeout(searchCloseTimerRef.current);
                        searchCloseTimerRef.current = null;
                      }
                      setQuickPicksOpen(true);
                    }}
                    className="w-40 md:w-56 bg-transparent outline-none text-[11px] uppercase tracking-[0.16em] text-slate-900 placeholder:text-slate-300"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[9px] uppercase tracking-[0.16em] text-slate-400 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>

                  {/* Suggestions */}
                  {quickPicksOpen && (
                  <div className="absolute left-0 top-full mt-2 w-[18rem] bg-white border border-slate-100 shadow-xl rounded-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Quick picks
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter((c) => c !== 'Shop All')
                        .slice(0, 8)
                        .map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setSearchQuery(c);
                              setQuickPicksOpen(false);
                            }}
                            className="px-2 py-1 border border-slate-200 hover:border-black text-[9px] font-bold uppercase tracking-[0.16em] text-slate-600"
                          >
                            {c}
                          </button>
                        ))}
                    </div>
                  </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Heart className="w-4 h-4 text-slate-300" />
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative"
              >
                <ShoppingBag className={`w-4 h-4 transition-transform duration-300 ${cartJustUpdated ? 'scale-110' : 'scale-100'}`} />
                <span className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[7px] font-bold flex items-center justify-center rounded-full transition-transform duration-300 ${cartJustUpdated ? 'scale-110' : 'scale-100'}`}>
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: categories as left drawer (does not push the product grid) */}
      {mobileFiltersOpen && (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 z-[110] bg-slate-900/45 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <aside
            className={`fixed left-0 top-0 bottom-0 z-[120] w-[min(19rem,88vw)] max-w-full bg-white shadow-2xl border-r border-slate-100 flex flex-col overflow-hidden transition-transform duration-300 ease-out motion-reduce:transition-none ${navDrawerEntered ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Categories</span>
              <button
                type="button"
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-black transition-colors"
                aria-label="Close categories"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-8">{categoryNavInner}</div>
          </aside>
        </div>
      )}

      <main className="pt-14 md:pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-stone-50 via-white to-slate-50/80 pt-8 pb-6 md:pt-12 md:pb-12 px-6 md:px-12 border-b border-slate-100">
          <div className="max-w-screen-2xl mx-auto flex flex-col items-center text-center">
            <span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.42em] text-slate-400 mb-8">
              The Edit · Limited Release
            </span>

            <div className="flex flex-col items-center text-center mb-8 md:mb-12">
              <h3 className="text-3xl md:text-6xl font-black uppercase tracking-[0.25em] text-slate-900 mt-8">
                STILL GOOD
              </h3>
              <p className="mt-2.5 md:mt-3 max-w-sm mx-auto text-[9px] md:text-[12px] lg:text-[13px] font-semibold md:font-bold uppercase tracking-[0.26em] md:tracking-[0.28em] lg:tracking-[0.24em] text-slate-500 leading-relaxed">
                Touch for the very first time
              </p>
            </div>

            <p className="mt-3 md:mt-4 text-[8px] md:text-[9px] font-medium uppercase tracking-[0.26em] text-slate-300 leading-[1.9] max-w-md mx-auto lg:max-w-none lg:whitespace-nowrap">
              Meticulously curated · Scarce editions · Made to keep.
            </p>
          </div>
        </section>

        {/* Filters & Grid */}
        <div
          ref={productGridAnchorRef}
          className="max-w-screen-2xl mx-auto px-6 md:px-12 pt-5 pb-8 md:pt-10 md:pb-20 scroll-mt-14 md:scroll-mt-16"
        >
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            <aside className="hidden lg:block w-full lg:w-64 shrink-0 space-y-6 lg:space-y-12 lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:overflow-x-hidden lg:pb-2">
              {categoryNavInner}
            </aside>

            <div className="flex-1">
              {productsLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-10 gap-y-5">
                    {visibleProducts.map((p) => (
                  <div 
                    key={p.id} 
                        className="group cursor-pointer space-y-4"
                    onClick={() => setSelectedProduct(p)}
                  >
                        <div className="aspect-[3/4] max-w-[220px] md:max-w-[240px] mx-auto overflow-hidden relative border border-slate-100 bg-white px-3 py-2 md:px-4 md:py-3">
                      <ArchiveImage 
                        src={p.img} 
                        alt={p.name} 
                        className="w-full h-full transition-transform duration-1000 group-hover:scale-105" 
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <h4 className="font-bold text-sm tracking-tight group-hover:underline decoration-[0.5px] underline-offset-4">{p.name}</h4>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{p.color}</p>
                      <p className="serif italic text-base text-slate-600">{p.price}</p>
                    </div>
                  </div>
                ))}
              </div>
                  {hasMoreProducts && (
                    <div className="flex justify-center mt-14">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_STEP)}
                        className="px-6 py-3 border border-slate-300 hover:border-black text-[11px] font-bold uppercase tracking-[0.2em] text-slate-700 hover:text-black transition-all"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Product Detail Modal (PDP) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative bg-white w-full max-w-6xl h-full max-h-[90vh] md:h-auto overflow-y-auto flex flex-col md:flex-row shadow-2xl rounded-sm">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 z-10 p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>


            {/* PDP Image Side */}
            <div className="w-full md:w-2/5 bg-[#F9F9F9] p-8 md:p-12 flex items-center justify-center">
              <div className="w-full max-w-xs md:max-w-sm aspect-[3/4] border border-slate-100 bg-white">
                <ArchiveImage src={selectedProduct.img} alt={selectedProduct.name} className="w-full h-full" />
              </div>
            </div>

            {/* PDP Details Side */}
            <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col justify-center space-y-4">
              <div className="space-y-2 mt-0 md:mt-8">
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-2 text-emerald-600">
                  <ClipboardCheck className="w-3 h-3" /> 100% Quality Inspected
                  </div>
                  <span className="text-[9px] text-slate-300 tracking-[0.14em]">
                    ID: {selectedProduct.csvId || selectedProduct.id}
                  </span>
                </div>
                <h3 className="serif text-2xl md:text-3xl font-bold leading-snug break-words">
                  {selectedProduct.name}
                </h3>
                <div className="flex items-baseline gap-4">
                  <p className="text-2xl font-light text-slate-900">{selectedProduct.price}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Excl. Import Fees</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Color: {selectedProduct.color}</span>
                  <span className="text-slate-200">|</span>
                  <span>Style: {selectedProduct.id}</span>
                </div>
              </div>

              {/* Details: origin + QC (all pieces are new — no redundant “condition” row) */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-5 border border-slate-100 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Details</h4>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1 max-w-sm">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Ships from</span>
                    <span className="text-[9px] text-slate-900 font-bold">Hong Kong Hub</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Quality-inspected before dispatch. Every item is new and handled by the STILL GOOD team.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                   <div className="text-[10px] font-black uppercase tracking-widest mb-0.5">
                    <span>Available Sizes</span>
                   </div>
                   <div className="flex flex-wrap gap-2">
                     {selectedProduct.availableSizes.length === 0 ? (
                       <span className="text-xs text-slate-400 font-medium">Out of stock</span>
                     ) : (
                       selectedProduct.availableSizes.map((size) => {
                         const isSelected = selectedSize === size;
                       return (
                         <button 
                            key={size} 
                             onClick={() => setSelectedSize(size)}
                             className={`flex-1 min-w-[3rem] py-3 border text-xs font-bold transition-all ${
                               isSelected
                                 ? 'border-black bg-black text-white'
                                 : 'border-slate-200 hover:border-black text-black'
                             }`}
                         >
                           {size}
                         </button>
                       );
                       })
                     )}
                   </div>
                </div>

                {/* CTA + Cart Row */}
                <div className="flex items-center gap-3">
                  <button
                    className={`flex-1 py-5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed ${
                      cartJustUpdated ? 'bg-emerald-600 text-white' : 'bg-black text-white hover:bg-slate-900'
                    }`}
                    disabled={selectedProduct.availableSizes.length > 0 && !selectedSize}
                    onClick={() => {
                      if (selectedProduct.availableSizes.length > 0 && !selectedSize) return;
                      const baseId = selectedProduct.id;
                      const sizeKey = selectedSize ?? 'NOSIZE';
                      setCartItems((prev) => {
                        const idx = prev.findIndex(
                          (i) => i.id === baseId && (i.size ?? 'NOSIZE') === sizeKey
                        );
                        const priceValue = parsePrice(selectedProduct.price);
                        if (idx === -1) {
                          return [
                            ...prev,
                            {
                              id: baseId,
                              name: selectedProduct.name,
                              size: selectedSize,
                              priceLabel: selectedProduct.price,
                              priceValue,
                              img: selectedProduct.img,
                              quantity: 1,
                              selected: true,
                            },
                          ];
                        }
                        const next = [...prev];
                        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                        return next;
                      });
                      setCartCount((prev) => prev + 1);
                      setCartJustUpdated(true);
                      setTimeout(() => setCartJustUpdated(false), 400);
                    }}
                  >
                    {cartJustUpdated ? 'Added to Bag' : 'Add to Bag'}
                </button>

                  {/* Cart indicator inside PDP (all viewports) */}
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="flex items-center justify-start text-slate-500 ml-1"
                  >
                    <div className="relative">
                      <ShoppingBag className={`w-4 h-4 transition-transform duration-300 ${cartJustUpdated ? 'scale-110' : 'scale-100'}`} />
                      <span className={`absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-600 text-white text-[7px] font-bold flex items-center justify-center rounded-full transition-transform duration-300 ${cartJustUpdated ? 'scale-110' : 'scale-100'}`}>
                        {cartCount}
                      </span>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1 text-center">
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <Truck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Global Logistics</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Secured Stock</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-24 px-12">
        <div className="max-w-screen-2xl mx-auto flex flex-col items-center gap-12">
          <div className="text-center space-y-2">
            <h2 className="serif text-3xl font-bold">STILL GOOD</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">Timeless · Stylish · Elegant</p>
          </div>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest text-center max-w-sm leading-relaxed">
            Quality-inspected pieces, chosen for fabric and finish — made to wear.
          </p>

          <div className="w-full max-w-lg pt-10 mt-2 border-t border-slate-100 flex flex-col items-center gap-3 text-center">
            <p className="text-[10px] font-medium text-slate-400 tracking-wide">
              © {new Date().getFullYear()} STILL GOOD. All rights reserved.
            </p>
            <p className="text-[9px] text-slate-300 tracking-wide">
              still-good.net · Text, images, and design are the property of STILL GOOD unless otherwise noted.
            </p>
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[250] flex justify-end overflow-hidden">
          <button
            type="button"
            aria-label="Close cart"
            className={`flex-1 bg-slate-900/40 text-left border-0 p-0 lg:opacity-100 lg:cursor-pointer lg:transition-none max-lg:transition-opacity max-lg:duration-300 max-lg:ease-out motion-reduce:max-lg:transition-none ${cartDrawerEntered ? 'max-lg:opacity-100 max-lg:cursor-pointer' : 'max-lg:opacity-0 max-lg:pointer-events-none'}`}
            onClick={closeCartAnimated}
          />
          <div
            className={`w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-100 flex flex-col shrink-0 lg:translate-x-0 lg:transition-none max-lg:transition-transform max-lg:duration-300 max-lg:ease-out motion-reduce:max-lg:transition-none ${cartDrawerEntered ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full'}`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Cart ({cartCount})
              </h3>
              <button
                type="button"
                onClick={closeCartAnimated}
                className="p-1.5 rounded-full hover:bg-slate-50"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.length === 0 ? (
                <p className="text-xs text-slate-400">Your cart is currently empty.</p>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}-${item.size ?? 'NOSIZE'}`}
                    className="flex gap-3 border-b border-slate-100 pb-3 last:border-none"
                  >
                    {/* Selection circle */}
                    <button
                      type="button"
                      onClick={() => {
                        setCartItems((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], selected: !next[idx].selected };
                          return next;
                        });
                      }}
                      className="mt-6 w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center"
                    >
                      {item.selected && <div className="w-2 h-2 rounded-full bg-black" />}
                    </button>

                    <div className="w-16 h-20 border border-slate-100 bg-slate-50 overflow-hidden">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <p className="font-semibold text-slate-900 line-clamp-2">{item.name}</p>
                      <p className="text-slate-400 uppercase tracking-[0.16em]">
                        {item.size ? `Size ${item.size}` : 'Size —'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">
                          {item.priceLabel}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="w-5 h-5 border border-slate-300 flex items-center justify-center rounded-full text-[10px]"
                            onClick={() => {
                              setCartItems((prev) => {
                                const next = [...prev];
                                const current = next[idx];
                                if (current.quantity <= 1) {
                                  next.splice(idx, 1);
                                } else {
                                  next[idx] = { ...current, quantity: current.quantity - 1 };
                                }
                                return next;
                              });
                              setCartCount((prev) => Math.max(0, prev - 1));
                            }}
                          >
                            -
                          </button>
                          <span className="min-w-[1.5rem] text-center text-slate-700">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="w-5 h-5 border border-slate-300 flex items-center justify-center rounded-full text-[10px]"
                            onClick={() => {
                              setCartItems((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                                return next;
                              });
                              setCartCount((prev) => prev + 1);
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between text-xs">
              <button
                type="button"
                className="flex items-center gap-2 text-slate-500"
                onClick={() => {
                  const allSelected = cartItems.every((i) => i.selected);
                  setCartItems((prev) => prev.map((i) => ({ ...i, selected: !allSelected })));
                }}
              >
                <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center">
                  {cartItems.length > 0 && cartItems.every((i) => i.selected) && (
                    <div className="w-2 h-2 rounded-full bg-black" />
                  )}
                </div>
                <span className="font-bold uppercase tracking-[0.16em]">Select All</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-[0.2em] text-slate-500">Total</span>
                <span className="font-semibold text-slate-900">
                  {cartTotal > 0 ? `$${cartTotal.toFixed(2)}` : '$0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
