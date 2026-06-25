// PSY INDICATORS - RSI Tab
// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/RSITab.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { fetchCandles } from '../shared/fetchCandles';
import { calcRSI, sma } from '../shared/calcIndicators';
import { drawPrice, drawRSI as drawRSIChart, drawGauge } from '../shared/drawCharts';
import { fmtPrice, fmtPct, type TF } from '../shared/types';
interface Props { sym: string; tf: TF; triggerLoad: number; }
export default function RSITab({ sym, tf, triggerLoad }: Props) {
  const [period,setPeriod]=useState(14);const [ob,setOb]=useState(70);const [os,setOs]=useState(30);
  const [spot,setSpot]=useState<number|null>(null);const [spotChg,setSpotChg]=useState<number|null>(null);
  const [spotSrcs,setSpotSrcs]=useState<string[]>([]);const [status,setStatus]=useState('Presiona CARGAR');
  const [r,setR]=useState<any>(null);
  const pCanvas=useRef<HTMLCanvasElement>(null);const rCanvas=useRef<HTMLCanvasElement>(null);const gCanvas=useRef<HTMLCanvasElement>(null);
  const PSY={teal:'#00e6b4',red:'#e05555',amber:'#e6b400',bg2:'#0d1318',border:'#2a3540',txt2:'#6a8a9a'};
  const load=useCallback(async()=>{
    setStatus('Cargando '+sym+' '+tf+'...');
    try{
      const[sr,cr]=await Promise.allSettled([fetchSpot(sym),fetchCandles(sym,tf,period*2+220)]);
      let sv:number|null=null;
      if(sr.status==='fulfilled'&&sr.value.length){const b=getBestSpot(sr.value)!;sv=b.price;setSpot(b.price);setSpotChg(b.chg);setSpotSrcs(sr.value.map(x=>`${x.src}: ${fmtPrice(x.price)}`));}
      if(cr.status==='fulfilled'){
        const{candles,src}=cr.value;const C=candles.map(c=>c.c);
        const raw=calcRSI(C,period);const ml=Math.min(raw.length,candles.length-period,180);
        const rsiArr=raw.slice(-ml);const px=C.slice(-ml);const ph=candles.slice(-ml).map(c=>c.h);const pl=candles.slice(-ml).map(c=>c.l);
        const maArr=sma(rsiArr,9).filter(v=>v!==null) as number[];
        const n=rsiArr.length;const val=rsiArr[n-1];const prev=n>1?rsiArr[n-2]:val;const rising=val>prev;
        const ma=maArr.length?maArr[maArr.length-1]:null;
        let zone='',zc='',cls='neutral';
        if(val>=ob){zone='SOBRECOMPRA';zc=PSY.red;cls='ob';}
        else if(val>=60){zone='ALCISTA';zc=PSY.teal;cls='bull';}
        else if(val>=40){zone='NEUTRO';zc=PSY.amber;cls='neutral';}
        else if(val>=os){zone='BAJISTA';zc=PSY.red;cls='bear';}
        else{zone='SOBREVENTA';zc=PSY.teal;cls='os';}
        const lb=20,rP=px.slice(-lb),rR=rsiArr.slice(-lb),h=Math.floor(lb/2);
        const divB=Math.min(...rP.slice(h))<Math.min(...rP.slice(0,h))&&Math.min(...rR.slice(h))>Math.min(...rR.slice(0,h));
        const divBr=Math.max(...rP.slice(h))>Math.max(...rP.slice(0,h))&&Math.max(...rR.slice(h))<Math.max(...rR.slice(0,h));
        const r14=rsiArr.slice(-14);
        let verdict='',action='',actionBg='',summary='',conf=50;const col=zc;
        if(val>=ob&&!rising){verdict='SOBRECOMPRA ↓';action='TOMAR GANANCIAS';actionBg='rgba(224,85,85,0.15)';conf=80;summary=`RSI ${val.toFixed(1)} sobrecomprado y cayendo. Alta probabilidad de corrección.`;}
        else if(val>=ob){verdict='SOBRECOMPRA ↑';action='STOPS AJUSTADOS';actionBg='rgba(224,85,85,0.1)';conf=65;summary=`RSI ${val.toFixed(1)} sobrecomprado pero subiendo. Riesgo aumenta.`;}
        else if(val<=os&&rising){verdict='SOBREVENTA ↑';action='BUSCAR LONG';actionBg='rgba(0,230,180,0.15)';conf=80;summary=`RSI ${val.toFixed(1)} sobrevendido y rebotando. ${divB?'✓ Divergencia alcista confirmada.':'Esperar RSI sobre '+os+'.'}`;}
        else if(val<=os){verdict='SOBREVENTA ↓';action='ESPERAR';actionBg='rgba(230,180,0,0.1)';conf=55;summary=`RSI ${val.toFixed(1)} sobrevendido y bajando. No atrapar el cuchillo.`;}
        else if(val>50&&ma&&val>ma&&rising){verdict='ALCISTA';action='MANTENER LONGS';actionBg='rgba(0,230,180,0.12)';conf=70;summary=`RSI ${val.toFixed(1)} sobre 50 y MA(9) ${ma?.toFixed(1)}. Momentum alcista activo.`;}
        else if(val<50&&ma&&val<ma&&!rising){verdict='BAJISTA';action='EVITAR LONGS';actionBg='rgba(224,85,85,0.1)';conf=70;summary=`RSI ${val.toFixed(1)} bajo 50 y MA(9) ${ma?.toFixed(1)}. Momentum bajista activo.`;}
        else{verdict='NEUTRAL';action='OBSERVAR';actionBg='rgba(230,180,0,0.1)';conf=35;summary=`RSI ${val.toFixed(1)} en zona neutra. Esperar señal clara.`;}
        setR({val,prev,zone,zc,cls,verdict,action,actionBg,summary,conf,rising,divB,divBr,ma,r14max:Math.max(...r14).toFixed(1),r14min:Math.min(...r14).toFixed(1),rsiArr,maArr,px,ph,pl,src});
        setStatus(`✓ ${src} · ${ml} velas · ${sym} · ${tf}`);
      }
    }catch(e:any){setStatus('✗ '+e.message);}
  },[sym,tf,period,ob,os]);
  useEffect(()=>{if(triggerLoad>0)load();},[triggerLoad]);
  useEffect(()=>{
    if(!r||!pCanvas.current||!rCanvas.current||!gCanvas.current)return;
    drawPrice(pCanvas.current,r.px,r.ph,r.pl,spot,(i)=>r.rsiArr[i]>ob?'rgba(224,85,85,0.8)':r.rsiArr[i]<os?'rgba(0,230,180,0.9)':'rgba(0,230,180,0.6)');
    drawRSIChart(rCanvas.current,r.rsiArr,r.maArr,ob,os);
    drawGauge(gCanvas.current,r.val,ob,os);
  },[r,spot,ob,os]);
  return(
    <div>
      <div style={{background:'#0a0f14',borderBottom:'1px solid #2a3540',padding:'7px 18px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,marginBottom:2}}><span style={{width:7,height:7,borderRadius:'50%',background:spot?PSY.teal:PSY.amber,display:'inline-block',marginRight:5}}></span>PRECIO SPOT</div>
          <div style={{display:'flex',alignItems:'baseline',gap:8}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:20,fontWeight:700,color:PSY.teal}}>{spot?fmtPrice(spot):'—'}</span>{spotChg!==null&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:spotChg>=0?PSY.teal:PSY.red}}>{fmtPct(spotChg)} 24h</span>}</div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:3}}>{spotSrcs.map(s=><span key={s} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,padding:'2px 6px',borderRadius:3,border:'1px solid rgba(0,230,180,0.35)',color:PSY.teal,background:'rgba(0,230,180,0.04)'}}>{s}</span>)}</div>
        </div>
      </div>
      <div style={{padding:'12px 18px'}}>
        <div style={{borderRadius:10,padding:'16px 18px',marginBottom:12,border:`2px solid ${r?.zc||PSY.amber}`,background:r?.cls==='bull'||r?.cls==='os'?'rgba(0,230,180,0.05)':r?.cls==='bear'||r?.cls==='ob'?'rgba(224,85,85,0.05)':'rgba(230,180,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:10}}>
            <div><div style={{fontSize:26,fontWeight:900,letterSpacing:2,color:r?.zc||PSY.amber}}>{r?.verdict||'ESPERANDO...'}</div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,opacity:.6,letterSpacing:2,marginTop:3}}>{sym}/USD · {tf.toUpperCase()} · PSY-RSI</div></div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",textAlign:'right'}}><div style={{fontSize:34,fontWeight:900,color:r?.zc||PSY.amber}}>{r?.val.toFixed(1)||'—'}</div><div style={{fontSize:9,opacity:.6,letterSpacing:1}}>RSI ACTUAL</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
            {[{l:'ZONA',v:r?.zone||'—',c:r?.zc},{l:'RSI PREV',v:r?.prev.toFixed(1)||'—',c:r?.rising?PSY.teal:PSY.red},{l:'TENDENCIA',v:r?.rising?'↑ Subiendo':'↓ Bajando',c:r?.rising?PSY.teal:PSY.red},{l:'DIVERGENCIA',v:r?.divB?'ALCISTA ▲':r?.divBr?'BAJISTA ▼':'NINGUNA',c:r?.divB?PSY.teal:r?.divBr?PSY.red:PSY.txt2}].map(({l,v,c})=>(
              <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'7px 9px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:13,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div></div>
            ))}
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:'#c8d8e0',padding:'9px 11px',background:'rgba(0,0,0,0.2)',borderRadius:6,borderLeft:`3px solid ${r?.zc||PSY.amber}`}}>{r?.summary||'Carga los datos.'}</div>
          <div style={{marginTop:9,display:'flex',alignItems:'center',gap:10}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,padding:'5px 14px',borderRadius:5,fontWeight:700,background:r?.actionBg||'rgba(42,53,64,0.5)',color:r?.zc||PSY.txt2,border:`1px solid ${r?.zc||PSY.border}55`}}>{r?.action||'— CARGAR —'}</span><div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:PSY.txt2}}>Confianza: {r?.conf||'—'}%</div><div style={{height:4,borderRadius:2,background:'#1a2530',marginTop:4,width:130}}><div style={{height:'100%',borderRadius:2,background:r?.zc||PSY.txt2,width:`${r?.conf||0}%`,transition:'width .5s'}}></div></div></div></div>
        </div>
        {/* Gauge */}
        <div style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:8,padding:12,marginBottom:10,display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
          <canvas ref={gCanvas} width={200} height={110}/>
          <div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:34,fontWeight:900,color:r?.zc||PSY.amber}}>{r?.val.toFixed(1)||'—'}</div><div style={{fontSize:11,fontWeight:700,letterSpacing:1,color:r?.zc||PSY.amber,marginTop:3}}>{r?.zone||'—'}</div><div style={{fontSize:11,color:PSY.txt2,marginTop:5,lineHeight:1.5}}>{r?.zone==='SOBRECOMPRA'?'Activo sobrecomprado. Alta probabilidad de corrección.':r?.zone==='SOBREVENTA'?'Activo sobrevendido. Posible rebote técnico.':r?.zone==='ALCISTA'?'RSI en zona alcista — momentum positivo.':r?.zone==='BAJISTA'?'RSI en zona bajista — momentum negativo.':'RSI en zona neutra — sin sesgo claro.'}</div></div>
        </div>
        {/* Controls */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}>
          {[{l:'Período RSI',v:period,min:5,max:30,set:setPeriod},{l:'Sobrecompra',v:ob,min:60,max:85,set:setOb},{l:'Sobreventa',v:os,min:15,max:40,set:setOs}].map(({l,v,min,max,set})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'7px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,textTransform:'uppercase',marginBottom:2}}>{l}</div><div style={{fontSize:17,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:PSY.teal}}>{v}</div><input type="range" min={min} max={max} value={v} onChange={e=>set(+e.target.value)} style={{width:'100%',marginTop:2,accentColor:PSY.teal}}/></div>
          ))}
        </div>
        {/* Metric cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
          {[{l:'RSI',v:r?.val.toFixed(1)||'—',s:r?.zone||'—',c:r?.zc},{l:'RSI MA(9)',v:r?.ma?.toFixed(1)||'—',s:'Señal suavizada',c:PSY.amber},{l:'RSI MAX',v:r?.r14max||'—',s:'14 velas',c:PSY.red},{l:'RSI MIN',v:r?.r14min||'—',s:'14 velas',c:PSY.teal}].map(({l,v,s,c})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'7px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1.5,marginBottom:2}}>{l}</div><div style={{fontSize:18,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div><div style={{fontSize:9,marginTop:1,color:PSY.txt2}}>{s}</div></div>
          ))}
        </div>
        {/* Charts */}
        {[{id:'rsi-pw',ref:pCanvas,lbl:`PRECIO · ${sym} · ${r?.src||'—'}`},{id:'rsi-rw',ref:rCanvas,lbl:'RSI · MA(9) · Zonas OB/OS'}].map(({id,ref,lbl})=>(
          <div key={id} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,overflow:'hidden',marginBottom:8}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 11px 2px'}}>{lbl}</div>
            {r?<canvas ref={ref} style={{display:'block',width:'100%'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:90,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#1a2530',letterSpacing:2}}>— SIN DATOS —</div>}
          </div>
        ))}
        {/* Divergencias */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
          {[{t:'DIVERGENCIA ALCISTA',v:r?.divB?'✓ DETECTADA':'NO DETECTADA',c:r?.divB?PSY.teal:'#2a3540',d:'Precio mínimos más bajos, RSI mínimos más altos'},{t:'DIVERGENCIA BAJISTA',v:r?.divBr?'✓ DETECTADA':'NO DETECTADA',c:r?.divBr?PSY.red:'#2a3540',d:'Precio máximos más altos, RSI máximos más bajos'}].map(({t,v,c,d})=>(
            <div key={t} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'9px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,color:PSY.txt2,marginBottom:5}}>{t}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:PSY.txt2,marginTop:2,lineHeight:1.4}}>{d}</div></div>
          ))}
        </div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 0',marginTop:6}}>{status}</div>
      </div>
    </div>
  );
}
