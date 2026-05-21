import React, { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/data/blog-posts";

const TELEGRAM = "https://t.me/psychometriks_pro";

function useSeoMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement("meta"); (desc as HTMLMetaElement).name = "description"; document.head.appendChild(desc); }
    (desc as HTMLMetaElement).content = description;
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) { ogTitle = document.createElement("meta"); (ogTitle as HTMLMetaElement).setAttribute("property", "og:title"); document.head.appendChild(ogTitle); }
    (ogTitle as HTMLMetaElement).content = title;
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) { ogDesc = document.createElement("meta"); (ogDesc as HTMLMetaElement).setAttribute("property", "og:description"); document.head.appendChild(ogDesc); }
    (ogDesc as HTMLMetaElement).content = description;
    let ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) { ogType = document.createElement("meta"); (ogType as HTMLMetaElement).setAttribute("property", "og:type"); document.head.appendChild(ogType); }
    (ogType as HTMLMetaElement).content = "website";
  }, [title, description]);
}

function BlogGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent" />
          <div className="text-5xl mb-5">📰</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#00e5ff] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">BLOG & ANÁLISIS</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            Los análisis institucionales de mercado están disponibles para miembros con plan
            <span className="text-[#00e5ff] font-bold"> Básico</span> o superior.
          </div>
          <div className="border border-[#00e5ff22] bg-[#020408] px-5 py-4 mb-6 text-left">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#00e5ff] mb-3">⬡ INCLUÍDO DESDE $9/mes</div>
            <div className="space-y-1.5">
              {["Análisis semanal BTC, ETH y macro","Estrategias SMC y Order Blocks","Gestión de riesgo institucional","Publicaciones del equipo PSYCHOMETRIKS","Acceso histórico completo"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[11px] text-[#8a9ab0]">
                  <span className="text-[#00e5ff] text-[9px]">✦</span> {f}
                </div>
              ))}
            </div>
          </div>
          <a href="/pricing" className="block w-full py-3 bg-[#00e5ff] text-[#020408] font-space text-[12px] font-bold tracking-[0.2em] uppercase text-center no-underline hover:bg-white transition-colors">
            VER PLANES →
          </a>
          <div className="mt-4 font-space text-[10px] text-[#5a8898]">
            ¿Ya sos miembro? <a href="/login" className="text-[#00e5ff] hover:underline">Iniciá sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Blog() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { role?: string; plan?: string; ts?: number } | null; } catch { return null; } })();
  const expired = auth ? Date.now() - (auth as { ts?: number }).ts! > 8 * 60 * 60 * 1000 : true;
  const isLoggedIn = !!auth && !expired;
  if (!isLoggedIn) return <BlogGate />;

  return <BlogContent />;
}

