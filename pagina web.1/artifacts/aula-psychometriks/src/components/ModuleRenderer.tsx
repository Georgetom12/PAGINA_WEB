import React, { lazy, Suspense } from "react";
import { CandleChart } from "./charts/CandleChart";
import { FibChart } from "./charts/FibChart";
import { StructureChart } from "./charts/StructureChart";
import { HarmonicChart, HarmonicType } from "./charts/HarmonicChart";
import { SessionChart } from "./charts/SessionChart";
import { GlossarySection } from "./GlossarySection";
import { CandlePatternsGrid } from "./charts/CandlePatternsGrid";
import { CRTChart } from "./charts/CRTChart";
import { AMDChart } from "./charts/AMDChart";
import { SweepDestroyChart } from "./charts/SweepDestroyChart";
import { FibLevelsChart } from "./charts/FibLevelsChart";
import { LiquidityAbsorptionChart } from "./charts/LiquidityAbsorptionChart";
import { WyckoffChart } from "./charts/WyckoffChart";
import { ElliottWaveChart } from "./charts/ElliottWaveChart";
import { ChartPatternsChart } from "./charts/ChartPatternsChart";
import { CandleAnatomyChart } from "./charts/CandleAnatomyChart";
import { OrderBlockFVGChart } from "./charts/OrderBlockFVGChart";
import { BOSChart } from "./charts/BOSChart";
import { MAG7Chart } from "./charts/MAG7Chart";
import { LiquidityMapChart } from "./charts/LiquidityMapChart";
import {
  EMAChart, RSIChart, BitcoinCyclesChart, PsychologyChart,
  DXYCorrelationChart, VIXChart, DominanceChart, OpenInterestChart,
  RiskRewardChart, MarketAnatomyChart, BondsChart, GoldCyclesChart,
  GannChart, IPDAChart, CVDChart,
} from "./charts/IndicatorCharts";

interface InfoBoxProps {
  variant: "key" | "warn" | "tip" | "danger" | "pro";
  label: string;
  text: string;
}

const IBOX_COLORS: Record<string, string> = {
  key:    "#00e5ff",
  warn:   "#ff6d00",
  tip:    "#00e676",
  danger: "#ff1744",
  pro:    "#ffd700",
};

const IBOX_ICON: Record<string, string> = {
  key: "◆",
  warn: "⚠",
  tip: "💡",
  danger: "⛔",
  pro: "★",
};

function InfoBox({ variant, label, text }: InfoBoxProps) {
  const color = IBOX_COLORS[variant] || "#00e5ff";
  return (
    <div style={{
      background: `${color}0d`,
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 3,
      padding: "14px 18px",
      marginBottom: 20,
    }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 10,
        letterSpacing: 2,
        color,
        marginBottom: 8,
        textTransform: "uppercase",
      }}>
        {IBOX_ICON[variant]} {label}
      </div>
      <p style={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "#d0e8f5", fontSize: 14, margin: 0 }}>{text}</p>
    </div>
  );
}

function FormulaBox({ text }: { text: string }) {
  return (
    <div style={{
      background: "var(--bg3)",
      border: "1px solid #00e5ff33",
      borderLeft: "3px solid #00e5ff",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 14,
      color: "#00e5ff",
      padding: "14px 18px",
      marginBottom: 20,
      whiteSpace: "pre-line",
      lineHeight: 1.9,
    }}>
      {text}
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 20 }}>
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h, i) => <th key={i}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cards({ cards }: { cards: { color: string; title: string; icon: string; text: string }[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 16,
      marginBottom: 24,
    }}>
      {cards.map((card, i) => (
        <div key={i} style={{
          background: "var(--card)",
          border: `1px solid ${card.color}33`,
          borderLeft: `3px solid ${card.color}`,
          padding: "16px 18px",
          borderRadius: 4,
        }}>
          <div style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 13,
            color: card.color,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>{card.icon}</span>
            {card.title}
          </div>
          <p style={{ fontSize: 13.5, color: "#b0c4d8", lineHeight: 1.7, margin: 0 }}>{card.text}</p>
        </div>
      ))}
    </div>
  );
}

