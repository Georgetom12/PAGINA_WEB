import React, { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import SiteNav from "@/components/site-nav";
import { BLOG_POSTS, type BlogPost as BlogPostData } from "@/data/blog-posts";

const TELEGRAM = "https://t.me/psychometriks_pro";

function setSeoMeta(post: BlogPostData) {
  document.title = `${post.title} | PSYCHOMETRIKS Blog`;
  const setMeta = (selector: string, attr: string, value: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      if (attr === "name") (el as HTMLMetaElement).name = value;
      else (el as HTMLMetaElement).setAttribute(attr, value.split("=")[0]);
      document.head.appendChild(el);
    }
    (el as HTMLMetaElement).content = value.includes("=") ? value.split("=").slice(1).join("=") : value;
  };
  // Standard meta
  const desc = post.excerpt.slice(0, 160);
  let descEl = document.querySelector('meta[name="description"]');
  if (!descEl) { descEl = document.createElement("meta"); (descEl as HTMLMetaElement).name = "description"; document.head.appendChild(descEl); }
  (descEl as HTMLMetaElement).content = desc;
  // OG tags
  const ogFields: [string, string][] = [
    ["og:title", `${post.title} | PSYCHOMETRIKS`],
    ["og:description", desc],
    ["og:type", "article"],
    ["og:url", `https://psychometriks.com/blog/${post.slug}`],
    ["twitter:card", "summary_large_image"],
    ["twitter:title", `${post.title} | PSYCHOMETRIKS`],
    ["twitter:description", desc],
  ];
  for (const [prop, content] of ogFields) {
    const isOg = prop.startsWith("og:");
    const selector = isOg ? `meta[property="${prop}"]` : `meta[name="${prop}"]`;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      if (isOg) el.setAttribute("property", prop);
      else (el as HTMLMetaElement).name = prop;
      document.head.appendChild(el);
    }
    (el as HTMLMetaElement).content = content;
  }
  // JSON-LD Article schema
  const existingLd = document.querySelector('script[type="application/ld+json"][data-blog]');
  if (existingLd) existingLd.remove();
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.setAttribute("data-blog", "1");
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": desc,
    "author": { "@type": "Organization", "name": "PSYCHOMETRIKS" },
    "publisher": { "@type": "Organization", "name": "PSYCHOMETRIKS", "url": "https://psychometriks.com" },
    "datePublished": post.date,
    "keywords": post.tags.join(", "),
    "url": `https://psychometriks.com/blog/${post.slug}`,
  });
  document.head.appendChild(ld);
}