function BlogContent() {
  const [activeCategory, setActiveCategory] = useState<string>("TODOS");
  const [search, setSearch] = useState("");

  useSeoMeta(
    "Blog de Trading Cripto en Español | PSYCHOMETRIKS — Análisis, SMC, Bitcoin, Educación",
    "Análisis de mercado cripto en español, Smart Money Concept, Bitcoin, Ethereum, gestión de riesgo y educación para traders. Publicaciones semanales del equipo PSYCHOMETRIKS."
  );

  const filtered = useMemo(() => {
    let posts = BLOG_POSTS;
    if (activeCategory !== "TODOS") {
      posts = posts.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return posts;
  }, [activeCategory, search]);

  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Hero */}
      <section className="pt-32 pb-10 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4 flex items-center gap-3">
          Análisis & Educación <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
        </div>
        <h1 className="font-bebas text-6xl md:text-9xl leading-none mb-4">
          ANÁLISIS DE<br /><span className="text-[#00e5ff]">MERCADO</span>
        </h1>
        <p className="text-[#7ab3c8] font-space text-sm max-w-xl leading-relaxed">
          Análisis institucional de BTC, ETH, XAU y macro global. Contenido educativo para traders que quieren entender el mercado de fondo.
        </p>
      </section>

      {/* Search + Filter bar */}
      <section className="px-6 md:px-12 pb-8">
        {/* Search */}
        <div className="relative mb-5 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a8898] font-space text-[12px]">⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar artículos, temas, estrategias..."
            className="w-full bg-[#060a0f] border border-[#1a2535] text-white font-space text-[12px] pl-8 pr-4 py-2.5 outline-none focus:border-[#00e5ff44] placeholder:text-[#5a8898] transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a8898] hover:text-white text-[11px]">✕</button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {BLOG_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="font-space text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 transition-colors border"
              style={activeCategory === cat
                ? { background: "#00e5ff", color: "#020408", borderColor: "#00e5ff" }
                : { background: "transparent", color: "#4a6070", borderColor: "#1a2535" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="mt-3 font-space text-[10px] text-[#5a8898]">
          {filtered.length} {filtered.length === 1 ? "artículo" : "artículos"}
          {activeCategory !== "TODOS" && <span> en <span className="text-[#7ab3c8]">{activeCategory}</span></span>}
          {search && <span> para "<span className="text-[#7ab3c8]">{search}</span>"</span>}
        </div>
      </section>

      {/* Empty state */}
      {filtered.length === 0 && (
        <section className="px-6 md:px-12 pb-20 text-center py-20">
          <div className="font-bebas text-4xl text-[#1a2535] mb-3">SIN RESULTADOS</div>
          <p className="font-space text-[12px] text-[#5a8898]">No hay artículos para esa búsqueda. Probá con otro término o categoría.</p>
          <button onClick={() => { setSearch(""); setActiveCategory("TODOS"); }}
            className="mt-6 font-space text-[11px] text-[#00e5ff] tracking-[0.1em] uppercase hover:underline">
            Ver todos los artículos →
          </button>
        </section>
      )}

      {/* Featured post */}
      {featured && (
        <section className="px-6 md:px-12 pb-12">
          <Link href={`/blog/${featured.slug}`}
            className="block border border-[#1a2535] hover:border-[#00e5ff44] transition-colors no-underline group">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Visual panel */}
              <div className="bg-[#0d1520] p-12 flex flex-col justify-between min-h-[280px] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{ backgroundImage: "linear-gradient(rgba(0,229,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,1) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
                <div className="relative">
                  <div className="font-space text-[10px] tracking-[0.3em] uppercase mb-3 inline-block px-3 py-1"
                    style={{ color: featured.categoryColor, background: `${featured.categoryColor}15`, border: `1px solid ${featured.categoryColor}33` }}>
                    ★ DESTACADO · {featured.category}
                  </div>
                </div>
                <div className="relative">
                  <div className="font-bebas text-6xl text-white leading-none mb-2 group-hover:text-[#00e5ff] transition-colors">
                    {featured.readTime} de lectura
                  </div>
                  <div className="font-space text-[11px] text-[#7ab3c8]">{featured.date}</div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {featured.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="font-space text-[9px] text-[#5a8898] border border-[#1a2535] px-2 py-0.5">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Content panel */}
              <div className="bg-[#060a0f] p-10 flex flex-col justify-between">
                <div>
                  <h2 className="font-bebas text-3xl md:text-4xl text-white leading-tight mb-4 group-hover:text-[#00e5ff] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="font-space text-[12px] text-[#7ab3c8] leading-relaxed mb-6">{featured.excerpt}</p>
                </div>
                <div className="font-space text-[11px] text-[#00e5ff] tracking-[0.1em] uppercase group-hover:translate-x-1 transition-transform inline-block">
                  Leer análisis completo →
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Posts grid */}
      {rest.length > 0 && (
        <section className="px-6 md:px-12 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a2535] border border-[#1a2535]">
            {rest.map((post, i) => (
              <Link key={i} href={`/blog/${post.slug}`}
                className="block bg-[#060a0f] p-8 hover:bg-[#0d1520] transition-colors group no-underline relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
                  style={{ background: `linear-gradient(90deg,${post.categoryColor},transparent)` }} />

                <div className="flex items-center gap-2 mb-4">
                  <span className="font-space text-[9px] px-2.5 py-1 tracking-[0.15em] uppercase"
                    style={{ color: post.categoryColor, background: `${post.categoryColor}15`, border: `1px solid ${post.categoryColor}33` }}>
                    {post.category}
                  </span>
                  <span className="font-space text-[9px] text-[#5a8898]">{post.readTime}</span>
                </div>

                <h3 className="font-bebas text-2xl text-white leading-tight mb-3 group-hover:text-[#00e5ff] transition-colors">
                  {post.title}
                </h3>
                <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-5">{post.excerpt}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="font-space text-[9px] text-[#5a8898] border border-[#1a2535] px-2 py-0.5">#{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-space text-[10px] text-[#5a8898]">{post.date}</span>
                  <span className="font-space text-[10px] text-[#00e5ff] group-hover:translate-x-1 transition-transform inline-block">Leer →</span>
                </div>
              </Link>
            ))}

            {/* Newsletter CTA card — show when grid has room */}
            {rest.length % 3 !== 2 && (
              <div className="bg-[#080d14] p-8 flex flex-col justify-between border-t border-[#1a2535] md:border-t-0">
                <div>
                  <div className="font-space text-[10px] text-[#229ED9] tracking-[0.3em] uppercase mb-4">✈️ CANAL TELEGRAM</div>
                  <div className="font-bebas text-3xl text-white mb-3">RECIBÍ LOS ANÁLISIS EN TU TELEGRAM</div>
                  <p className="font-space text-[11px] text-[#7ab3c8] leading-relaxed mb-6">
                    Publicamos análisis de mercado diarios, señales y alertas de liquidaciones directamente en el canal.
                  </p>
                </div>
                <a href={TELEGRAM} target="_blank" rel="noopener noreferrer"
                  className="block text-center font-space text-[11px] font-bold tracking-[0.15em] uppercase py-3 text-white no-underline hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg,#2CA5E0,#229ED9)" }}>
                  ✈️ UNIRSE GRATIS
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Topics / Tags cloud */}
      <section className="border-t border-[#1a2535] px-6 md:px-12 py-16">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-8">Temas cubiertos</div>
        <div className="flex flex-wrap gap-3">
          {[
            "Bitcoin", "Ethereum", "XAU/USD", "DXY", "Macro", "SMC",
            "Order Blocks", "FVG", "Liquidaciones", "Funding Rate", "On-Chain",
            "Fear & Greed", "Open Interest", "Altcoins", "Derivados",
            "Position Sizing", "Gestión de Riesgo", "Halving", "BTC Dominance",
            "Velas Japonesas", "Fibonacci", "Golden Pocket", "Altseason",
          ].map(t => (
            <button key={t}
              onClick={() => { setSearch(t); setActiveCategory("TODOS"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="font-space text-[11px] text-[#7ab3c8] border border-[#1a2535] px-4 py-2 hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors cursor-pointer">
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
