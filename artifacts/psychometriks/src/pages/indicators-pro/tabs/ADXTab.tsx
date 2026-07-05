// PSY INDICATORS - ADX Tab
// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/ADXTab.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { fetchCandles } from '../shared/fetchCandles';
import { calcADX, detectADXCrosses } from '../shared/calcIndicators';
import { drawPrice, drawADX as drawADXChart } from '../shared/drawCharts';
import { fmtPrice, fmtPct, type TF } from '../shared/types';

interface Props { sym: string; tf: TF; triggerLoad: number; }

export default function ADXTab({ sym, tf, triggerLoad }: Props) {
  const [period, setPeriod]   = useState(14);
  const [thresh, setThresh]   = useState(25);
  const [strong, setStrong]   = useState(40);
  const [spot,   setSpot]     = useState<number | null>(null);
  const [spotChg, setSpotChg] = useState<number | null>(null);
  const [spotSrcs, setSpotSrcs] = useState<string[]>([]);
  const [status, setStatus]   = useState('Presiona CARGAR');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{
    adx: number; dip: number; dim: number; dx: number;
    verdict: string; cls: string; color: string;
    action: string; actionBg: string; summary: string; conf: number;
    score: number; crosses: number; src: string;
    adxArr: number[]; dipArr: number[]; dimArr: number[];
    priceC: number[]; priceH: number[]; priceL: number[];
    crossList: { i:number; type:string; adx:number; valid:boolean }[];
  } | null>(null);

  const priceCanvas = useRef<HTMLCanvasElement>(null);
  const adxCanvas   = useRef<HTMLCanvasElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setStatus('Cargando ' + sym + ' ' + tf + '...');
    try {
      const [spotRes, candleRes] = await Promise.allSettled([
        fetchSpot(sym),
        fetchCandles(sym, tf, period * 3 + 220)
      ]);

      let spotVal: number | null = null;
      if (spotRes.status === 'fulfilled' && spotRes.value.length) {
        const best = getBestSpot(spotRes.value)!;
        spotVal = best.price;
        setSpot(best.price);
        setSpotChg(best.chg);
        setSpotSrcs(spotRes.value.map(r => `${r.src}: ${fmtPrice(r.price)}`));
      }

      if (candleRes.status === 'fulfilled') {
        const { candles, src } = candleRes.value;
        const { adx, dip, dim, priceC, priceH, priceL } = calcADX(candles, period, 180);
        const crosses = detectADXCrosses(dip, dim, adx, thresh);
        const n = adx.length;
        const av = adx[n-1], dp = dip[n-1], dm = dim[n-1];
        const dx = (dp + dm) > 0 ? 100 * Math.abs(dp - dm) / (dp + dm) : 0;
        const bull = dp > dm;
        const rising = n > 4 && av > adx[n-5];
        const cross = crosses.length > 0 && crosses[crosses.length-1].i === n-1;

        let verdict = '', cls = '', color = '', action = '', actionBg = '', summary = '', conf = 30, score = 30;
        if (av >= thresh && bull && rising) {
          verdict='ALCISTA'; cls='bull'; color='#00e6b4'; action='BUSCAR LONGS'; actionBg='rgba(0,230,180,0.15)'; conf=88; score=88;
          summary=`Tendencia alcista activa y acelerando. ADX=${av.toFixed(1)} confirma fuerza institucional. DI+ domina con ${dp.toFixed(1)} vs DI− ${dm.toFixed(1)}. Buscar entradas en pullbacks.`;
        } else if (av >= thresh && bull) {
          verdict='ALCISTA DÉBIL'; cls='bull'; color='#00e6b4'; action='MANTENER'; actionBg='rgba(0,230,180,0.1)'; conf=68; score=68;
          summary=`Trend alcista confirmado (ADX=${av.toFixed(1)}) pero desacelerando. DI+ sigue dominando. Mantener con stops ajustados.`;
        } else if (av >= thresh && !bull && rising) {
          verdict='BAJISTA'; cls='bear'; color='#e05555'; action='BUSCAR SHORTS'; actionBg='rgba(224,85,85,0.15)'; conf=88; score=88;
          summary=`Tendencia bajista activa y acelerando. ADX=${av.toFixed(1)}, DI− domina (${dm.toFixed(1)} vs ${dp.toFixed(1)}). Evitar longs.`;
        } else if (av >= thresh && !bull) {
          verdict='BAJISTA DÉBIL'; cls='bear'; color='#e05555'; action='CUBRIR'; actionBg='rgba(224,85,85,0.1)'; conf=65; score=65;
          summary=`Trend bajista activo pero frenando (ADX=${av.toFixed(1)}). Cubrir shorts parcialmente.`;
        } else if (av >= 20 && cross && bull) {
          verdict='ALCISTA EMERGENTE'; cls='bull'; color='#00e6b4'; action='PREPARAR LONG'; actionBg='rgba(0,230,180,0.1)'; conf=58; score=55;
          summary=`ADX ${av.toFixed(1)} emergiendo, DI+ cruzó sobre DI−. Esperar ADX>${thresh} para confirmar.`;
        } else if (av >= 20 && cross && !bull) {
          verdict='BAJISTA EMERGENTE'; cls='bear'; color='#e05555'; action='ALERTA'; actionBg='rgba(224,85,85,0.1)'; conf=52; score=48;
          summary=`ADX ${av.toFixed(1)} emergiendo, DI− cruzó sobre DI+. Reducir longs.`;
        } else {
          verdict='NEUTRAL'; cls='neutral'; color='#e6b400'; action='ESPERAR'; actionBg='rgba(230,180,0,0.1)'; conf=30; score=30;
          summary=`ADX=${av.toFixed(1)} bajo umbral ${thresh}. Sin tendencia institucional. Esperar.`;
        }

        setResult({ adx:av, dip:dp, dim:dm, dx, verdict, cls, color, action, actionBg, summary, conf, score,
          crosses: crosses.length, src, adxArr:adx, dipArr:dip, dimArr:dim, priceC, priceH, priceL,
          crossList: crosses.map(c => ({ i:c.i, type:c.type, adx:c.adx||0, valid:c.valid||false }))
        });
        setStatus(`✓ ${src} · ${candles.length} velas · ${sym} · ${tf}`);
      }
    } catch (e: unknown) {
      setStatus('✗ Error: ' + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  }, [sym, tf, period, thresh, strong]);

  useEffect(() => { if (triggerLoad > 0) load(); }, [triggerLoad]);

  useEffect(() => {
    if (!result || !priceCanvas.current || !adxCanvas.current) return;
    const threshold = thresh;
    const strongVal = strong;
    const crosses = result.crossList.map(c => ({
      i: c.i, type: c.type as 'bull'|'bear', adx: c.adx, valid: c.valid
    }));
    drawPrice(priceCanvas.current, result.priceC, result.priceH, result.priceL, spot);
    drawADXChart(adxCanvas.current, result.adxArr, result.dipArr, result.dimArr, crosses, threshold, strongVal);
  }, [result, spot, thresh, strong]);

  const PSY = {
    teal: '#00e6b4', red: '#e05555', amber: '#e6b400',
    bg2: '#0d1318', border: '#2a3540', txt2: '#6a8a9a'
  };

  return (
    <div>
      {/* Spot stripe */}
      <div style={{ background:'#0a0f14', borderBottom:'1px solid #2a3540', padding:'7px 18px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, marginBottom:2 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: spot ? PSY.teal : PSY.amber, display:'inline-block', marginRight:5 }}></span>
            PRECIO SPOT REAL
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:20, fontWeight:700, color:PSY.teal }}>{spot ? fmtPrice(spot) : '—'}</span>
            {spotChg !== null && <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color: spotChg >= 0 ? PSY.teal : PSY.red }}>{fmtPct(spotChg)} 24h</span>}
          </div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:3 }}>
            {spotSrcs.map(s => (
              <span key={s} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, padding:'2px 6px', borderRadius:3, border:'1px solid rgba(0,230,180,0.35)', color:PSY.teal, background:'rgba(0,230,180,0.04)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'12px 18px' }}>
        {/* Resumen */}
        <div className={`psy-res ${result?.cls || 'neutral'}`} style={{ borderRadius:10, padding:'16px 18px', marginBottom:12, border:'2px solid', borderColor: result?.color || '#e6b400', background: result?.cls === 'bull' ? 'rgba(0,230,180,0.05)' : result?.cls === 'bear' ? 'rgba(224,85,85,0.05)' : 'rgba(230,180,0,0.04)', position:'relative', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:26, fontWeight:900, letterSpacing:2, color: result?.color || '#e6b400' }}>{result?.verdict || 'ESPERANDO...'}</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, opacity:.6, letterSpacing:2, marginTop:3 }}>{sym}/USD · {tf.toUpperCase()} · PSY-ADX</div>
            </div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", textAlign:'right' }}>
              <div style={{ fontSize:28, fontWeight:900, color: result?.color || '#e6b400' }}>{result?.score ?? '—'}</div>
              <div style={{ fontSize:9, opacity:.6, letterSpacing:1 }}>SEÑAL PSY</div>
              <div style={{ fontSize:9, color:PSY.txt2, marginTop:2 }}>{result && result.score >= 70 ? 'SEÑAL FUERTE' : result && result.score >= 50 ? 'SEÑAL MODERADA' : 'SEÑAL DÉBIL'}</div>
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:10 }}>
            {[
              { l:'ADX', v: result?.adx.toFixed(1) || '—', c: result?.color },
              { l:'DI+ vs DI−', v: result ? `${result.dip > result.dim ? 'DI+ ' : 'DI− '}${Math.abs(result.dip - result.dim).toFixed(1)}` : '—', c: result && result.dip > result.dim ? PSY.teal : PSY.red },
              { l:'MOMENTUM', v: result && result.adxArr.length > 4 ? (result.adx > result.adxArr[result.adxArr.length-5] ? '↑ Acelerando' : '↓ Frenando') : '—', c: PSY.txt2 },
              { l:'CRUCES', v: result ? `${result.crosses} detectados` : '—', c: PSY.txt2 },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background:'rgba(0,0,0,0.2)', borderRadius:6, padding:'7px 9px' }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, letterSpacing:1, marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:"'Share Tech Mono',monospace", color: c || PSY.txt2 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:12, lineHeight:1.7, color:'#c8d8e0', padding:'9px 11px', background:'rgba(0,0,0,0.2)', borderRadius:6, borderLeft:`3px solid ${result?.color || '#e6b400'}` }}>
            {result?.summary || 'Carga los datos para ver el resumen ADX.'}
          </div>

          <div style={{ marginTop:9, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, padding:'5px 14px', borderRadius:5, fontWeight:700, background: result?.actionBg || 'rgba(42,53,64,0.5)', color: result?.color || PSY.txt2, border:`1px solid ${result?.color || PSY.border}55` }}>
              {result?.action || '— CARGAR —'}
            </span>
            <div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:PSY.txt2 }}>Confianza: {result?.conf ?? '—'}%</div>
              <div style={{ height:4, borderRadius:2, background:'#1a2530', marginTop:4, width:130 }}>
                <div style={{ height:'100%', borderRadius:2, background: result?.color || PSY.txt2, width:`${result?.conf || 0}%`, transition:'width .5s' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:10 }}>
          {[
            { l:'Período ADX', v:period, min:7, max:30, set:setPeriod },
            { l:'Señal umbral', v:thresh, min:15, max:40, set:setThresh },
            { l:'Strong umbral', v:strong, min:30, max:60, set:setStrong },
          ].map(({ l, v, min, max, set }) => (
            <div key={l} style={{ background:PSY.bg2, border:`1px solid ${PSY.border}`, borderRadius:7, padding:'7px 11px' }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, letterSpacing:1, textTransform:'uppercase', marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:17, fontWeight:700, fontFamily:"'Share Tech Mono',monospace", color:PSY.teal }}>{v}</div>
              <input type="range" min={min} max={max} value={v} onChange={e => set(+e.target.value)} style={{ width:'100%', marginTop:2, accentColor:PSY.teal }} />
            </div>
          ))}
        </div>

        {/* Metric cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:7, marginBottom:10 }}>
          {[
            { l:'ADX', v: result?.adx.toFixed(1) || '—', s:'Fuerza de tendencia', c: result?.color },
            { l:'DI+', v: result?.dip.toFixed(1) || '—', s:'Presión alcista', c: PSY.teal },
            { l:'DI−', v: result?.dim.toFixed(1) || '—', s:'Presión bajista', c: PSY.red },
            { l:'DX',  v: result?.dx.toFixed(1)  || '—', s:'Índice direccional', c: PSY.amber },
          ].map(({ l, v, s, c }) => (
            <div key={l} style={{ background:PSY.bg2, border:`1px solid ${PSY.border}`, borderRadius:7, padding:'7px 11px' }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, letterSpacing:1.5, marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:20, fontWeight:700, fontFamily:"'Share Tech Mono',monospace", color: c || PSY.txt2 }}>{v}</div>
              <div style={{ fontSize:9, marginTop:1, color:PSY.txt2 }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Price chart */}
        <div style={{ background:PSY.bg2, border:`1px solid ${PSY.border}`, borderRadius:7, overflow:'hidden', marginBottom:8 }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, padding:'5px 11px 2px', display:'flex', justifyContent:'space-between' }}>
            <span>PRECIO · {sym}/USDT · {result?.src || '—'}</span>
            <div style={{ display:'flex', gap:8 }}>
              <span style={{ fontSize:9, color:PSY.txt2 }}>Vela:</span>
              <span style={{ fontSize:11, color:PSY.teal, fontWeight:700, fontFamily:"'Share Tech Mono',monospace" }}>{result ? fmtPrice(result.priceC[result.priceC.length-1]) : '—'}</span>
              <span style={{ color:PSY.amber, fontSize:9, fontFamily:"'Share Tech Mono',monospace" }}>│Spot:</span>
              <span style={{ fontSize:11, color:PSY.amber, fontWeight:700, fontFamily:"'Share Tech Mono',monospace" }}>{spot ? fmtPrice(spot) : '—'}</span>
            </div>
          </div>
          {result ? <canvas ref={priceCanvas} style={{ display:'block', width:'100%' }} /> : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:90, fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'#1a2530', letterSpacing:2 }}>— SIN DATOS —</div>}
        </div>

        {/* ADX chart */}
        <div style={{ background:PSY.bg2, border:`1px solid ${PSY.border}`, borderRadius:7, overflow:'hidden', marginBottom:8 }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, padding:'5px 11px 2px' }}>ADX · DI+ · DI−</div>
          {result ? <canvas ref={adxCanvas} style={{ display:'block', width:'100%' }} /> : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:90, fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'#1a2530', letterSpacing:2 }}>— SIN DATOS —</div>}
          <div style={{ display:'flex', gap:12, padding:'4px 11px 7px', flexWrap:'wrap' }}>
            {[['▲ Cruce alcista','rgba(0,230,180,0.8)'],['▼ Cruce bajista','rgba(224,85,85,0.8)'],['━ ADX','rgba(0,230,180,0.95)'],['━ DI+','rgba(0,230,180,0.5)'],['━ DI−','rgba(224,85,85,0.82)']].map(([t,c])=>(
              <div key={t} style={{ display:'flex', alignItems:'center', gap:5, fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2 }}>
                <div style={{ width:14, height:2, background:c, borderRadius:1 }}></div>{t}
              </div>
            ))}
          </div>
        </div>

        {/* Cross log */}
        <div style={{ background:PSY.bg2, border:`1px solid ${PSY.border}`, borderRadius:7, overflow:'hidden' }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, padding:'5px 11px 2px' }}>⚡ CRUCES ADX DETECTADOS</div>
          <div style={{ padding:'8px 12px', fontFamily:"'Share Tech Mono',monospace", fontSize:10, minHeight:36, lineHeight:1.9 }}>
            {result?.crossList.length ? (
              [...result.crossList].reverse().slice(0,6).map((c, i) => (
                <div key={i} style={{ background: i===0 ? `rgba(${c.type==='bull'?'0,230,180':'224,85,85'},0.05)` : undefined, borderRadius:4, padding: i===0 ? '2px 6px' : undefined }}>
                  <span style={{ color: c.type==='bull'?PSY.teal:PSY.red, fontWeight:700 }}>{c.type==='bull'?'▲ DI+ CRUZA DI−':'▼ DI− CRUZA DI+'}</span>
                  {c.valid ? <span style={{ color:PSY.teal }}> ✓ VÁLIDO ADX={c.adx.toFixed(1)}</span> : <span style={{ color:PSY.amber }}> ⚠ ADX={c.adx.toFixed(1)} bajo umbral</span>}
                  {i===0 && <span style={{ color:PSY.txt2, fontSize:9 }}> ← ÚLTIMO</span>}
                </div>
              ))
            ) : <span style={{ color:'#1a2530' }}>— Sin cruces —</span>}
          </div>
        </div>

        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2, padding:'5px 0', marginTop:6 }}>{status}</div>
      </div>
    </div>
  );
}