function MacroDashboard() {
  const groups = [
    {
      title: "MIEDO Y VOLATILIDAD — AFECTAN TODO",
      color: "#ff1744",
      items: [
        { name: "VIX", desc: "Índice de miedo del mercado (S&P 500)", impact: "Alto", color: "#ff1744" },
        { name: "VVIX", desc: "Volatilidad del VIX (miedo del miedo)", impact: "Alto", color: "#ff1744" },
        { name: "BVIV / DVOL", desc: "Volatilidad implícita de BTC (Deribit)", impact: "Alto", color: "#ff1744" },
        { name: "Fear & Greed", desc: "Índice miedo/codicia crypto", impact: "Medio", color: "#ff6d00" },
      ],
    },
    {
      title: "DÓLAR Y LIQUIDEZ — CORRELACIÓN INVERSA CON BTC/ORO",
      color: "#ffd700",
      items: [
        { name: "DXY", desc: "Índice del dólar vs basket de monedas", impact: "Alto", color: "#ffd700" },
        { name: "EUR/USD", desc: "Par más pesado del DXY (57%)", impact: "Alto", color: "#ffd700" },
        { name: "M2 Money Supply", desc: "Oferta monetaria global USA", impact: "Alto", color: "#ffd700" },
        { name: "USD/JPY", desc: "Yen carry trade — riesgo global", impact: "Alto", color: "#ffd700" },
        { name: "USDT Dominance", desc: "Flujo a stablecoins en cripto", impact: "Alto", color: "#ffd700" },
        { name: "BTC Dominance", desc: "% BTC del total cripto market cap", impact: "Alto", color: "#ffd700" },
      ],
    },
    {
      title: "ÍNDICES DE ACCIONES USA — CORRELACIÓN DIRECTA CON BTC",
      color: "#00e676",
      items: [
        { name: "SPX / SP500", desc: "500 empresas más grandes USA", impact: "Alto", color: "#00e676" },
        { name: "NDX / NQ100", desc: "Nasdaq 100 — tecnológicas", impact: "Alto", color: "#00e676" },
        { name: "US30 / DJIA", desc: "Dow Jones Industrial Average", impact: "Medio", color: "#00e676" },
        { name: "RUT / Russell 2000", desc: "Small caps USA — riesgo apetito", impact: "Medio", color: "#00e676" },
        { name: "SPY / QQQ", desc: "ETFs más seguidos (flujos reales)", impact: "Medio", color: "#00e676" },
      ],
    },
    {
      title: "BONOS Y TASAS — CLAVE PARA VALUACIONES",
      color: "#00e5ff",
      items: [
        { name: "US10Y", desc: "Bono del tesoro USA 10 años", impact: "Alto", color: "#00e5ff" },
        { name: "US02Y", desc: "Bono 2 años — expectativa Fed", impact: "Alto", color: "#00e5ff" },
        { name: "Yield Curve", desc: "Spread 10Y-2Y — recesión signal", impact: "Alto", color: "#00e5ff" },
        { name: "Fed Funds Rate", desc: "Tasa de interés de referencia Fed", impact: "Alto", color: "#00e5ff" },
        { name: "SOFR", desc: "Tasa overnight repos (liquidez real)", impact: "Medio", color: "#00e5ff" },
      ],
    },
    {
      title: "ORO Y COMMODITIES — REFUGIO Y CORRELACIÓN BTC",
      color: "#ffd700",
      items: [
        { name: "XAU/USD", desc: "Oro spot — refugio principal", impact: "Alto", color: "#ffd700" },
        { name: "GC1! (Futuros)", desc: "Futuros oro CME", impact: "Alto", color: "#ffd700" },
        { name: "XAG/USD", desc: "Plata — beta del oro", impact: "Medio", color: "#ffd700" },
      ],
    },
    {
      title: "INDICADORES MACROECONÓMICOS — EVENTOS DE ALTO IMPACTO",
      color: "#e040fb",
      items: [
        { name: "CPI", desc: "Inflación al consumidor USA", impact: "Alto", color: "#e040fb" },
        { name: "PCE", desc: "Inflación favorita de la Fed", impact: "Alto", color: "#e040fb" },
        { name: "NFP", desc: "Nóminas no agrícolas (empleo USA)", impact: "Alto", color: "#e040fb" },
        { name: "FOMC", desc: "Decisión de tasas Fed (8x/año)", impact: "Alto", color: "#e040fb" },
        { name: "GDP", desc: "PIB USA trimestral", impact: "Alto", color: "#e040fb" },
        { name: "PMI", desc: "Índice actividad manufacturera", impact: "Medio", color: "#e040fb" },
        { name: "PPI", desc: "Inflación al productor", impact: "Medio", color: "#e040fb" },
        { name: "Jobless Claims", desc: "Solicitudes desempleo semanales", impact: "Medio", color: "#e040fb" },
      ],
    },
    {
      title: "ÍNDICES GLOBALES — RIESGO APETITO MUNDIAL",
      color: "#7c4dff",
      items: [
        { name: "DAX", desc: "Alemania — Europa líder", impact: "Medio", color: "#7c4dff" },
        { name: "FTSE 100", desc: "Reino Unido", impact: "Medio", color: "#7c4dff" },
        { name: "Nikkei 225", desc: "Japón — ligado al yen carry", impact: "Medio", color: "#7c4dff" },
        { name: "HSI", desc: "Hang Seng Hong Kong — China proxy", impact: "Medio", color: "#7c4dff" },
        { name: "CSI 300", desc: "China continental", impact: "Medio", color: "#7c4dff" },
        { name: "MSCI EM", desc: "Mercados emergentes global", impact: "Bajo", color: "#7c4dff" },
      ],
    },
    {
      title: "ON-CHAIN Y CRIPTO ESPECÍFICO",
      color: "#ff6d00",
      items: [
        { name: "Funding Rate", desc: "Costo de mantener posiciones perpetuas", impact: "Alto", color: "#ff6d00" },
        { name: "OI (Open Interest)", desc: "Contratos abiertos en futuros", impact: "Alto", color: "#ff6d00" },
        { name: "NUPL", desc: "Net unrealized profit/loss BTC", impact: "Medio", color: "#ff6d00" },
        { name: "MVRV Z-Score", desc: "Market value vs realized value", impact: "Medio", color: "#ff6d00" },
        { name: "Stablecoin Supply", desc: "Munición en el mercado cripto", impact: "Medio", color: "#ff6d00" },
        { name: "ETF Flows", desc: "Flujos BTC ETF spot (BlackRock etc.)", impact: "Alto", color: "#ff6d00" },
      ],
    },
  ];

  const impactColor = (impact: string) => impact === "Alto" ? "#ff4444" : impact === "Medio" ? "#ff8800" : "#546e7a";

  return (
    <div style={{ marginBottom: 24 }}>
      {groups.map((group, gi) => (
        <div key={gi} style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            letterSpacing: 2,
            color: group.color,
            borderBottom: `1px solid ${group.color}44`,
            paddingBottom: 8,
            marginBottom: 12,
            textTransform: "uppercase",
          }}>
            {group.title}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 10,
          }}>
            {group.items.map((item, ii) => (
              <div key={ii} style={{
                background: "var(--bg3)",
                border: `1px solid ${item.color}33`,
                padding: "10px 14px",
                borderRadius: 3,
              }}>
                <div style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: item.color,
                  marginBottom: 3,
                }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: "#7a8fa0", marginBottom: 5 }}>{item.desc}</div>
                <span style={{
                  fontSize: 10,
                  background: `${impactColor(item.impact)}22`,
                  border: `1px solid ${impactColor(item.impact)}55`,
                  color: impactColor(item.impact),
                  padding: "1px 7px",
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  Impacto {item.impact.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface Section {
  title?: string;
  body?: string;
  type?: string;
  variant?: string;
  label?: string;
  text?: string;
  headers?: string[];
  rows?: string[][];
  cards?: any[];
  pattern?: HarmonicType;
  direction?: "bull" | "bear";
  chartType?: string;
  candles?: any[];
  annotations?: any[];
  lines?: any[];
  fibDirection?: "bullish" | "bearish";
  structureType?: string;
  terms?: any[];
  schema?: "accumulation" | "distribution";
}

export function ModuleRenderer({ sections }: { sections: Section[] }) {
  return (
    <div className="fade-in">
      {sections.map((section, i) => {

        if (section.type === "infobox" || (!section.type && section.label)) {
          return (
            <InfoBox
              key={i}
              variant={(section.variant as any) || "key"}
              label={section.label || ""}
              text={section.text || ""}
            />
          );
        }

        if (section.type === "formula") {
          return (
            <div key={i} style={{ marginBottom: 24 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <FormulaBox text={section.text || ""} />
            </div>
          );
        }

        if (section.type === "glossary") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <GlossarySection terms={section.terms || []} />
            </div>
          );
        }

        if (section.type === "candle-patterns") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <CandlePatternsGrid />
            </div>
          );
        }

        if (section.type === "chart-patterns") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <ChartPatternsChart />
            </div>
          );
        }

        if (section.type === "crt-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <CRTChart />
            </div>
          );
        }

        if (section.type === "amd-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <AMDChart />
            </div>
          );
        }

        if (section.type === "sweep-destroy") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <SweepDestroyChart />
            </div>
          );
        }

        if (section.type === "candle-anatomy") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <CandleAnatomyChart />
            </div>
          );
        }

        if (section.type === "ob-fvg-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <OrderBlockFVGChart />
            </div>
          );
        }

        if (section.type === "bos-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <BOSChart />
            </div>
          );
        }

        if (section.type === "mag7-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <MAG7Chart />
            </div>
          );
        }

        if (section.type === "liquidity-map") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <LiquidityMapChart />
            </div>
          );
        }

        if (section.type === "fib-levels") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <FibLevelsChart />
            </div>
          );
        }

        if (section.type === "liquidity-absorption") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <LiquidityAbsorptionChart />
            </div>
          );
        }

        if (section.type === "wyckoff-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <WyckoffChart schema={section.schema ?? "accumulation"} />
            </div>
          );
        }

        if (section.type === "elliott-wave-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              <ElliottWaveChart />
            </div>
          );
        }

        const chartMap: Record<string, React.ReactNode> = {
          "ema-chart":            <EMAChart />,
          "rsi-chart":            <RSIChart />,
          "bitcoin-cycles-chart": <BitcoinCyclesChart />,
          "psychology-chart":     <PsychologyChart />,
          "dxy-correlation-chart":<DXYCorrelationChart />,
          "vix-chart":            <VIXChart />,
          "dominance-chart":      <DominanceChart />,
          "open-interest-chart":  <OpenInterestChart />,
          "cvd-chart":            <CVDChart />,
          "risk-reward-chart":    <RiskRewardChart />,
          "market-anatomy-chart": <MarketAnatomyChart />,
          "bonds-chart":          <BondsChart />,
          "gold-cycles-chart":    <GoldCyclesChart />,
          "gann-chart":           <GannChart />,
          "ipda-chart":           <IPDAChart />,
        };

        if (section.type && chartMap[section.type]) {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 14, lineHeight: 1.7 }}>{section.body}</p>}
              {chartMap[section.type!]}
            </div>
          );
        }

        if (section.type === "index-cards") {
          const cards: any[] = section.cards || [];
          return (
            <div key={i} style={{ marginBottom: 32 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              {section.body && <p style={{ color: "#7a8fa0", marginBottom: 18, lineHeight: 1.7 }}>{section.body}</p>}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}>
                {cards.map((card: any, ci: number) => (
                  <div key={ci} style={{
                    background: "var(--bg2)",
                    border: `1px solid ${card.color}44`,
                    borderTop: `3px solid ${card.color}`,
                    borderRadius: 4,
                    overflow: "hidden",
                  }}>
                    {/* Card header */}
                    <div style={{
                      background: `${card.color}15`,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      borderBottom: `1px solid ${card.color}30`,
                    }}>
                      <span style={{ fontSize: 22 }}>{card.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: card.color, letterSpacing: 1 }}>
                          {card.name}
                        </div>
                        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#546e7a", marginTop: 2 }}>
                          {card.ticker} &nbsp;·&nbsp; {card.tipo}
                        </div>
                      </div>
                      {card.nivel && (
                        <div style={{
                          background: `${card.color}20`,
                          border: `1px solid ${card.color}44`,
                          padding: "3px 8px",
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 9,
                          color: card.color,
                          whiteSpace: "nowrap",
                        }}>
                          {card.nivel}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "14px 16px" }}>
                      {[
                        { label: "📌 Qué es",              value: card.que_es },
                        { label: "🏛️ Origen",              value: card.origen },
                        { label: "🎯 Para qué sirve",      value: card.para_que },
                        { label: "⚡ Cómo afecta el mdo.", value: card.como_afecta },
                        { label: "₿ Correlación con BTC",  value: card.btc_corr },
                      ].map((row, ri) => row.value ? (
                        <div key={ri} style={{ marginBottom: ri === 4 ? 0 : 10 }}>
                          <div style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: 9,
                            color: card.color,
                            letterSpacing: 0.8,
                            marginBottom: 3,
                            textTransform: "uppercase",
                          }}>
                            {row.label}
                          </div>
                          <div style={{
                            fontSize: 11,
                            color: "#9daebf",
                            lineHeight: 1.6,
                            paddingLeft: 0,
                          }}>
                            {row.value}
                          </div>
                          {ri < 4 && row.value && (
                            <div style={{ height: 1, background: `${card.color}18`, marginTop: 10 }} />
                          )}
                        </div>
                      ) : null)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        if (section.type === "session-chart") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <SessionChart />
            </div>
          );
        }

        if (section.type === "macro-dashboard") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <MacroDashboard />
            </div>
          );
        }

        if (section.type === "harmonic") {
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <HarmonicChart
                pattern={section.pattern || "gartley"}
                direction={section.direction || "bull"}
              />
            </div>
          );
        }

        if (section.type === "fib-chart") {
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <FibChart direction={section.fibDirection || "bullish"} title={section.title} />
            </div>
          );
        }

        if (section.type === "structure-chart") {
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <StructureChart type={(section.structureType as any) || "uptrend"} title={section.title} />
            </div>
          );
        }

        if (section.type === "candle-chart") {
          return (
            <div key={i} style={{ marginBottom: 8 }}>
              {section.title && <SectionTitle>{section.title}</SectionTitle>}
              <CandleChart
                candles={section.candles || []}
                annotations={section.annotations}
                lines={section.lines}
                title={section.title}
              />
            </div>
          );
        }

        return (
          <div key={i} style={{ marginBottom: 28 }}>
            {section.title && (
              <SectionTitle>{section.title}</SectionTitle>
            )}

            {(section.type === "text" || !section.type) && section.body && (
              <p style={{ fontSize: 15, color: "#b8cfe0", lineHeight: 1.85, whiteSpace: "pre-line" }}>{section.body}</p>
            )}

            {section.type === "table" && section.headers && section.rows && (
              <DataTable headers={section.headers} rows={section.rows} />
            )}

            {section.type === "cards" && section.cards && (
              <Cards cards={section.cards} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: "'Orbitron', monospace",
      fontSize: 13,
      color: "var(--cyan)",
      marginBottom: 16,
      letterSpacing: 1,
      textTransform: "uppercase",
    }}>
      {children}
    </h3>
  );
}
