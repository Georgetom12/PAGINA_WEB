// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/LiqMapTab.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { calcLiqZones } from '../shared/calcIndicators';
import { drawLiqHeatmap } from '../shared/drawCharts';
import { fmtPrice, fmtPct } from '../shared/types';
interface Props { sym: string; triggerLoad: number; }
export default function LiqMapTab({ sym, triggerLoad }: Props) {
  const [spot,setSpot]=useState<number|null>(null);const [spotChg,setSpotChg]=useState<number|null>(null);const [spotSrcs,setSpotSrcs]=useState<string[]>([]);
  const [lev,setLev]=useState(25);const [status,setStatus]=useState('Presiona CARGAR');const [r,setR]=useState<any>(null);
  const hCanvas=useRef<HTMLCanvasElement>(null);
  const PSY={teal:'#00e6b4',red:'#e05555',amber:'#e6b400',bg2:'#0d1318',border:'#2a3540',txt2:'#6a8a9a'};
  const load=useCallback(async()=>{
    setStatus('Cargando LiqMap para '+sym+'...');
    try{
      const res=await fetchSpot(sym);
      if(res.length){
        const b=getBestSpot(res)!;setSpot(b.price);setSpotChg(b.chg);setSpotSrcs(res.map(x=>`${x.src}: ${fmtPrice(x.price)}`));
        const price=b.price;const zones=calcLiqZones(price);
        const d=(v:number)=>v<0.0001?8:v<0.01?6:v<1?5:v<100?4:2;
        const fmt2=(v:number)=>'$'+v.toLocaleString('en-US',{maximumFractionDigits:d(v)});
        const fPct=(v:number)=>(v>=0?'+':'')+v.toFixed(2)+'%';
        const selL=zones.longs.find(z=>z.lev===lev);const selS=zones.shorts.find(z=>z.lev===lev);
        const dL=selL?Math.abs((price-selL.price)/price*100):99;const dS=selS?Math.abs((price-selS.price)/price*100):99;
        const closerSide=dL<dS?'LONGS':'SHORTS';const closerDist=Math.min(dL,dS);
        const nearL=dL<3,nearS=dS<3;
        let verdict='',cls='neutral',color=PSY.amber,action='',actionBg='',summary='',conf=65;
        if(nearL){verdict='PELIGRO LONGS';cls='bear';color=PSY.red;action='CUIDADO LONG';actionBg='rgba(224,85,85,0.12)';conf=80;summary=`Precio a solo ${dL.toFixed(2)}% de zona de liquidación longs ×${lev} (${fmt2(selL?.price||0)}). Posible stop hunt bajista antes de continuar.`;}
        else if(nearS){verdict='PELIGRO SHORTS';cls='bull';color=PSY.teal;action='CUIDADO SHORT';actionBg='rgba(0,230,180,0.12)';conf=80;summary=`Precio a solo ${dS.toFixed(2)}% de zona liq. shorts ×${lev} (${fmt2(selS?.price||0)}). Posible stop hunt alcista.`;}
        else{verdict='ZONA SEGURA';cls='neutral';color=PSY.amber;action='OBSERVAR';actionBg='rgba(230,180,0,0.1)';conf=55;summary=`Longs ×${lev}: ${fmt2(selL?.price||0)} (${dL.toFixed(1)}% abajo). Shorts ×${lev}: ${fmt2(selS?.price||0)} (${dS.toFixed(1)}% arriba). Sin riesgo inmediato.`;}
        setR({price,zones,selL,selS,dL,dS,closerSide,closerDist,verdict,cls,color,action,actionBg,summary,conf,fmt2,fPct});
        setStatus(`✓ LiqMap · ${sym} · Spot: ${fmt2(price)}`);
      }
    }catch(e:any){setStatus('✗ '+e.message);}
  },[sym,lev]);
  useEffect(()=>{if(triggerLoad>0)load();},[triggerLoad]);
  useEffect(()=>{if(r&&hCanvas.current)drawLiqHeatmap(hCanvas.current,r.price,r.zones.longs,r.zones.shorts);},[r]);
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
            <div><div style={{fontSize:24,fontWeight:900,letterSpacing:2,color:r?.color||PSY.amber}}>{r?.verdict||'ESPERANDO...'}</div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,opacity:.6,letterSpacing:2,marginTop:3}}>{sym}/USDT · ×{lev} · PSY-LIQMAP</div></div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",textAlign:'right'}}><div style={{fontSize:18,fontWeight:900,color:r?.color||PSY.amber}}>{r?(r.closerSide==='LONGS'?r.fmt2(r.selL?.price||0):r.fmt2(r.selS?.price||0)):'—'}</div><div style={{fontSize:9,opacity:.6,letterSpacing:1}}>ZONA MÁS CERCANA</div><div style={{fontSize:10,marginTop:3,color:PSY.txt2}}>Distancia: {r?r.closerDist.toFixed(2)+'% · '+r.closerSide:'—'}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
            {[{l:'LONGS LIQ',v:r?r.fmt2(r.selL?.price||0):'—',c:PSY.red},{l:'SHORTS LIQ',v:r?r.fmt2(r.selS?.price||0):'—',c:PSY.teal},{l:'PELIGRO',v:r?r.closerDist<3?'CRÍTICO':r.closerDist<7?'ALERTA':'NORMAL':'—',c:r?r.closerDist<3?PSY.red:r.closerDist<7?PSY.amber:PSY.teal:PSY.txt2},{l:'ATRACCIÓN',v:r?r.closerSide+' '+r.closerDist.toFixed(1)+'%':'—',c:r?.closerSide==='LONGS'?PSY.red:PSY.teal}].map(({l,v,c})=>(
              <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'7px 9px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:12,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div></div>
            ))}
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:'#c8d8e0',padding:'9px 11px',background:'rgba(0,0,0,0.2)',borderRadius:6,borderLeft:`3px solid ${r?.color||PSY.amber}`}}>{r?.summary||'Carga los datos.'}</div>
          <div style={{marginTop:9,display:'flex',alignItems:'center',gap:10}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,padding:'5px 14px',borderRadius:5,fontWeight:700,background:r?.actionBg||'rgba(42,53,64,0.5)',color:r?.color||PSY.txt2,border:`1px solid ${r?.color||PSY.border}55`}}>{r?.action||'— CARGAR —'}</span><div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:PSY.txt2}}>Confianza: {r?.conf||'—'}%</div><div style={{height:4,borderRadius:2,background:'#1a2530',marginTop:4,width:130}}><div style={{height:'100%',borderRadius:2,background:r?.color||PSY.txt2,width:`${r?.conf||0}%`,transition:'width .5s'}}></div></div></div></div>
        </div>
        <div style={{marginBottom:10,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2}}>APALANCAMIENTO:</span>
          <select value={lev} onChange={e=>setLev(+e.target.value)} style={{background:PSY.bg2,color:'#c8d8e0',border:`1px solid ${PSY.border}`,borderRadius:5,padding:'4px 8px',fontFamily:"'Share Tech Mono',monospace",fontSize:10}}>
            <option value={10}>×10</option><option value={25}>×25</option><option value={50}>×50</option><option value={100}>×100</option>
          </select>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
          {[{l:'LIQ LONGS ×10',v:r?r.fmt2(r.zones.longs.find((z:any)=>z.lev===10)?.price||0):'—',c:PSY.red},{l:'LIQ LONGS ×25',v:r?r.fmt2(r.zones.longs.find((z:any)=>z.lev===25)?.price||0):'—',c:PSY.red},{l:'LIQ SHORTS ×25',v:r?r.fmt2(r.zones.shorts.find((z:any)=>z.lev===25)?.price||0):'—',c:PSY.teal},{l:'LIQ SHORTS ×10',v:r?r.fmt2(r.zones.shorts.find((z:any)=>z.lev===10)?.price||0):'—',c:PSY.teal}].map(({l,v,c})=>(
            <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'7px 11px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:14,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c}}>{v}</div><div style={{fontSize:9,marginTop:1,color:PSY.txt2}}>Precio liquidación</div></div>
          ))}
        </div>
        <div style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,overflow:'hidden',marginBottom:8}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 11px 2px'}}>LIQUIDATION HEATMAP · Precio vs Zonas de Liquidación</div>
          {r?<canvas ref={hCanvas} style={{display:'block',width:'100%'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#1a2530',letterSpacing:2}}>— SIN DATOS —</div>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{t:'☠ LIQUIDACIONES DE LONGS (precio cae)',list:r?.zones.longs,c:PSY.red},{t:'☠ LIQUIDACIONES DE SHORTS (precio sube)',list:r?.zones.shorts,c:PSY.teal}].map(({t,list,c})=>(
            <div key={t} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'9px 11px'}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,color:c,marginBottom:5}}>{t}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,lineHeight:2}}>
                {list?.filter((z:any)=>z.price>0).map((z:any)=><div key={z.lev}><span style={{color:`rgba(${c==='#00e6b4'?'0,230,180':'224,85,85'},${0.4+z.lev/150})`}}>×{z.lev} → {r.fmt2(z.price)}</span><span style={{color:PSY.txt2}}> ({r.fPct(z.pct)})</span></div>)||null}
              </div>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 0',marginTop:8}}>{status}</div>
      </div>
    </div>
  );
}
