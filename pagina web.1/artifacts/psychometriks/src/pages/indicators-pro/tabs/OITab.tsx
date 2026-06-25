// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/OITab.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { drawOIHistory } from '../shared/drawCharts';
import { fmtPrice, fmtPct, fmtBig, fmtFund } from '../shared/types';
interface Props { sym: string; triggerLoad: number; }
export default function OITab({ sym, triggerLoad }: Props) {
  const [spot,setSpot]=useState<number|null>(null);const [spotChg,setSpotChg]=useState<number|null>(null);
  const [spotSrcs,setSpotSrcs]=useState<string[]>([]);const [status,setStatus]=useState('Presiona CARGAR');
  const [r,setR]=useState<any>(null);const oiCanvas=useRef<HTMLCanvasElement>(null);
  const PSY={teal:'#00e6b4',red:'#e05555',amber:'#e6b400',bg2:'#0d1318',border:'#2a3540',txt2:'#6a8a9a'};
  const load=useCallback(async()=>{
    setStatus('Cargando OI para '+sym+'...');
    try{
      const tasks=[fetchSpot(sym)];
      const oiP=fetchOIData(sym);
      const[sr]=await Promise.allSettled(tasks);
      let sv:number|null=null,chg:number|null=null;
      if(sr.status==='fulfilled'&&sr.value.length){const b=getBestSpot(sr.value)!;sv=b.price;chg=b.chg;setSpot(b.price);setSpotChg(b.chg);setSpotSrcs(sr.value.map(x=>`${x.src}: ${fmtPrice(x.price)}`));}
      const oid=await oiP;
      const{bybit,okx,binance,lsRatio,oiHist}=oid;
      const oiVals=[bybit?.oi,okx?.oi,binance?.oi].filter(v=>v&&v>0) as number[];
      const totalOI=oiVals.reduce((a,b)=>a+b,0);
      const fVals=[bybit?.fund,okx?.fund,binance?.fund].filter(v=>v!=null) as number[];
      const avgF=fVals.length?fVals.reduce((a,b)=>a+b,0)/fVals.length:null;
      const priceUp=(chg||0)>0;
      const oiUp=oiHist.length>2&&oiHist[oiHist.length-1].oi>oiHist[0].oi;
      const oiChgPct=oiHist.length>1?((oiHist[oiHist.length-1].oi-oiHist[0].oi)/oiHist[0].oi*100):0;
      let regime='',regimeCol=PSY.amber,cls='neutral',action='',actionBg='',summary='',conf=60;
      if(priceUp&&oiUp){regime='LONGS NUEVOS';regimeCol=PSY.teal;cls='bull';action='BUSCAR LONGS';actionBg='rgba(0,230,180,0.15)';conf=82;summary=`Precio subiendo y OI aumentando — capital nuevo en longs. Régimen más alcista. Funding ${avgF!=null?fmtFund(avgF):'—'}. OI total: $${fmtBig(totalOI)}.`;}
      else if(priceUp&&!oiUp){regime='SHORT SQUEEZE';regimeCol=PSY.amber;cls='neutral';action='TOMAR PARCIALES';actionBg='rgba(230,180,0,0.1)';conf=70;summary=`Precio sube pero OI cae — shorts siendo liquidados. Rally puede ser técnico sin respaldo.`;}
      else if(!priceUp&&oiUp){regime='SHORTS NUEVOS';regimeCol=PSY.red;cls='bear';action='BUSCAR SHORTS';actionBg='rgba(224,85,85,0.15)';conf=82;summary=`Precio cayendo y OI aumentando — capital nuevo en shorts. Régimen bajista confirmado.`;}
      else{regime='LIQUIDACIÓN';regimeCol=PSY.red;cls='danger';action='NO OPERAR';actionBg='rgba(224,85,85,0.1)';conf=65;summary=`Liquidaciones en curso o longs cerrando. No abrir posiciones nuevas.`;}
      let fSig='',fCol=PSY.txt2,fDesc='';
      if(avgF==null){fSig='SIN DATOS';fCol=PSY.txt2;fDesc='No se pudo obtener funding.';}
      else if(avgF>0.05){fSig='LONGS SOBRECARGADOS';fCol=PSY.red;fDesc='Funding muy alto — riesgo de flush de longs.';}
      else if(avgF>0.01){fSig='SESGO ALCISTA';fCol=PSY.teal;fDesc='Funding positivo moderado — mercado ligeramente largo.';}
      else if(avgF>-0.01){fSig='NEUTRAL';fCol=PSY.amber;fDesc='Funding neutro — mercado equilibrado.';}
      else if(avgF>-0.05){fSig='SESGO BAJISTA';fCol=PSY.red;fDesc='Funding negativo — mercado ligeramente corto.';}
      else{fSig='SHORTS SOBRECARGADOS';fCol=PSY.teal;fDesc='Funding muy negativo — posible short squeeze.';}
      setR({bybit,okx,binance,lsRatio,oiHist,totalOI,avgF,regime,regimeCol,cls,action,actionBg,summary,conf,fSig,fCol,fDesc,oiChgPct,oiUp,priceUp,oiHistory:oiHist.map(h=>h.oi*(sv||bybit?.price||1))});
      setStatus(`✓ OI cargado · ${sym}`);
    }catch(e:any){setStatus('✗ '+e.message);}
  },[sym]);
  useEffect(()=>{if(triggerLoad>0)load();},[triggerLoad]);
  useEffect(()=>{if(r?.oiHistory?.length>1&&oiCanvas.current)drawOIHistory(oiCanvas.current,r.oiHistory);},[r]);
  return(
    <div>
      <div style={{background:'#0a0f14',borderBottom:'1px solid #2a3540',padding:'7px 18px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,marginBottom:2}}><span style={{width:7,height:7,borderRadius:'50%',background:spot?PSY.teal:PSY.amber,display:'inline-block',marginRight:5}}></span>PRECIO SPOT</div>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:20,fontWeight:700,color:PSY.teal}}>{spot?fmtPrice(spot):'—'}</span>{spotChg!==null&&<span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:spotChg>=0?PSY.teal:PSY.red}}>{fmtPct(spotChg)} 24h</span>}</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:3}}>{spotSrcs.map(s=><span key={s} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,padding:'2px 6px',borderRadius:3,border:'1px solid rgba(0,230,180,0.35)',color:PSY.teal,background:'rgba(0,230,180,0.04)'}}>{s}</span>)}</div></div>
      </div>
      <div style={{padding:'12px 18px'}}>
        <div style={{borderRadius:10,padding:'16px 18px',marginBottom:12,border:`2px solid ${r?.regimeCol||PSY.amber}`,background:r?.cls==='bull'?'rgba(0,230,180,0.05)':r?.cls==='bear'||r?.cls==='danger'?'rgba(224,85,85,0.05)':'rgba(230,180,0,0.04)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginBottom:10}}>
            <div><div style={{fontSize:24,fontWeight:900,letterSpacing:2,color:r?.regimeCol||PSY.amber}}>{r?.regime||'ESPERANDO...'}</div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,opacity:.6,letterSpacing:2,marginTop:3}}>{sym}/USDT · PERPS · PSY-OI</div></div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",textAlign:'right'}}><div style={{fontSize:18,fontWeight:900,color:r?.regimeCol||PSY.amber}}>{r?'$'+fmtBig(r.totalOI):'—'}</div><div style={{fontSize:9,opacity:.6,letterSpacing:1}}>OI TOTAL USD</div><div style={{fontSize:10,marginTop:3,color:r?.avgF>0?PSY.red:r?.avgF<0?PSY.teal:PSY.amber,fontFamily:"'Share Tech Mono',monospace"}}>Funding: {r?.avgF!=null?fmtFund(r.avgF):'—'}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
            {[{l:'OI CAMBIO',v:r?(r.oiChgPct>=0?'+':'')+r.oiChgPct.toFixed(2)+'% 24h':'—',c:r?.oiUp?PSY.teal:PSY.red},{l:'FUNDING',v:r?.avgF!=null?fmtFund(r.avgF):'—',c:r?.avgF>0?PSY.red:r?.avgF<0?PSY.teal:PSY.amber},{l:'PRECIO/OI',v:r?(r.priceUp?'Precio ↑':'Precio ↓'):'—',c:r?.priceUp?PSY.teal:PSY.red},{l:'PRESIÓN',v:r?.lsRatio?(r.lsRatio.buy>r.lsRatio.sell?'LONGS':'SHORTS'):'—',c:r?.lsRatio?(r.lsRatio.buy>r.lsRatio.sell?PSY.teal:PSY.red):PSY.txt2}].map(({l,v,c})=>(
              <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'7px 9px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:12,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div></div>
            ))}
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:'#c8d8e0',padding:'9px 11px',background:'rgba(0,0,0,0.2)',borderRadius:6,borderLeft:`3px solid ${r?.regimeCol||PSY.amber}`}}>{r?.summary||'Carga los datos.'}</div>
          <div style={{marginTop:9,display:'flex',alignItems:'center',gap:10}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,padding:'5px 14px',borderRadius:5,fontWeight:700,background:r?.actionBg||'rgba(42,53,64,0.5)',color:r?.regimeCol||PSY.txt2,border:`1px solid ${r?.regimeCol||PSY.border}55`}}>{r?.action||'— CARGAR —'}</span><div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:PSY.txt2}}>Confianza: {r?.conf||'—'}%</div><div style={{height:4,borderRadius:2,background:'#1a2530',marginTop:4,width:130}}><div style={{height:'100%',borderRadius:2,background:r?.regimeCol||PSY.txt2,width:`${r?.conf||0}%`,transition:'width .5s'}}></div></div></div></div>
        </div>
        {/* Exchange cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}>
          {[{name:'BYBIT PERPS',d:r?.bybit},{name:'OKX PERPS',d:r?.okx},{name:'BINANCE FUTURES',d:r?.binance}].map(({name,d})=>(
            <div key={name} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'8px 11px'}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:3}}>{name}</div>
              <div style={{fontSize:15,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:d?PSY.teal:PSY.red}}>{d?'$'+fmtBig(d.oi):'NO DISP.'}</div>
              {d?.fund!=null&&<div style={{fontSize:10,fontFamily:"'Share Tech Mono',monospace",color:d.fund>0?PSY.teal:PSY.red}}>Funding: {fmtFund(d.fund)}</div>}
            </div>
          ))}
        </div>
        {/* Metrics */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
          {[{l:'OI TOTAL',v:r?'$'+fmtBig(r.totalOI):'—',s:'USD consolidado',c:PSY.teal},{l:'FUNDING AVG',v:r?.avgF!=null?fmtFund(r.avgF):'—',s:'Promedio exchanges',c:r?.avgF>0?PSY.red:r?.avgF<0?PSY.teal:PSY.amber},{l:'LONGS/SHORTS',v:r?.lsRatio?`${(r.lsRatio.buy*100).toFixed(1)}% / ${(r.lsRatio.sell*100).toFixed(1)}%`:'—',s:'Ratio Bybit',c:r?.lsRatio?(r.lsRatio.buy>r.lsRatio.sell?PSY.teal:PSY.red):PSY.txt2},{l:'OI 24h',v:r?(r.oiChgPct>=0?'+':'')+r.oiChgPct.toFixed(2)+'%':'—',s:'Cambio OI',c:r?.oiUp?PSY.teal:PSY.red}].map(({l,v,s,c})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'7px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1.5,marginBottom:2}}>{l}</div><div style={{fontSize:16,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div><div style={{fontSize:9,marginTop:1,color:PSY.txt2}}>{s}</div></div>
          ))}
        </div>
        {/* Regime + Funding boxes */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
          {[{title:'REGIME OI + PRECIO',val:r?.regime||'—',col:r?.regimeCol||PSY.txt2,desc:r?.cls==='bull'?'Precio sube + OI sube = longs nuevos entrando':r?.cls==='bear'?'Precio baja + OI sube = shorts nuevos entrando':r?.regime==='SHORT SQUEEZE'?'Precio sube + OI baja = shorts cerrando':'Precio baja + OI baja = liquidaciones',conf:r?.conf||0},
           {title:'SEÑAL FUNDING',val:r?.fSig||'—',col:r?.fCol||PSY.txt2,desc:r?.fDesc||'—',conf:Math.min(100,Math.abs(r?.avgF||0)*500+30)}].map(({title,val,col,desc,conf})=>(
            <div key={title} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'10px 12px'}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,color:PSY.txt2,marginBottom:5}}>{title}</div>
              <div style={{fontSize:13,fontWeight:700,color:col}}>{val}</div>
              <div style={{fontSize:10,color:PSY.txt2,marginTop:3,lineHeight:1.5}}>{desc}</div>
              <div style={{height:3,borderRadius:2,marginTop:6,background:col,width:`${conf}%`,transition:'width .5s'}}></div>
            </div>
          ))}
        </div>
        {/* OI History chart */}
        <div style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,overflow:'hidden',marginBottom:8}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 11px 2px'}}>OI HISTÓRICO · Bybit Perps (últimas 24h)</div>
          {r?.oiHistory?.length>1?<canvas ref={oiCanvas} style={{display:'block',width:'100%'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:90,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#1a2530',letterSpacing:2}}>— SIN DATOS —</div>}
        </div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 0',marginTop:6}}>{status}</div>
      </div>
    </div>
  );
}
async function fetchOIData(sym:string){
  const res:any={bybit:null,okx:null,binance:null,lsRatio:null,oiHist:[]};
  const sp=sym+'USDT';
  await Promise.allSettled([
    fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${sp}`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).then(d=>{const t=d?.result?.list?.[0];if(t)res.bybit={oi:+t.openInterestValue,fund:+t.fundingRate*100,price:+t.lastPrice};}).catch(()=>{}),
    Promise.allSettled([fetch(`https://www.okx.com/api/v5/public/open-interest?instId=${sym}-USDT-SWAP`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()),fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${sym}-USDT-SWAP`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json())]).then(([oR,fR])=>{const oD=oR.status==='fulfilled'?oR.value:null;const fD=fR.status==='fulfilled'?fR.value:null;if(oD?.data?.[0]){const oi=+oD.data[0].oiCcy*1;const fund=fD?.data?.[0]?+fD.data[0].fundingRate*100:null;res.okx={oi,fund};}}).catch(()=>{}),
    Promise.allSettled([fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${sp}`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()),fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${sp}&limit=1`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json())]).then(([oR,fR])=>{if(oR.status==='fulfilled'&&oR.value?.openInterest){const fund=fR.status==='fulfilled'&&fR.value?.[0]?+fR.value[0].fundingRate*100:null;res.binance={oi:+oR.value.openInterest,fund};}}).catch(()=>{}),
    fetch(`https://api.bybit.com/v5/market/account-ratio?category=linear&symbol=${sp}&period=1h&limit=1`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).then(d=>{const i=d?.result?.list?.[0];if(i)res.lsRatio={buy:+i.buyRatio,sell:+i.sellRatio};}).catch(()=>{}),
    fetch(`https://api.bybit.com/v5/market/open-interest?category=linear&symbol=${sp}&intervalTime=1h&limit=24`,{signal:AbortSignal.timeout(6000)}).then(r=>r.json()).then(d=>{if(d?.result?.list)res.oiHist=d.result.list.reverse().map((i:any)=>({oi:+i.openInterest,ts:+i.timestamp}));}).catch(()=>{}),
  ]);
  return res;
}
