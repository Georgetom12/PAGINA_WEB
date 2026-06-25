import React, { useState } from "react";

type Scenario = "bullish" | "bearish";

export function LiquidityAbsorptionChart() {
  const [scenario, setScenario] = useState<Scenario>("bullish");
  const W = 680;
  const H = 340;

  // Bullish: SSL absorption (price approaches lows, absorbs sell orders, rockets up)
  // Bearish: BSL absorption (price approaches highs, absorbs buy orders, dumps)

  const isBull = scenario === "bullish";

  const priceColor = "#00e676";
  const absColor = "#ff6d00";
  const liqColor = isBull ? "#ff1744" : "#00e676";
  const liqLabel = isBull ? "SSL — Sell Side Liquidity" : "BSL — Buy Side Liquidity";
  const liqY = isBull ? 240 : 90;

  // Price path points
  const bullPricePts = [
    // Downtrend toward SSL
    [30, 130], [55, 148], [80, 170], [105, 190], [130, 215],
    // Approaching SSL — absorption phase (price slows, multiple bounces off SSL)
    [155, 235], [170, 248], [183, 252], [196, 242], [210, 255],
    [222, 248], [236, 258], [248, 244],
    // Explosive up: absorption complete, all sellers exhausted
    [265, 210], [282, 178], [298, 148], [318, 115], [338, 82], [355, 55], [372, 38],
  ];

  const bearPricePts = [
    // Uptrend toward BSL
    [30, 230], [55, 210], [80, 188], [105, 165], [130, 140],
    // Approaching BSL — absorption
    [155, 115], [170, 105], [183, 96], [196, 108], [210, 95],
    [222, 102], [236, 90], [248, 108],
    // Explosive down
    [265, 135], [282, 158], [298, 185], [318, 215], [338, 248], [355, 275], [372, 295],
  ];

  const pts = isBull ? bullPricePts : bearPricePts;

  const toPath = (points: number[][]) =>
    points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  // Candles around absorption zone
  const absCandlesX = [155, 175, 195, 215, 235];
  const absCandles = isBull
    ? [
        { o: 230, c: 245, h: 220, l: 250 },
        { o: 245, c: 250, h: 240, l: 258 },
        { o: 248, c: 238, h: 237, l: 253 },
        { o: 240, c: 254, h: 235, l: 260 },
        { o: 252, c: 240, h: 238, l: 258 },
      ]
    : [
        { o: 110, c: 98, h: 93, l: 118 },
        { o: 100, c: 93, h: 88, l: 106 },
        { o: 95, c: 105, h: 90, l: 110 },
        { o: 102, c: 92, h: 86, l: 107 },
        { o: 94, c: 106, h: 88, l: 112 },
      ];

  // Displacement candle
  const dispX = 260;
  const dispCandle = isBull
    ? { o: 250, c: 195, h: 185, l: 258 }
    : { o: 100, c: 155, h: 94, l: 160 };

  const candleCol = (o: number, c: number) => (isBull ? (c < o ? "#00e676" : "#ff1744") : (c > o ? "#ff1744" : "#00e676"));

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {(["bullish", "bearish"] as Scenario[]).map(s => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            style={{
              background: scenario === s ? (s === "bullish" ? "#00e67622" : "#ff174422") : "var(--bg3)",
              border: `1px solid ${scenario === s ? (s === "bullish" ? "#00e676" : "#ff1744") : "var(--border2)"}`,
              color: scenario === s ? (s === "bullish" ? "#00e676" : "#ff1744") : "var(--muted)",
              padding: "6px 18px", fontSize: 11,
              fontFamily: "'Share Tech Mono', monospace", cursor: "pointer", letterSpacing: 1,
            }}
          >
            {s === "bullish" ? "⬆ ABSORCIÓN ALCISTA (SSL)" : "⬇ ABSORCIÓN BAJISTA (BSL)"}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg width={W} height={H} style={{ background: "#0a0f18", borderRadius: 4, display: "block", minWidth: 380 }}>

          {/* Grid */}
          {[80, 140, 200, 260, 300].map(yy => (
            <line key={yy} x1={0} y1={yy} x2={W} y2={yy} stroke="#1a2535" strokeWidth={0.5} />
          ))}

          {/* Liquidity zone */}
          <rect x={10} y={liqY - 10} width={W - 20} height={20}
            fill={`${liqColor}15`} stroke={`${liqColor}55`} strokeWidth={0.8} />
          <text x={15} y={liqY + 4} fill={liqColor} fontSize={9} fontFamily="'Share Tech Mono', monospace">
            {liqLabel}
          </text>

          {/* Phase labels */}
          <text x={30} y={22} fill="#546e7a" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            {isBull ? "↓ APPROACH" : "↑ APPROACH"}
          </text>
          <text x={152} y={22} fill="#ff6d00" fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            ABSORCIÓN
          </text>
          <text x={262} y={22} fill={isBull ? "#00e676" : "#ff1744"} fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            DISPLACEMENT
          </text>
          <text x={370} y={22} fill={isBull ? "#00e676" : "#ff1744"} fontSize={9} fontFamily="'Share Tech Mono', monospace" letterSpacing={2}>
            CONTINUACIÓN
          </text>

          {/* Phase separators */}
          <line x1={148} y1={25} x2={148} y2={H - 10} stroke="#ffffff12" strokeWidth={1} />
          <line x1={258} y1={25} x2={258} y2={H - 10} stroke="#ffffff12" strokeWidth={1} />
          <line x1={365} y1={25} x2={365} y2={H - 10} stroke="#ffffff12" strokeWidth={1} />

          {/* Main price path */}
          <path d={toPath(pts.slice(0, 5))} fill="none" stroke="#546e7a" strokeWidth={2} />

          {/* Absorption candles (clustered near liq zone) */}
          {absCandlesX.map((cx, i) => {
            const cv = absCandles[i];
            const col = candleCol(cv.o, cv.c);
            const bTop = Math.min(cv.o, cv.c);
            const bH = Math.max(Math.abs(cv.o - cv.c), 2);
            return (
              <g key={i}>
                <line x1={cx + 8} y1={cv.h} x2={cx + 8} y2={cv.l} stroke={col} strokeWidth={1.5} />
                <rect x={cx} y={bTop} width={16} height={bH} fill={col} opacity={0.9} />
              </g>
            );
          })}

          {/* Absorption zone highlight */}
          <rect x={148} y={isBull ? 228 : 80} width={110} height={isBull ? 52 : 50}
            fill={`${absColor}08`} stroke={`${absColor}33`} strokeWidth={0.5} rx={2} />
          <text x={152} y={isBull ? 295 : 140} fill={absColor} fontSize={9} fontFamily="Rajdhani, sans-serif">
            {isBull ? "Sellers absorbidos — se quedan sin liquidez" : "Buyers absorbidos — se quedan sin liquidez"}
          </text>

          {/* Volume bars (absorption = high volume) */}
          {absCandlesX.map((cx, i) => {
            const volH = [18, 25, 30, 22, 28][i];
            return (
              <rect key={i} x={cx + 2} y={isBull ? H - 10 - volH : H - 10 - volH}
                width={14} height={volH}
                fill={absColor} opacity={0.4} />
            );
          })}
          <text x={152} y={H - 12} fill={absColor} fontSize={9} fontFamily="Rajdhani, sans-serif">
            Vol. alto
          </text>

          {/* Displacement candle */}
          {(() => {
            const cv = dispCandle;
            const col = isBull ? "#00e676" : "#ff1744";
            const bTop = Math.min(cv.o, cv.c);
            const bH = Math.max(Math.abs(cv.o - cv.c), 2);
            return (
              <g>
                <line x1={dispX + 12} y1={cv.h} x2={dispX + 12} y2={cv.l} stroke={col} strokeWidth={2} />
                <rect x={dispX} y={bTop} width={24} height={bH} fill={col} />
              </g>
            );
          })()}

          {/* OB and FVG on displacement */}
          <rect x={dispX - 4} y={isBull ? dispCandle.l - 2 : dispCandle.l}
            width={32} height={isBull ? 18 : 16}
            fill="none" stroke="#ffd70088" strokeWidth={1} strokeDasharray="3 2" />
          <text x={dispX} y={isBull ? dispCandle.l + 20 : dispCandle.l - 5}
            fill="#ffd700" fontSize={8} fontFamily="'Share Tech Mono', monospace">OB</text>

          {/* FVG */}
          <rect x={dispX + 26} y={isBull ? 175 : 105}
            width={25} height={isBull ? 30 : 30}
            fill={`${isBull ? "#00e676" : "#ff1744"}10`}
            stroke={`${isBull ? "#00e676" : "#ff1744"}44`} strokeWidth={0.8} />
          <text x={dispX + 28} y={isBull ? 170 : 102}
            fill={isBull ? "#00e676" : "#ff1744"} fontSize={8} fontFamily="'Share Tech Mono', monospace">FVG</text>

          {/* Continuation candles */}
          {[
            { x: 295, o: isBull ? 170 : 165, c: isBull ? 128 : 205, h: isBull ? 122 : 158, l: isBull ? 175 : 212 },
            { x: 325, o: isBull ? 125 : 200, c: isBull ? 82 : 240, h: isBull ? 78 : 195, l: isBull ? 130 : 245 },
            { x: 355, o: isBull ? 80 : 235, c: isBull ? 55 : 278, h: isBull ? 50 : 230, l: isBull ? 85 : 282 },
          ].map((cv, i) => {
            const col = isBull ? "#00e676" : "#ff1744";
            const bTop = Math.min(cv.o, cv.c);
            const bH = Math.max(Math.abs(cv.o - cv.c), 2);
            return (
              <g key={i}>
                <line x1={cv.x + 12} y1={cv.h} x2={cv.x + 12} y2={cv.l} stroke={col} strokeWidth={1.5} />
                <rect x={cv.x} y={bTop} width={24} height={bH} fill={col} />
              </g>
            );
          })}

          {/* BOS label */}
          <line x1={260} y1={isBull ? 150 : 168} x2={350} y2={isBull ? 150 : 168}
            stroke={`${isBull ? "#00e676" : "#ff1744"}44`} strokeWidth={0.8} strokeDasharray="3 2" />
          <text x={265} y={isBull ? 147 : 165}
            fill={isBull ? "#00e676" : "#ff1744"} fontSize={9} fontFamily="'Share Tech Mono', monospace">BOS {isBull ? "↑" : "↓"}</text>

          {/* Annotation: Absorption mechanism */}
          <text x={435} y={55} fill="#00e5ff" fontSize={10} fontFamily="'Share Tech Mono', monospace" letterSpacing={1}>
            ¿QUÉ ES LA ABSORCIÓN?
          </text>
          {[
            "Los institucionales 'absorben'",
            "las órdenes de mercado de los",
            "retail traders. Cuando hay",
            "muchos vendedores en la SSL,",
            "los institucionales compran",
            "TODAS esas órdenes.",
            "",
            "Resultado: los vendedores",
            "se quedan sin posición.",
            "El precio no tiene quién lo",
            "baje → sube explosivamente.",
          ].map((line, i) => (
            <text key={i} x={435} y={72 + i * 14} fill={i < 6 ? "#7a8fa0" : (isBull ? "#00e676" : "#ff1744")}
              fontSize={10} fontFamily="Rajdhani, sans-serif">
              {line}
            </text>
          ))}

          {/* Footprint visual (simplified) */}
          <rect x={435} y={230} width={220} height={80} fill="#00000020" stroke="#1a2535" strokeWidth={0.5} rx={2} />
          <text x={440} y={246} fill="#546e7a" fontSize={8} fontFamily="'Share Tech Mono', monospace">FOOTPRINT SIMPLIFICADO</text>
          {[
            { bid: "  2,450", ask: " 22,800", delta: "+20,350" },
            { bid: "  1,890", ask: " 28,100", delta: "+26,210" },
            { bid: "  3,100", ask: " 31,500", delta: "+28,400" },
            { bid: "  2,200", ask: " 19,800", delta: "+17,600" },
          ].map((row, i) => (
            <g key={i}>
              <text x={440} y={260 + i * 12} fill="#ff174480" fontSize={8} fontFamily="'Share Tech Mono', monospace">{row.bid}</text>
              <text x={490} y={260 + i * 12} fill="#00e67680" fontSize={8} fontFamily="'Share Tech Mono', monospace">{row.ask}</text>
              <text x={545} y={260 + i * 12} fill="#00e5ff" fontSize={8} fontFamily="'Share Tech Mono', monospace">{row.delta}</text>
            </g>
          ))}
          <text x={440} y={316} fill="#546e7a" fontSize={8} fontFamily="'Share Tech Mono', monospace">Delta positivo = absorción alcista</text>
        </svg>
      </div>

      {/* Explanation cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14 }}>
        {[
          { color: "#546e7a", title: "Approach", body: "El precio se acerca a la zona de liquidez. Tendencia previa definida. Múltiples velas acercándose al nivel." },
          { color: "#ff6d00", title: "Absorción", body: "Varias velas de tamaño similar, alta volatilidad intravela pero poco rango neto. Volumen alto. Delta neutral o contrario. Los institucionales absorben." },
          { color: "#ffd700", title: "Agotamiento", body: "Los vendedores (en SSL) o compradores (en BSL) se quedan sin más órdenes. El volumen empieza a secarse en la zona. Precio deja de avanzar." },
          { color: isBull ? "#00e676" : "#ff1744", title: "Displacement", body: "Vela impulsiva enorme en la dirección contraria. Deja OB y FVG. Es la señal de que la absorción está completa y los institucionales tienen el control." },
        ].map(s => (
          <div key={s.title} style={{
            background: "var(--bg3)", border: `1px solid ${s.color}44`,
            borderLeft: `3px solid ${s.color}`, padding: "10px 12px",
          }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: s.color, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#7a8fa0", lineHeight: 1.6 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
