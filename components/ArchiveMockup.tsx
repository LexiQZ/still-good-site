
import React from 'react';
import { Heart, Search, ShoppingBag, ArrowRight } from 'lucide-react';

export const ArchiveMockup: React.FC = () => {
  const products = [
    { 
      id: 1, 
      name: 'Still Good Classic Boxy Tee', 
      price: '$45', 
      category: 'Tops & Clothes', 
      img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400&h=500' 
    },
    { 
      id: 2, 
      name: 'Signature Selvedge Denim', 
      price: '$160', 
      category: 'Pants & Bottoms', 
      img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=400&h=500' 
    },
    { 
      id: 3, 
      name: 'Still Good Archive Twill Cap', 
      price: '$35', 
      category: 'Hats & Headwear', 
      img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400&h=500' 
    },
    { 
      id: 4, 
      name: 'Structured Utility Jacket', 
      price: '$210', 
      category: 'Tops & Clothes', 
      img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=400&h=500' 
    },
    { 
      id: 5, 
      name: 'Relaxed Tailored Chinos', 
      price: '$120', 
      category: 'Pants & Bottoms', 
      img: 'https://images.unsplash.com/photo-1624371414361-e6e8ea01c1e6?auto=format&fit=crop&q=80&w=400&h=500' 
    },
    { 
      id: 6, 
      name: 'Washed Canvas Bucket Hat', 
      price: '$40', 
      category: 'Hats & Headwear', 
      img: 'https://images.unsplash.com/photo-1576871337622-98d48d405b70?auto=format&fit=crop&q=80&w=400&h=500' 
    },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-sm overflow-hidden shadow-lg p-6 md:p-12 space-y-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Digital Concept</span>
        <h3 className="serif text-4xl font-bold">Still Good Archive Portal</h3>
        <p className="text-sm text-slate-500 max-w-lg">
          An archival showcase for <span className="text-black font-bold">Still Good's</span> diverse collection, featuring curated Tops, Pants, and Signature Headwear.
        </p>
      </div>

      <div className="bg-white rounded-sm border shadow-inner overflow-hidden">
        {/* Mock Header */}
        <div className="border-b px-8 py-4 flex items-center justify-between bg-white">
          <div className="flex flex-col items-start leading-none">
            <h3 className="serif text-xl tracking-tighter font-bold">STILL GOOD</h3>
            <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400">Archive</span>
          </div>
          <div className="flex items-center gap-6 text-slate-300">
            <nav className="hidden md:flex gap-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
              <span className="text-black underline decoration-1 underline-offset-4">Browse All</span>
              <span>Tops</span>
              <span>Pants</span>
              <span>Hats</span>
            </nav>
            <div className="flex items-center gap-4">
              <Search className="w-4 h-4" />
              <ShoppingBag className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>

        {/* Mock Grid */}
        <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10">
          {products.map((p) => (
            <div key={p.id} className="space-y-3 group cursor-pointer">
              <div className="aspect-[3/4] bg-slate-100 overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-700">
                <img 
                  src={p.img} 
                  alt={p.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[7px] font-bold uppercase tracking-widest">Origin</div>
                <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border border-slate-100">LTD: 3-4 UNITS</div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{p.category}</p>
                <h6 className="font-bold text-xs truncate">{p.name}</h6>
                <p className="text-[10px] text-slate-500">{p.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-8 text-[9px] font-bold uppercase tracking-widest text-slate-400">
          <span>Still Good Direct HK Hub</span>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <span>Curated Clothes & Bottoms</span>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <span>Limited Signature Hats</span>
        </div>
      </div>
    </div>
  );
};
