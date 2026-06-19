// PSY INDICATORS - MACD Tab
// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/MACDTab.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { fetchCandles } from '../shared/fetchCandles';
import { calcMACD, detectMACDCrosses } from '../shared/calcIndicators';
import { drawPrice, drawMACD as drawMACDChart } from '../shared/drawCharts';
import { fmtPrice, fmtPct, type TF } from '../shared/types';
interface Props { sym: string; tf: TF; triggerLoad: number; }
export default function MACDTab({ sym, tf, triggerLoad }: Props) {
  const [fast,setFast]=useState(12);const [slow,setSlow]=useState(26);const [signal,setSignal]=useState(9);const [bars,setBars]=useState(150);
  const [spot,setSpot]=useState<number|null>(null);const [spotChg,setSpotChg]=useState<number|null>(null);const [spotSrcs,setSpotSrcs]=useState<string[]>([]);
  const [status,setStatus]=useState('Presiona CARGAR');const [r,setR]=useState<any>(null);
  const pCanvas=useRef<HTMLCanvasElement>(null);const mCanvas=useRef<HTMLCanvasElement>(null);
  const PSY={teal:'#00e6b4',red:'#e05555',amber:'#e6b400',bg2:'#0d1318',border:'#2a3540',txt2:'#6a8a9a'};
  const fmtV=(v:number)=>{const d=Math.abs(v)<0.0001?8:Math.abs(v)<0.01?6:Math.abs(v)<1?5:4;return v.toFixed(d);};
  const load=useCallback(async()=>{
    setStatus('Cargando '+sym+'...');
    try{
      const[sr,cr]=await Promise.allSettled([fetchSpot(sym),fetchCandles(sym,tf,bars+slow+signal+20)]);
      if(sr.status==='fulfilled'&&sr.value.length){const b=getBestSpot(sr.value)!;setSpot(b.price);setSpotChg(b.chg);setSpotSrcs(sr.value.map(x=>`${x.src}: ${fmtPrice(x.price)}`));}
      if(cr.status==='fulfilled'){
        const{candles,src}=cr.value;
        const res=calcMACD(candles,fast,slow,signal,bars);
        const crosses=detectMACDCrosses(res.macd,res.signal);
        const n=res.macd.length;const mv=res.macd[n-1],sv=res.signal[n-1],hv=res.hist[n-1],prevH=n>1?res.hist[n-2]:hv;
        const bull=mv>sv,aboveZ=mv>0,histGrow=Math.abs(hv)>Math.abs(prevH);
        let verdict='',cls='neutral',color=PSY.amber,action='',actionBg='',summary='',conf=50;
        if(bull&&aboveZ&&histGrow){verdict='ALCISTA FUERTE';cls='bull';color=PSY.teal;action='BUSCAR LONGS';actionBg='rgba(0,230,180,0.15)';conf=88;summary=`MACD sobre señal y cero, histograma creciendo. Máxima confirmación alcista.`;}
        else if(bull&&aboveZ){verdict='ALCISTA DÉBIL';cls='bull';color=PSY.teal;action='MANTENER';actionBg='rgba(0,230,180,0.1)';conf=68;summary=`MACD sobre señal y cero pero histograma reduciéndose. Trend pierde fuerza.`;}
        else if(bull&&!aboveZ){verdict='RECUPERANDO';cls='bull';color=PSY.teal;action='PREPARAR LONG';actionBg='rgba(0,230,180,0.1)';conf=62;summary=`MACD cruzó señal pero aún bajo cero. Señal alcista emergente.`;}
        else if(!bull&&!aboveZ&&histGrow){verdict='BAJISTA FUERTE';cls='bear';color=PSY.red;action='BUSCAR SHORTS';actionBg='rgba(224,85,85,0.15)';conf=88;summary=`MACD bajo señal y cero, histograma bajista creciendo. Máxima confirmación bajista.`;}
        else if(!bull&&!aboveZ){verdict='BAJISTA DÉBIL';cls='bear';color=PSY.red;action='CUBRIR SHORTS';actionBg='rgba(224,85,85,0.1)';conf=65;summary=`MACD bajo señal y cero, histograma reduciéndose. La bajada frena.`;}
        else if(!bull&&aboveZ){verdict='DISTRIBUYENDO';cls='neutral';color=PSY.amber;action='REDUCIR LONGS';actionBg='rgba(230,180,0,0.1)';conf=60;summary=`MACD cruzó bajo señal pero aún sobre cero. Debilitamiento alcista.`;}
        else{verdict='NEUTRAL';cls='neutral';color=PSY.amber;action='ESPERAR';actionBg='rgba(230,180,0,0.1)';conf=30;summary=`Sin señal clara. Esperar que histograma tome dirección.`;}
        setR({mv,sv,hv,prevH,bull,aboveZ,histGrow,verdict,cls,color,action,actionBg,summary,conf,src,crosses,priceC:res.priceC,priceH:res.priceH,priceL:res.priceL,macd:res.macd,signal:res.signal,hist:res.hist});
        setStatus(`✓ ${src} · ${candles.length} velas · ${sym} · ${tf}`);
      }
    }catch(e:any){setStatus('✗ '+e.message);}
  },[sym,tf,fast,slow,signal,bars]);
  useEffect(()=>{if(triggerLoad>0)load();},[triggerLoad]);
  useEffect(()=>{
    if(!r||!pCanvas.current||!mCanvas.current)return;
    drawPrice(pCanvas.current,r.priceC,r.priceH,r.priceL,spot);
    drawMACDChart(mCanvas.current,r.macd,r.signal,r.hist,r.crosses);
  },[r,spot]);
  return(
    <div>
      <div style={{background:'#0a0f14',borderBottom:'1px solid #2a3540',padding:'7px 18px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,marginBottom:2}}><span style={{width:7,height:7,borderRadius:'50%',background:spot?PSY.teal:PSY.amber,display:'inline-block',marginRight:5}}></span>PRECIO SPOT</div>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:20,fontWeight:700,color:PSY.teal}}>{spot?fmtPrice(spot):'—'}</span>{spotChg!==null&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:spotChg>=0?PSY.teal:PSY.red}}>{fmtPct(spotChg)} 24h</span>}</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:3}}>{spotSrcs.map(s=><span key={s} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,padding:'2px 6px',borderRadius:3,border:'1px solid rgba(0,230,180,0.35)',color:PSY.teal,background:'rgba(0,230,180,0.04)'}}>{s}</span>)}</div></div>
      </div>
      <div style={{padding:'12px 18px'}}>
        <div style={{borderRadius:10,padding:'16px 18px',marginBottom:12,border:`2px solid ${r?.color||PSY.amber}`,background:r?.cls==='bull'?'rgba(0,230,180,0.05)':r?.cls==='bear'?'rgba(224,85,85,0.05)':'rgba(230,180,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:10}}>
            <div><div style={{fontSize:26,fontWeight:900,letterSpacing:2,color:r?.color||PSY.amber}}>{r?.verdict||'ESPERANDO...'}</div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,opacity:.6,letterSpacing:2,marginTop:3}}>{sym}/USD · {tf.toUpperCase()} · PSY-MACD</div></div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",textAlign:'right'}}><div style={{fontSize:18,fontWeight:900,color:r?.color||PSY.amber}}>{r?fmtV(r.mv):'—'}</div><div style={{fontSize:9,opacity:.6,letterSpacing:1}}>MACD LINE</div><div style={{fontSize:10,marginTop:3,color:r?.hv>=0?PSY.teal:PSY.red,fontFamily:"'Share Tech Mono',monospace"}}>Hist: {r?fmtV(r.hv):'—'}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
            {[{l:'MACD',v:r?fmtV(r.mv):'—',c:r?.bull?PSY.teal:PSY.red},{l:'SEÑAL',v:r?fmtV(r.sv):'—',c:PSY.amber},{l:'HISTOGRAMA',v:r?fmtV(r.hv):'—',c:r?.hv>=0?PSY.teal:PSY.red},{l:'CRUCE',v:r?.crosses.length?(r.bull?'Bull activo':'Bear activo'):'—',c:r?.bull?PSY.teal:PSY.red}].map(({l,v,c})=>(
              <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'7px 9px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:12,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div></div>
            ))}
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:'#c8d8e0',padding:'9px 11px',background:'rgba(0,0,0,0.2)',borderRadius:6,borderLeft:`3px solid ${r?.color||PSY.amber}`}}>{r?.summary||'Carga los datos.'}</div>
          <div style={{marginTop:9,display:'flex',alignItems:'center',gap:10}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,padding:'5px 14px',borderRadius:5,fontWeight:700,background:r?.actionBg||'rgba(42,53,64,0.5)',color:r?.color||PSY.txt2,border:`1px solid ${r?.color||PSY.border}55`}}>{r?.action||'— CARGAR —'}</span><div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:PSY.txt2}}>Confianza: {r?.conf||'—'}%</div><div style={{height:4,borderRadius:2,background:'#1a2530',marginTop:4,width:130}}><div style={{height:'100%',borderRadius:2,background:r?.color||PSY.txt2,width:`${r?.conf||0}%`,transition:'width .5s'}}></div></div></div></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
          {[{l:'EMA Rápida',v:fast,min:5,max:20,set:setFast},{l:'EMA Lenta',v:slow,min:15,max:50,set:setSlow},{l:'Señal',v:signal,min:5,max:15,set:setSignal},{l:'Velas',v:bars,min:60,max:250,set:setBars}].map(({l,v,min,max,set})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'7px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>{l}</div><div style={{fontSize:17,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:PSY.teal}}>{v}</div><input type="range" min={min} max={max} value={v} onChange={e=>set(+e.target.value)} style={{width:'100%',marginTop:2,accentColor:PSY.teal}}/></div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
          {[{l:'MACD LINE',v:r?fmtV(r.mv):'—',s:'fast−slow',c:r?.bull?PSY.teal:PSY.red},{l:'SEÑAL',v:r?fmtV(r.sv):'—',s:'EMA(9)',c:PSY.amber},{l:'HISTOGRAMA',v:r?fmtV(r.hv):'—',s:'MACD−Señal',c:r?.hv>=0?PSY.teal:PSY.red},{l:'TENDENCIA',v:r?(r.histGrow?(r.hv>0?'↑ Creciendo':'↓ Creciendo'):(r.hv>0?'↓ Reduciendo':'↑ Reduciendo')):'—',s:'Hist. dirección',c:r?.histGrow&&r?.hv>0?PSY.teal:r?.histGrow&&r?.hv<0?PSY.red:PSY.amber}].map(({l,v,s,c})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'7px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1.5,marginBottom:2}}>{l}</div><div style={{fontSize:16,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div><div style={{fontSize:9,marginTop:1,color:PSY.txt2}}>{s}</div></div>
          ))}
        </div>
        {[{ref:pCanvas,lbl:`PRECIO · ${sym} · ${r?.src||'—'}`},{ref:mCanvas,lbl:'MACD · SEÑAL · HISTOGRAMA'}].map(({ref,lbl},i)=>(
          <div key={i} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,overflow:'hidden',marginBottom:8}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 11px 2px'}}>{lbl}</div>
            {r?<canvas ref={ref} style={{display:'block',width:'100%'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:90,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#1a2530',letterSpacing:2}}>— SIN DATOS —</div>}
          </div>
        ))}
        <div style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,overflow:'hidden'}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 11px 2px'}}>⚡ CRUCES MACD</div>
          <div style={{padding:'8px 12px',fontFamily:"'Share Tech Mono',monospace",fontSize:10,minHeight:36,lineHeight:1.9}}>
            {r?.crosses.length?[...r.crosses].reverse().slice(0,6).map((c:any,i:number)=>(
              <div key={i} style={{background:i===0?`rgba(${c.type==='bull'?'0,230,180':'224,85,85'},0.05)`:undefined,borderRadius:4,padding:i===0?'2px 6px':undefined}}>
                <span style={{color:c.type==='bull'?PSY.teal:PSY.red,fontWeight:700}}>{c.type==='bull'?'▲ CRUCE ALCISTA':'▼ CRUCE BAJISTA'}</span>
                <span style={{color:c.macd>0?(c.type==='bull'?PSY.teal:PSY.amber):(c.type==='bull'?PSY.amber:PSY.red),fontSize:9}}> {c.macd>0?(c.type==='bull'?'✓ ALCISTA FUERTE':'⚠ BEAR en zona +'):(c.type==='bull'?'⚠ BULL en zona −':'✓ BAJISTA FUERTE')}</span>
                {i===0&&<span style={{color:PSY.txt2,fontSize:9}}> ← ÚLTIMO</span>}
              </div>
            )):<span style={{color:'#1a2530'}}>— Sin cruces —</span>}
          </div>
        </div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 0',marginTop:6}}>{status}</div>
      </div>
    </div>
  );
}
