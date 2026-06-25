import React from "react";
import type { Section, CardItem, InfoBoxVariant } from "../types";
import "../aula.css";

class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; title?: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; title?: string }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: "var(--bg3)", border: "1px solid rgba(255,23,68,.3)", borderRadius: 4, padding: "18px 20px", marginBottom: 20, color: "#546e7a", fontFamily: "'Share Tech Mono', monospace", fontSize: 12 }}>
          ⚠ Visualización no disponible en este navegador
        </div>
      );
    }
    return this.props.children;
  }
}

import { CandleChart } from "./charts/CandleChart";
import { FibChart } from "./charts/FibChart";
import { StructureChart } from "./charts/StructureChart";
import { HarmonicChart } from "./charts/HarmonicChart";
import { SessionChart } from "./charts/SessionChart";
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

export type { Section, CardItem, InfoBoxVariant };

const IBOX_ICON: Record<InfoBoxVariant, string> = {
  key: "◆",
  warn: "⚠",
  tip: "💡",
  danger: "⛔",
  pro: "★",
};

function InfoBox({ variant, label, text }: { variant: InfoBoxVariant; label: string; text: string }) {
  return (
    <div className={`aula-info-box ${variant}`} style={{ marginBottom: 20 }}>
      <div className="info-label">
        {IBOX_ICON[variant]} {label}
      </div>
      <p style={{ whiteSpace: "pre-line", lineHeight: 1.8, color: "#d0e8f5", fontSize: 14, margin: 0 }}>{text}</p>
    </div>
  );
}

function FormulaBox({ text }: { text: string }) {
  return <div className="aula-formula-box">{text}</div>;
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", marginBottom: 20 }}>
      <table className="aula-data-table">
        <thead>
          <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cards({ cards }: { cards: CardItem[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
      {cards.map((card, i) => (
        <div key={i} style={{
          background: "#0d1520",
          border: `1px solid ${card.color}33`,
          borderLeft: `3px solid ${card.color}`,
          padding: "16px 18px",
          borderRadius: 4,
        }}>
          <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: card.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{card.icon}</span>
            {card.title}
          </div>
          <p style={{ fontSize: 13.5, color: "#b0c4d8", lineHeight: 1.7, margin: 0 }}>{card.text}</p>
        </div>
      ))}
    </div>
  );
}

function ChartWrapper({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      {title && (
        <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "#00e5ff", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

const CHART_MAP: Record<string, React.ComponentType<any>> = {
  "market-anatomy-chart":  MarketAnatomyChart,
  "ema-chart":             EMAChart,
  "rsi-chart":             RSIChart,
  "cvd-chart":             CVDChart,
  "open-interest-chart":   OpenInterestChart,
  "dominance-chart":       DominanceChart,
  "dxy-correlation-chart": DXYCorrelationChart,
  "vix-chart":             VIXChart,
  "bonds-chart":           BondsChart,
  "gold-cycles-chart":     GoldCyclesChart,
  "bitcoin-cycles-chart":  BitcoinCyclesChart,
  "psychology-chart":      PsychologyChart,
  "risk-reward-chart":     RiskRewardChart,
  "gann-chart":            GannChart,
  "ipda-chart":            IPDAChart,
  "elliott-wave-chart":    ElliottWaveChart,
  "amd-chart":             AMDChart,
  "crt-chart":             CRTChart,
  "sweep-destroy":         SweepDestroyChart,
  "liquidity-absorption":  LiquidityAbsorptionChart,
  "ob-fvg-chart":          OrderBlockFVGChart,
  "bos-chart":             BOSChart,
  "wyckoff-chart":         WyckoffChart,
  "fib-chart":             FibChart,
  "fib-levels-chart":      FibLevelsChart,
  "candle-chart":          CandleChart,
  "candle-patterns":       CandlePatternsGrid,
  "chart-patterns":        ChartPatternsChart,
  "session-chart":         SessionChart,
  "liquidity-map-chart":   LiquidityMapChart,
  "mag7-chart":            MAG7Chart,
};

export function ModuleRenderer({ sections }: { sections: Section[] }) {
  return (
    <div className="aula-fade-in">
      {sections.map((section, i) => {
        if (section.type === "infobox") {
          return (
            <InfoBox
              key={i}
              variant={section.variant}
              label={section.label}
              text={section.text}
            />
          );
        }

        if (section.type === "formula") {
          return (
            <div key={i}>
              {section.title && (
                <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "#00e5ff", marginBottom: 12, letterSpacing: 1 }}>
                  {section.title}
                </h3>
              )}
              <FormulaBox text={section.text} />
            </div>
          );
        }

        if (section.type === "table") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && (
                <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "#00e5ff", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>
                  {section.title}
                </h3>
              )}
              <DataTable headers={section.headers} rows={section.rows} />
            </div>
          );
        }

        if (section.type === "cards") {
          return (
            <div key={i} style={{ marginBottom: 28 }}>
              {section.title && (
                <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "#00e5ff", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>
                  {section.title}
                </h3>
              )}
              <Cards cards={section.cards} />
            </div>
          );
        }

        if (section.type === "candle-anatomy") {
          return (
            <ChartErrorBoundary key={i}>
              <ChartWrapper title={section.title}>
                <CandleAnatomyChart />
              </ChartWrapper>
            </ChartErrorBoundary>
          );
        }

        if (section.type === "structure-chart") {
          return (
            <ChartErrorBoundary key={i}>
              <ChartWrapper title={section.title}>
                <StructureChart type={(section as any).structureType ?? "uptrend"} />
              </ChartWrapper>
            </ChartErrorBoundary>
          );
        }

        if (section.type === "harmonic-chart") {
          return (
            <ChartErrorBoundary key={i}>
              <ChartWrapper title={section.title}>
                <HarmonicChart pattern={(section as any).harmonicType ?? "gartley"} />
              </ChartWrapper>
            </ChartErrorBoundary>
          );
        }

        const ChartComp = CHART_MAP[section.type];
        if (ChartComp) {
          return (
            <ChartErrorBoundary key={i}>
              <ChartWrapper title={section.title}>
                <ChartComp />
              </ChartWrapper>
            </ChartErrorBoundary>
          );
        }

        const s = section as any;
        return (
          <div key={i} style={{ marginBottom: 28 }}>
            {s.title && (
              <h3 style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, color: "#00e5ff", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>
                {s.title}
              </h3>
            )}
            {s.body && <p style={{ fontSize: 15, color: "#b8cfe0", lineHeight: 1.85, margin: 0 }}>{s.body}</p>}
          </div>
        );
      })}
    </div>
  );
}
