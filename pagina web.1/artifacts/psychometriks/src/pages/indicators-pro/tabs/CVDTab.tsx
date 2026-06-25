// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/CVDTab.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { fetchCandles } from '../shared/fetchCandles';
import { calcCVD } from '../shared/calcIndicators';
import { drawPrice, drawCVD as drawCVDChart } from '../shared/drawCharts';
import { fmtPrice, fmtPct, fmtBig, type TF } from '../shared/types';
interface Props { sym: string; tf: TF; triggerLoad: number; }
export default function CVDTab({ sym, tf, triggerLoad }: Props) {
  const [spot,setSpot]=useState<number|null>(null);const [spotChg,setSpotChg]=useState<number|null>(null);const [spotSrcs,setSpotSrcs]=useState<string[]>([]);
  const [status,setStatus]=useState('Presiona CARGAR');const [r,setR]=useState<any>(null);
  const pCanvas=useRef<HTMLCanvasElement>(null);const cCanvas=useRef<HTMLCanvasElement>(null);
  const PSY={teal:'#00e6b4',red:'#e05555',amber:'#e6b400',bg2:'#0d1318',border:'#2a3540',txt2:'#6a8a9a'};
  const load=useCallback(async()=>{
    setStatus('Cargando CVD para '+sym+'...');
    try{
      const[sr,cr]=await Promise.allSettled([fetchSpot(sym),fetchCandles(sym,tf,200)]);
      let sv:number|null=null;
      if(sr.status==='fulfilled'&&sr.value.length){const b=getBestSpot(sr.value)!;sv=b.price;setSpot(b.price);setSpotChg(b.chg);setSpotSrcs(sr.value.map(x=>`${x.src}: ${fmtPrice(x.price)}`));}
      if(cr.status==='fulfilled'){
        const{candles,src}=cr.value;const nb=150;
        const{cvd,deltas,buyVols,sellVols}=calcCVD(candles,sv||candles[candles.length-1].c);
        const cvdArr=cvd.slice(-nb),deltaArr=deltas.slice(-nb),buyArr=buyVols.slice(-nb),sellArr=sellVols.slice(-nb);
        const px=candles.slice(-nb).map(c=>c.c),ph=candles.slice(-nb).map(c=>c.h),pl=candles.slice(-nb).map(c=>c.l);
        const n=cvdArr.length,cvdNow=cvdArr[n-1],deltaNow=deltaArr[n-1];
        const b10=buyArr.slice(-10).reduce((a,b)=>a+b,0),s10=sellArr.slice(-10).reduce((a,b)=>a+b,0),tot=b10+s10;
        const bRatio=tot>0?b10/tot:.5;const cvdChg=cvdNow-(cvdArr.length>10?cvdArr[n-11]:cvdArr[0]);
        const lb=20,rP=px.slice(-lb),rC=cvdArr.slice(-lb),h=Math.floor(lb/2);
        const divB=Math.min(...rP.slice(h))<Math.min(...rP.slice(0,h))&&Math.min(...rC.slice(h))>Math.min(...rC.slice(0,h));
        const divBr=Math.max(...rP.slice(h))>Math.max(...rP.slice(0,h))&&Math.max(...rC.slice(h))<Math.max(...rC.slice(0,h));
        let verdict='',cls='neutral',color=PSY.amber,action='',actionBg='',summary='',conf=50;
        if(cvdNow>0&&cvdChg>0&&bRatio>.55){verdict='COMPRA DOMINANTE';cls='bull';color=PSY.teal;action='BUSCAR LONGS';actionBg='rgba(0,230,180,0.15)';conf=85;summary=`CVD positivo y creciendo. ${(bRatio*100).toFixed(0)}% del volumen fue compra. ${divBr?'⚠ Divergencia bajista.':'Sin divergencias — momentum alcista limpio.'}`;}
        else if(cvdNow>0&&cvdChg<0){verdict='COMPRA DEBILITANDO';cls='neutral';color=PSY.amber;action='PRECAUCIÓN';actionBg='rgba(230,180,0,0.1)';conf=65;summary='CVD positivo pero cayendo. La presión compradora se reduce. Monitorear si cruza cero.';}
        else if(cvdNow<0&&cvdChg<0&&bRatio<.45){verdict='VENTA DOMINANTE';cls='bear';color=PSY.red;action='BUSCAR SHORTS';actionBg='rgba(224,85,85,0.15)';conf=85;summary=`CVD negativo y cayendo. ${(100-bRatio*100).toFixed(0)}% fue venta. ${divB?'⚠ Divergencia alcista.':'Sin divergencias — presión vendedora limpia.'}`;}
        else if(cvdNow<0&&cvdChg>0){verdict='VENTA DEBILITANDO';cls='bull';color=PSY.teal;action='POSIBLE REBOTE';actionBg='rgba(0,230,180,0.08)';conf=62;summary='CVD negativo pero subiendo. '+(divB?'✓ Divergencia alcista detectada — compradores absorbiendo.':'Posible estabilización.');}
        else{verdict='EQUILIBRADO';cls='neutral';color=PSY.amber;action='ESPERAR';actionBg='rgba(230,180,0,0.1)';conf=35;summary=`CVD cerca de cero. Buy/sell ${(bRatio*100).toFixed(0)}/${(100-bRatio*100).toFixed(0)}. Sin presión dominante.`;}
        setR({cvdNow,deltaNow,b10,s10,tot,bRatio,cvdChg,divB,divBr,verdict,cls,color,action,actionBg,summary,conf,src,cvdArr,deltaArr,px,ph,pl});
        setStatus(`✓ ${src} · ${candles.length} velas · ${sym} · ${tf}`);
      }
    }catch(e:any){setStatus('✗ '+e.message);}
  },[sym,tf]);
  useEffect(()=>{if(triggerLoad>0)load();},[triggerLoad]);
  useEffect(()=>{
    if(!r||!pCanvas.current||!cCanvas.current)return;
    drawPrice(pCanvas.current,r.px,r.ph,r.pl,spot,(i)=>r.deltaArr[i]>=0?'rgba(0,230,180,0.8)':'rgba(224,85,85,0.8)');
    drawCVDChart(cCanvas.current,r.cvdArr,r.deltaArr);
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
            <div><div style={{fontSize:24,fontWeight:900,letterSpacing:2,color:r?.color||PSY.amber}}>{r?.verdict||'ESPERANDO...'}</div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,opacity:.6,letterSpacing:2,marginTop:3}}>{sym}/USD · {tf.toUpperCase()} · PSY-CVD</div></div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",textAlign:'right'}}><div style={{fontSize:18,fontWeight:900,color:r?.color||PSY.amber}}>{r?(r.cvdNow>=0?'+':'')+fmtBig(r.cvdNow):'—'}</div><div style={{fontSize:9,opacity:.6,letterSpacing:1}}>CVD ACUMULADO</div><div style={{fontSize:10,marginTop:3,color:r?.deltaNow>=0?PSY.teal:PSY.red,fontFamily:"'Share Tech Mono',monospace"}}>Delta: {r?(r.deltaNow>=0?'+':'')+fmtBig(r.deltaNow):'—'}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
            {[{l:'CVD TREND',v:r?(r.cvdChg>=0?'↑ Subiendo':'↓ Bajando'):'—',c:r?.cvdChg>=0?PSY.teal:PSY.red},{l:'VOL COMPRA',v:r?fmtBig(r.b10):'—',c:PSY.teal},{l:'VOL VENTA',v:r?fmtBig(r.s10):'—',c:PSY.red},{l:'DIVERGENCIA',v:r?.divB?'ALCISTA ▲':r?.divBr?'BAJISTA ▼':'NINGUNA',c:r?.divB?PSY.teal:r?.divBr?PSY.red:PSY.txt2}].map(({l,v,c})=>(
              <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'7px 9px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:12,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div></div>
            ))}
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:'#c8d8e0',padding:'9px 11px',background:'rgba(0,0,0,0.2)',borderRadius:6,borderLeft:`3px solid ${r?.color||PSY.amber}`}}>{r?.summary||'Carga los datos.'}</div>
          <div style={{marginTop:9,display:'flex',alignItems:'center',gap:10}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,padding:'5px 14px',borderRadius:5,fontWeight:700,background:r?.actionBg||'rgba(42,53,64,0.5)',color:r?.color||PSY.txt2,border:`1px solid ${r?.color||PSY.border}55`}}>{r?.action||'— CARGAR —'}</span><div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:PSY.txt2}}>Confianza: {r?.conf||'—'}%</div><div style={{height:4,borderRadius:2,background:'#1a2530',marginTop:4,width:130}}><div style={{height:'100%',borderRadius:2,background:r?.color||PSY.txt2,width:`${r?.conf||0}%`,transition:'width .5s'}}></div></div></div></div>
        </div>
        {/* Vol bars */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}>
          {[{l:'VOL COMPRA (TAKER BUY)',v:r?fmtBig(r.b10):'—',c:PSY.teal,w:r?(r.bRatio*100):50},{l:'VOL VENTA (TAKER SELL)',v:r?fmtBig(r.s10):'—',c:PSY.red,w:r?((1-r.bRatio)*100):50},{l:'RATIO BUY/SELL',v:r?`${(r.bRatio*100).toFixed(1)}% / ${(100-r.bRatio*100).toFixed(1)}%`:'—',c:r?r.bRatio>.55?PSY.teal:r.bRatio<.45?PSY.red:PSY.amber:PSY.amber,w:r?(r.bRatio*100):50}].map(({l,v,c,w})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'8px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:4}}>{l}</div><div style={{fontSize:14,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c,marginBottom:3}}>{v}</div><div style={{height:5,background:'#1a2530',borderRadius:3}}><div style={{height:5,borderRadius:3,background:c,width:`${w}%`,transition:'width .5s'}}></div></div></div>
          ))}
        </div>
        {/* Metrics */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
          {[{l:'CVD TOTAL',v:r?(r.cvdNow>=0?'+':'')+fmtBig(r.cvdNow):'—',s:'Acumulado',c:r?.cvdNow>=0?PSY.teal:PSY.red},{l:'CVD CAMBIO',v:r?(r.cvdChg>=0?'+':'')+fmtBig(r.cvdChg):'—',s:'Últimas 10 velas',c:r?.cvdChg>=0?PSY.teal:PSY.red},{l:'DELTA ÚLTIMA',v:r?(r.deltaNow>=0?'+':'')+fmtBig(r.deltaNow):'—',s:'Buy − Sell',c:r?.deltaNow>=0?PSY.teal:PSY.red},{l:'VOL TOTAL',v:r?fmtBig(r.tot):'—',s:'Últimas 10 velas',c:PSY.txt2}].map(({l,v,s,c})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'7px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1.5,marginBottom:2}}>{l}</div><div style={{fontSize:16,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div><div style={{fontSize:9,marginTop:1,color:PSY.txt2}}>{s}</div></div>
          ))}
        </div>
        {/* Charts */}
        {[{ref:pCanvas,lbl:`PRECIO · ${sym} · ${r?.src||'—'}`},{ref:cCanvas,lbl:'CVD ACUMULADO · Delta por vela'}].map(({ref,lbl},i)=>(
          <div key={i} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,overflow:'hidden',marginBottom:8}}>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 11px 2px'}}>{lbl}</div>
            {r?<canvas ref={ref} style={{display:'block',width:'100%'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:90,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#1a2530',letterSpacing:2}}>— SIN DATOS —</div>}
          </div>
        ))}
        {/* Divergencias */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{t:'DIVERGENCIA ALCISTA CVD',v:r?.divB?'✓ DETECTADA':'NO DETECTADA',c:r?.divB?PSY.teal:'#2a3540',d:'Precio mínimos más bajos pero CVD mínimos más altos — compradores absorbiendo'},{t:'DIVERGENCIA BAJISTA CVD',v:r?.divBr?'✓ DETECTADA':'NO DETECTADA',c:r?.divBr?PSY.red:'#2a3540',d:'Precio máximos más altos pero CVD máximos más bajos — vendedores distribuyendo'}].map(({t,v,c,d})=>(
            <div key={t} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'9px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,color:PSY.txt2,marginBottom:5}}>{t}</div><div style={{fontSize:12,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:PSY.txt2,marginTop:2,lineHeight:1.4}}>{d}</div></div>
          ))}
        </div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 0',marginTop:8}}>{status}</div>
      </div>
    </div>
  );
}
