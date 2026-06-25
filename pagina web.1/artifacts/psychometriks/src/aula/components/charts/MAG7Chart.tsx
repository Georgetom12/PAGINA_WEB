import React, { useState } from "react";

const Mono = "'Share Tech Mono', monospace";
const Sans = "'Rajdhani', sans-serif";
const Orb  = "'Orbitron', monospace";
const BG   = "#0a0f18";

const W = 700, H = 330;

const companies = [
  { name:"NVIDIA",  ticker:"NVDA", pct:7.2,  mkt:"3.3T", sector:"Semiconductores / IA",    color:"#76b900", ytd:"+185%", btc:"★★★★★", emoji:"🟢" },
  { name:"APPLE",   ticker:"AAPL", pct:6.8,  mkt:"3.1T", sector:"Consumer Electronics",     color:"#aaa",    ytd:"+48%",  btc:"★★★☆☆", emoji:"⚪" },
  { name:"MSFT",    ticker:"MSFT", pct:6.4,  mkt:"3.0T", sector:"Cloud / IA / Software",    color:"#00a4ef", ytd:"+58%",  btc:"★★★★☆", emoji:"🔵" },
  { name:"AMAZON",  ticker:"AMZN", pct:5.2,  mkt:"2.2T", sector:"E-Commerce / Cloud AWS",   color:"#ff9900", ytd:"+80%",  btc:"★★★☆☆", emoji:"🟠" },
  { name:"ALPHABET",ticker:"GOOGL",pct:4.6,  mkt:"2.1T", sector:"Búsqueda / Cloud / IA",    color:"#4285f4", ytd:"+58%",  btc:"★★★★☆", emoji:"🔵" },
  { name:"META",    ticker:"META", pct:2.8,  mkt:"1.4T", sector:"Social / VR / IA",          color:"#0668e1", ytd:"+194%", btc:"★★★★☆", emoji:"🔵" },
  { name:"TESLA",   ticker:"TSLA", pct:1.6,  mkt:"0.8T", sector:"EVs / IA / Energía",       color:"#e82127", ytd:"-24%",  btc:"★★★★★", emoji:"🔴" },
];

type View = "market-cap" | "sp500-weight" | "btc-corr";

const VIEWS: [View, string][] = [
  ["market-cap",  "📊 Market Cap"],
  ["sp500-weight","📈 Peso en S&P 500"],
  ["btc-corr",    "₿ Correlación BTC"],
];

function MarketCapView() {
  const maxMkt = 3.3;
  const barMaxW = 480;
  const startX = 100, startY = 65, rowH = 32;

  return <g>
    {<text x={W/2} y={22} fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      LAS 7 MAGNÍFICAS — MARKET CAP 2024
    </text>}
    {<text x={W/2} y={38} fill="#546e7a" fontSize={8} fontFamily={Sans} textAnchor="middle">
      Representan ~35% del S&P 500 y ~45% del NASDAQ 100
    </text>}

    {/* S&P weight total annotation */}
    <rect x={560} y={48} width={130} height={55} fill="#ffd70011" stroke="#ffd70044" strokeWidth={1} rx={2}/>
    <text x={625} y={65} fill="#ffd700" fontSize={9} fontFamily={Mono} textAnchor="middle">TOTAL S&P 500</text>
    <text x={625} y={80} fill="#ffd700" fontSize={20} fontFamily={Orb} textAnchor="middle">35%</text>
    <text x={625} y={95} fill="#546e7a" fontSize={7} fontFamily={Sans} textAnchor="middle">de solo 7 empresas</text>

    {companies.map((c, i) => {
      const y = startY + i * rowH;
      const barW = (parseFloat(c.mkt) / maxMkt) * barMaxW;
      const positive = !c.ytd.startsWith("-");
      return <g key={c.ticker}>
        <text x={startX-8} y={y+14} fill={c.color} fontSize={9} fontFamily={Mono} textAnchor="end">{c.ticker}</text>
        <rect x={startX} y={y+2} width={barW} height={22} fill={c.color+"33"} stroke={c.color} strokeWidth={1} rx={2}/>
        <text x={startX+barW+6} y={y+14} fill={c.color} fontSize={8} fontFamily={Mono}>${c.mkt}</text>
        <text x={startX+barW+45} y={y+14} fill={positive?"#00e676":"#ff1744"} fontSize={8} fontFamily={Mono}>{c.ytd}</text>
        <text x={startX+barW+90} y={y+14} fill="#546e7a" fontSize={7} fontFamily={Sans}>{c.sector}</text>
      </g>;
    })}
    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      Si las MAG7 suben, el SPX sube aunque las otras 493 empresas caigan. NVDA earnings = evento de mayor impacto trimestral para BTC.
    </text>
  </g>;
}