function renderContent(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-bebas text-2xl md:text-3xl text-white mt-8 mb-3" style={{ color: "#00e5ff" }}>
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-bebas text-3xl md:text-4xl text-white mt-10 mb-4">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].replace("- ", ""));
        i++;
      }
      elements.push(
        <ul key={i} className="mb-4 space-y-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 font-space text-[13px] text-[#8a9ab0] leading-relaxed">
              <span className="text-[#00e5ff] mt-0.5 shrink-0">→</span>
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && lines[i].startsWith(`${num}. `)) {
        items.push(lines[i].replace(`${num}. `, ""));
        i++; num++;
      }
      elements.push(
        <ol key={i} className="mb-4 space-y-2 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-3 font-space text-[13px] text-[#8a9ab0] leading-relaxed">
              <span className="font-bebas text-lg text-[#00e5ff] shrink-0 w-6">{j + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      // skip empty
    } else if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**")) {
      elements.push(
        <p key={i} className="font-space text-[12px] text-[#5a8898] italic mt-6 border-l-2 border-[#1a2535] pl-4">
          {line.replace(/^\*|\*$/g, "")}
        </p>
      );
    } else {
      elements.push(
        <p key={i} className="font-space text-[13px] text-[#8a9ab0] leading-[1.8] mb-4"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
      );
    }
    i++;
  }
  return elements;
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const found = BLOG_POSTS.find(p => p.slug === params.slug);
    if (found) {
      setPost(found);
      setSeoMeta(found);
    } else {
      setNotFound(true);
      document.title = "Artículo no encontrado | PSYCHOMETRIKS Blog";
    }
  }, [params.slug]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex items-center justify-center">
        <SiteNav />
        <div className="text-center pt-32">
          <div className="font-bebas text-6xl text-[#7ab3c8] mb-4">404</div>
          <div className="font-space text-[13px] text-[#7ab3c8] mb-6">Artículo no encontrado</div>
          <Link href="/blog" className="font-space text-[11px] text-[#00e5ff] tracking-[0.1em] no-underline hover:underline">← Volver al blog</Link>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const related = BLOG_POSTS.filter(p => p.slug !== post.slug && (p.category === post.category || p.tags.some(t => post.tags.includes(t)))).slice(0, 2);
  const fallbackRelated = related.length >= 2 ? related : [...related, ...BLOG_POSTS.filter(p => p.slug !== post.slug && !related.find(r => r.slug === p.slug))].slice(0, 2);

  const readingProgress = 0;

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50" style={{ background: "#1a2535" }}>
        <ReadingProgress />
      </div>

      {/* Breadcrumb */}
      <div className="pt-28 pb-4 px-6 md:px-12 flex items-center gap-2 font-space text-[10px] text-[#5a8898] tracking-[0.1em]">
        <Link href="/" className="hover:text-[#00e5ff] no-underline transition-colors">Inicio</Link>
        <span>›</span>
        <Link href="/blog" className="hover:text-[#00e5ff] no-underline transition-colors">Blog</Link>
        <span>›</span>
        <span className="text-[#7ab3c8] truncate max-w-[200px]">{post.category}</span>
      </div>

      {/* Article header */}
      <header className="px-6 md:px-12 pb-12 max-w-4xl">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="font-space text-[10px] px-3 py-1.5 tracking-[0.15em] uppercase"
            style={{ color: post.categoryColor, background: `${post.categoryColor}15`, border: `1px solid ${post.categoryColor}33` }}>
            {post.category}
          </span>
          <span className="font-space text-[10px] text-[#5a8898]">{post.date}</span>
          <span className="font-space text-[10px] text-[#5a8898]">· {post.readTime} de lectura</span>
        </div>

        <h1 className="font-bebas text-4xl md:text-6xl lg:text-7xl leading-tight text-white mb-6">
          {post.title}
        </h1>
        <p className="font-space text-[14px] text-[#7ab3c8] leading-relaxed max-w-2xl mb-6">{post.subtitle}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map(tag => (
            <Link key={tag} href={`/blog?q=${encodeURIComponent(tag)}`}
              className="font-space text-[9px] text-[#5a8898] border border-[#1a2535] px-3 py-1 no-underline hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
              #{tag}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 pb-8 border-b border-[#1a2535] flex-wrap">
          <div className="w-9 h-9 bg-[#00e5ff22] border border-[#00e5ff33] rounded flex items-center justify-center font-bebas text-lg text-[#00e5ff]">P</div>
          <div>
            <div className="font-space text-[11px] text-white">PSYCHOMETRIKS TEAM</div>
            <div className="font-space text-[10px] text-[#5a8898]">Análisis institucional · Trading educativo</div>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyLink}
              className="font-space text-[10px] tracking-[0.15em] uppercase px-4 py-2 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
              {copied ? "✓ Copiado" : "🔗 Copiar enlace"}
            </button>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`📊 ${post.title}`)}&url=${encodeURIComponent(`https://psychometriks.com/blog/${post.slug}`)}&via=psychometriks_pro`}
              target="_blank" rel="noopener noreferrer"
              className="font-space text-[10px] tracking-[0.15em] uppercase px-4 py-2 border border-[#1a253544] text-[#7ab3c8] hover:bg-[#1a253515] transition-colors no-underline">
              𝕏 Tweet
            </a>
            <a href={`${TELEGRAM}?text=${encodeURIComponent(`📊 ${post.title} — psychometriks.com/blog/${post.slug}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="font-space text-[10px] tracking-[0.15em] uppercase px-4 py-2 border border-[#229ED944] text-[#229ED9] hover:bg-[#229ED915] transition-colors no-underline">
              ✈️ Telegram
            </a>
          </div>
        </div>
      </header>

      {/* Article content */}
      <article className="px-6 md:px-12 pb-16 max-w-3xl">
        {renderContent(post.content)}
      </article>

      {/* Tags footer */}
      <div className="px-6 md:px-12 pb-10 max-w-3xl">
        <div className="border-t border-[#1a2535] pt-8">
          <div className="font-space text-[10px] text-[#5a8898] tracking-[0.3em] uppercase mb-3">Etiquetas</div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Link key={tag} href="/blog"
                className="font-space text-[10px] text-[#7ab3c8] border border-[#1a2535] px-3 py-1 no-underline hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-colors">
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="px-6 md:px-12 pb-16 max-w-3xl">
        <div className="border border-[#00e5ff33] bg-[#00e5ff08] p-8">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-3">⚡ LIQMAP PRO</div>
          <div className="font-bebas text-3xl text-white mb-3">Aplicá este análisis en tiempo real</div>
          <p className="font-space text-[12px] text-[#7ab3c8] leading-relaxed mb-6">
            Los indicadores mencionados en este artículo están disponibles en vivo en el LiqMap PRO: Mapa de Liquidaciones, Funding Rate, Fear & Greed, Score PSY y más.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a href="/liquid-map.html"
              className="font-space text-[11px] font-bold tracking-[0.15em] uppercase px-6 py-3 text-[#020408] no-underline hover:bg-white transition-colors"
              style={{ background: "#00e5ff" }}>
              ABRIR LIQMAP PRO →
            </a>
            <Link href="/pricing"
              className="font-space text-[11px] tracking-[0.15em] uppercase px-6 py-3 border border-[#00e5ff44] text-[#00e5ff] no-underline hover:bg-[#00e5ff15] transition-colors">
              VER PLANES
            </Link>
          </div>
        </div>
      </div>

      {/* Related posts */}
      {fallbackRelated.length > 0 && (
        <section className="border-t border-[#1a2535] px-6 md:px-12 py-16">
          <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-8">Más análisis relacionados</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#1a2535] border border-[#1a2535]">
            {fallbackRelated.map((p, i) => (
              <Link key={i} href={`/blog/${p.slug}`}
                className="block bg-[#060a0f] p-8 hover:bg-[#0d1520] transition-colors no-underline group">
                <span className="font-space text-[9px] px-2 py-1 tracking-[0.15em] uppercase mb-4 inline-block"
                  style={{ color: p.categoryColor, background: `${p.categoryColor}15`, border: `1px solid ${p.categoryColor}33` }}>
                  {p.category}
                </span>
                <h3 className="font-bebas text-2xl text-white leading-tight mb-2 group-hover:text-[#00e5ff] transition-colors">{p.title}</h3>
                <p className="font-space text-[11px] text-[#7ab3c8] mb-3">{p.readTime} · {p.date}</p>
                <p className="font-space text-[11px] text-[#5a8898] leading-relaxed">{p.excerpt.slice(0, 100)}...</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to blog */}
      <div className="px-6 md:px-12 pb-20">
        <Link href="/blog"
          className="font-space text-[11px] tracking-[0.15em] uppercase text-[#7ab3c8] hover:text-[#00e5ff] no-underline transition-colors">
          ← Volver al blog
        </Link>
      </div>
    </div>
  );
}

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      className="h-full transition-all duration-75"
      style={{ width: `${progress}%`, background: "linear-gradient(90deg,#00e5ff,#7c4dff)" }}
    />
  );
}
