import React, { useState, useMemo } from "react";

export interface GlossaryTerm {
  term: string;
  abbr?: string;
  category: string;
  color: string;
  badge?: string;
  badgeColor?: string;
  definition: string;
  details?: string;
  seeModule?: string;
  indicatorLabel?: string;
}

const CATEGORY_ORDER = [
  "Estructura de Mercado",
  "Smart Money — Zonas",
  "Liquidez",
  "Fibonacci & Niveles",
  "Gaps & Aperturas",
  "Sesiones & Timing",
  "IPDA & Entrega",
  "Macro & Contexto",
  "Gestión & Metodología",
];

const CAT_COLORS: Record<string, string> = {
  "Estructura de Mercado": "#00e5ff",
  "Smart Money — Zonas": "#ff6d00",
  "Liquidez": "#e040fb",
  "Fibonacci & Niveles": "#ffd700",
  "Gaps & Aperturas": "#00e676",
  "Sesiones & Timing": "#7c4dff",
  "IPDA & Entrega": "#ff1744",
  "Macro & Contexto": "#546e7a",
  "Gestión & Metodología": "#00e5ff",
};

interface GlossarySectionProps {
  terms: GlossaryTerm[];
}

export function GlossarySection({ terms }: GlossarySectionProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return terms.filter((t) => {
      const matchSearch = !q ||
        t.term.toLowerCase().includes(q) ||
        (t.abbr?.toLowerCase().includes(q) ?? false) ||
        t.definition.toLowerCase().includes(q) ||
        (t.details?.toLowerCase().includes(q) ?? false) ||
        t.category.toLowerCase().includes(q);
      const matchCat = !activeCategory || t.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [terms, search, activeCategory]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(terms.map((t) => t.category)));
    return CATEGORY_ORDER.filter((c) => cats.includes(c)).concat(
      cats.filter((c) => !CATEGORY_ORDER.includes(c))
    );
  }, [terms]);

  const grouped = useMemo(() => {
    const map: Record<string, GlossaryTerm[]> = {};
    filtered.forEach((t) => {
      if (!map[t.category]) map[t.category] = [];
      map[t.category].push(t);
    });
    return map;
  }, [filtered]);

  return (
    <div>
      {/* Search bar */}
      <div style={{
        display: "flex",
        gap: 10,
        marginBottom: 20,
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <span style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--muted)",
            fontSize: 14,
            pointerEvents: "none",
          }}>
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar concepto, sigla o descripción..."
            style={{
              width: "100%",
              background: "var(--bg3)",
              border: "1px solid var(--border2)",
              borderRadius: 3,
              padding: "10px 14px 10px 36px",
              color: "var(--text)",
              fontFamily: "'Rajdhani', sans-serif",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 14,
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
          {filtered.length} / {terms.length} términos
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 24,
      }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            background: !activeCategory ? "var(--cyan)" : "var(--bg3)",
            border: `1px solid ${!activeCategory ? "var(--cyan)" : "var(--border2)"}`,
            color: !activeCategory ? "var(--bg)" : "var(--muted)",
            padding: "4px 12px",
            fontSize: 11,
            fontFamily: "'Share Tech Mono', monospace",
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          TODOS
        </button>
        {categories.map((cat) => {
          const color = CAT_COLORS[cat] || "#546e7a";
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(isActive ? null : cat)}
              style={{
                background: isActive ? `${color}22` : "var(--bg3)",
                border: `1px solid ${isActive ? color : "var(--border2)"}`,
                color: isActive ? color : "var(--muted)",
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "'Share Tech Mono', monospace",
                cursor: "pointer",
                letterSpacing: 1,
                transition: "all 0.15s",
              }}
            >
              {cat.split(" — ")[0].split(" & ")[0].toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: 14 }}>
          No se encontraron términos para "{search}"
        </div>
      )}

      {categories
        .filter((cat) => grouped[cat]?.length > 0)
        .map((cat) => {
          const color = CAT_COLORS[cat] || "#546e7a";
          const catTerms = grouped[cat] || [];
          return (
            <div key={cat} style={{ marginBottom: 28 }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `1px solid ${color}44`,
              }}>
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 10,
                  letterSpacing: 3,
                  color,
                  textTransform: "uppercase",
                }}>
                  {cat}
                </span>
                <span style={{
                  background: `${color}22`,
                  border: `1px solid ${color}44`,
                  color,
                  fontSize: 9,
                  padding: "1px 7px",
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {catTerms.length}
                </span>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 10,
              }}>
                {catTerms.map((t) => {
                  const isExp = expanded === `${cat}-${t.term}`;
                  return (
                    <div
                      key={t.term}
                      onClick={() => setExpanded(isExp ? null : `${cat}-${t.term}`)}
                      style={{
                        background: "var(--bg3)",
                        border: `1px solid ${isExp ? t.color : "var(--border2)"}`,
                        borderLeft: `3px solid ${t.color}`,
                        padding: "12px 14px",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: 4,
                      }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                          <span style={{
                            fontFamily: "'Orbitron', monospace",
                            fontSize: 13,
                            color: t.color,
                            fontWeight: 700,
                          }}>
                            {t.abbr || t.term}
                          </span>
                          {t.abbr && (
                            <span style={{
                              fontSize: 11,
                              color: "var(--muted)",
                              fontFamily: "'Rajdhani', sans-serif",
                            }}>
                              {t.term}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                          {t.indicatorLabel && (
                            <span style={{
                              background: `${t.color}22`,
                              border: `1px solid ${t.color}55`,
                              color: t.color,
                              fontSize: 9,
                              padding: "1px 6px",
                              fontFamily: "'Share Tech Mono', monospace",
                              letterSpacing: 1,
                            }}>
                              📊 EN TV
                            </span>
                          )}
                          <span style={{
                            color: "var(--muted)",
                            fontSize: 12,
                            transform: isExp ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                            display: "inline-block",
                          }}>
                            ▼
                          </span>
                        </div>
                      </div>

                      <p style={{
                        fontSize: 12.5,
                        color: "#7a8fa0",
                        lineHeight: 1.55,
                        margin: 0,
                      }}>
                        {t.definition}
                      </p>

                      {isExp && t.details && (
                        <div style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: `1px solid ${t.color}22`,
                          fontSize: 12.5,
                          color: "#b0c4d8",
                          lineHeight: 1.7,
                          whiteSpace: "pre-line",
                        }}>
                          {t.details}
                        </div>
                      )}

                      {isExp && t.seeModule && (
                        <div style={{
                          marginTop: 8,
                          fontSize: 11,
                          color: "var(--cyan)",
                          fontFamily: "'Share Tech Mono', monospace",
                        }}>
                          → Ver módulo: {t.seeModule}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