function WeightView() {
  const total = companies.reduce((s,c)=>s+c.pct,0);
  const cx = 230, cy = 170, r = 110;
  let angle = -Math.PI/2;

  const slices = companies.map(c => {
    const startAngle = angle;
    const sweep = (c.pct/100)*2*Math.PI*2.5; // scale for visibility
    const endAngle = startAngle + (c.pct/34.6)*2*Math.PI;
    angle = endAngle;
    return { ...c, startAngle, endAngle };
  });

  return <g>
    <text x={W/2} y={22} fill="#00e5ff" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      PESO EN S&P 500 — {"~34.6% TOTAL"}
    </text>
    <text x={W/2} y={38} fill="#546e7a" fontSize={8} fontFamily={Sans} textAnchor="middle">
      Un movimiento del ±1% en MAG7 impacta el SPX en ±0.35%
    </text>

    {/* Pie chart */}
    {slices.map(c => {
      const x1 = cx + r*Math.cos(c.startAngle);
      const y1 = cy + r*Math.sin(c.startAngle);
      const x2 = cx + r*Math.cos(c.endAngle);
      const y2 = cy + r*Math.sin(c.endAngle);
      const large = (c.endAngle - c.startAngle) > Math.PI ? 1 : 0;
      const midAngle = (c.startAngle+c.endAngle)/2;
      const lx = cx + (r+30)*Math.cos(midAngle);
      const ly = cy + (r+30)*Math.sin(midAngle);
      return <g key={c.ticker}>
        <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
          fill={c.color+"44"} stroke={c.color} strokeWidth={1.5}/>
        <text x={lx} y={ly} fill={c.color} fontSize={8} fontFamily={Mono} textAnchor="middle">{c.pct}%</text>
      </g>;
    })}
    <text x={cx} y={cy-8}  fill="#ffd700" fontSize={11} fontFamily={Mono} textAnchor="middle">34.6%</text>
    <text x={cx} y={cy+8}  fill="#546e7a" fontSize={8}  fontFamily={Sans}  textAnchor="middle">del S&P 500</text>

    {/* Legend */}
    {companies.map((c,i) => (
      <g key={c.ticker}>
        <rect x={400} y={65+i*32} width={10} height={10} fill={c.color}/>
        <text x={415} y={74+i*32} fill={c.color} fontSize={9} fontFamily={Mono}>{c.ticker} — {c.pct}%</text>
        <text x={415} y={85+i*32} fill="#546e7a" fontSize={7} fontFamily={Sans}>{c.sector}</text>
      </g>
    ))}

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      El S&P 500 tiene 500 empresas pero 7 representan el 35%. Si vendes el ETF del SPX, en realidad estás vendiendo principalmente MAG7.
    </text>
  </g>;
}

function BTCCorrView() {
  const rows = [
    {t:"NVDA reporta ganancias",     impacto:"±10% en 1 día",  btc:"+/-5-8%",  relacion:"Alta — apetito por riesgo tech"},
    {t:"AAPL supera estimaciones",   impacto:"±5% en 1 día",   btc:"+/-2-3%",  relacion:"Media — consumer confidence"},
    {t:"MSFT guía bajista",          impacto:"-8% en 1 día",   btc:"-4-6%",    relacion:"Alta — cloud + IA gasto"},
    {t:"META earnings blow-out",     impacto:"+15% en 1 día",  btc:"+3-5%",    relacion:"Alta — risk-on general"},
    {t:"TSLA liquidación masiva",    impacto:"-20% en mes",    btc:"-10-15%",  relacion:"Muy alta — Elon + BTC holder"},
    {t:"MAG7 todas caen 5%+",        impacto:"NQ -3%",         btc:"-8-15%",   relacion:"Máxima — risk-off total"},
    {t:"NVDA ATH post-earnings",     impacto:"NQ +2%",         btc:"+4-8%",    relacion:"Alta — nueva narrativa IA"},
  ];

  return <g>
    <text x={W/2} y={22} fill="#e040fb" fontSize={11} fontFamily={Mono} textAnchor="middle" letterSpacing={1}>
      MAG7 → IMPACTO EN BTC — CORRELACIONES CLAVE
    </text>
    <text x={W/2} y={38} fill="#546e7a" fontSize={8} fontFamily={Sans} textAnchor="middle">
      Los mismos fondos institucionales que tienen MAG7 tienen BTC — su behavior se contagia
    </text>

    {/* Headers */}
    {["EVENTO MAG7","IMPACTO DIRECTO","EFECTO BTC","RELACIÓN"].map((h,i) => (
      <text key={h} x={[10,200,310,420][i]} y={60} fill="#ffd700" fontSize={8} fontFamily={Mono}>{h}</text>
    ))}
    <line x1={8} y1={64} x2={692} y2={64} stroke="#ffd70044" strokeWidth={0.5}/>

    {rows.map((r,i) => {
      const y = 78 + i*32;
      const color = r.btc.startsWith("+") ? "#00e676" : r.btc.startsWith("-") ? "#ff1744" : "#ffd700";
      return <g key={i}>
        <text x={10}  y={y}    fill="#aaa"    fontSize={8} fontFamily={Mono}>{r.t}</text>
        <text x={200} y={y}    fill="#ffd700" fontSize={8} fontFamily={Mono}>{r.impacto}</text>
        <text x={310} y={y}    fill={color}   fontSize={9} fontFamily={Mono} fontWeight="bold">{r.btc}</text>
        <text x={420} y={y}    fill="#7a8fa0" fontSize={7} fontFamily={Sans}>{r.relacion}</text>
        <line x1={8} y1={y+5} x2={692} y2={y+5} stroke="#1a253522" strokeWidth={0.5}/>
      </g>;
    })}

    {/* Correlation bars */}
    {companies.map((c,i) => {
      const stars = c.btc.split("★").length-1;
      return <g key={c.ticker}>
        <text x={10+i*94} y={H-28} fill={c.color} fontSize={8} fontFamily={Mono} textAnchor="middle">{c.ticker}</text>
        {[1,2,3,4,5].map(s=>(
          <text key={s} x={10+i*94+(s-3)*10} y={H-15} fill={s<=stars?c.color:"#333"} fontSize={10} fontFamily={Mono}>★</text>
        ))}
      </g>;
    })}

    <text x={10} y={H-4} fill="#546e7a" fontSize={8} fontFamily={Sans}>
      Monitor diario: si NVDA+META+MSFT hacen nuevos máximos antes de la apertura → sesión NY alcista para BTC. Si todas caen juntas → reducir exposición crypto.
    </text>
  </g>;
}

export function MAG7Chart() {
  const [view, setView] = useState<View>("market-cap");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {VIEWS.map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            background: view === v ? "#ffd70022" : "var(--bg3)",
            border: `1px solid ${view === v ? "#ffd700" : "var(--border2)"}`,
            color: view === v ? "#ffd700" : "var(--muted)",
            padding: "6px 14px", fontSize: 10,
            fontFamily: Mono, cursor: "pointer", letterSpacing: 0.8,
          }}>{label}</button>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: BG, borderRadius: 4, display: "block", minWidth: 420 }}>
          {[80,160,240].map(y=><line key={y} x1={0} y1={y} x2={W} y2={y} stroke="#1a253533" strokeWidth={0.5}/>)}
          {view === "market-cap"   && <MarketCapView />}
          {view === "sp500-weight" && <WeightView />}
          {view === "btc-corr"     && <BTCCorrView />}
        </svg>
      </div>
    </div>
  );
}
