// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/VolProfileTab.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { fetchCandles } from '../shared/fetchCandles';
import { calcVolumeProfile } from '../shared/calcIndicators';
import { drawVolProfile } from '../shared/drawCharts';
import { fmtPrice, fmtPct, type TF } from '../shared/types';
interface Props { sym: string; tf: TF; triggerLoad: number; }
export default function VolProfileTab({ sym, tf, triggerLoad }: Props) {
  const [spot,setSpot]=useState<number|null>(null);const [spotChg,setSpotChg]=useState<number|null>(null);const [spotSrcs,setSpotSrcs]=useState<string[]>([]);
  const [status,setStatus]=useState('Presiona CARGAR');const [r,setR]=useState<any>(null);
  const mainCanvas=useRef<HTMLCanvasElement>(null);
  const PSY={teal:'#00e6b4',red:'#e05555',amber:'#e6b400',bg2:'#0d1318',border:'#2a3540',txt2:'#6a8a9a'};
  const load=useCallback(async()=>{
    setStatus('Cargando Volume Profile para '+sym+'...');
    try{
      const[sr,cr]=await Promise.allSettled([fetchSpot(sym),fetchCandles(sym,tf,220)]);
      let sv:number|null=null;
      if(sr.status==='fulfilled'&&sr.value.length){const b=getBestSpot(sr.value)!;sv=b.price;setSpot(b.price);setSpotChg(b.chg);setSpotSrcs(sr.value.map(x=>`${x.src}: ${fmtPrice(x.price)}`));}
      if(cr.status==='fulfilled'){
        const{candles,src}=cr.value;
        const profile=calcVolumeProfile(candles,100);
        const price=sv||candles[candles.length-1].c;
        const px=candles.map(c=>c.c),ph=candles.map(c=>c.h),pl=candles.map(c=>c.l);
        const d=(v:number)=>v<0.0001?8:v<0.01?6:v<1?5:v<100?4:2;
        const fmt2=(v:number)=>'$'+v.toLocaleString('en-US',{maximumFractionDigits:d(v)});
        const fPct=(v:number)=>(v>=0?'+':'')+v.toFixed(2)+'%';
        const aboveVAH=price>profile.vah,belowVAL=price<profile.val,abovePOC=price>profile.poc,inVA=price>=profile.val&&price<=profile.vah;
        const vaW=((profile.vah-profile.val)/profile.poc*100).toFixed(2);
        const topHVN=profile.hvns.sort((a:any,b:any)=>b.vol-a.vol).slice(0,6);
        const topLVN=profile.lvns.sort((a:any,b:any)=>a.vol-b.vol).slice(0,6);
        const nearH=topHVN.length?topHVN.reduce((a:any,b:any)=>Math.abs(a.price-price)<Math.abs(b.price-price)?a:b):null;
        let verdict='',cls='neutral',color=PSY.amber,action='',actionBg='',summary='',conf=60;
        if(aboveVAH){verdict='ZONA PREMIUM';cls='bear';color=PSY.red;action='PRECAUCIÓN LONG';actionBg='rgba(224,85,85,0.1)';conf=72;summary=`Precio en zona premium (sobre VAH ${fmt2(profile.vah)}). Alta probabilidad de retorno al Value Area. POC ${fmt2(profile.poc)} es target de retorno.`;}
        else if(belowVAL){verdict='ZONA DESCUENTO';cls='bull';color=PSY.teal;action='BUSCAR LONG';actionBg='rgba(0,230,180,0.12)';conf=72;summary=`Precio en zona de descuento (bajo VAL ${fmt2(profile.val)}). Posible acumulación institucional. POC ${fmt2(profile.poc)} es target al alza.`;}
        else if(inVA&&abovePOC){verdict='VALUE AREA ALTO';cls='neutral';color=PSY.amber;action='NEUTRAL ALCISTA';actionBg='rgba(230,180,0,0.1)';conf=55;summary=`Precio dentro del Value Area, sobre el POC ${fmt2(profile.poc)}. VAH ${fmt2(profile.vah)} es la resistencia clave.`;}
        else{verdict='VALUE AREA BAJO';cls='bull';color=PSY.teal;action='NEUTRAL BAJISTA';actionBg='rgba(0,230,180,0.08)';conf=55;summary=`Precio dentro del Value Area, bajo el POC ${fmt2(profile.poc)}. VAL ${fmt2(profile.val)} es el soporte clave.`;}
        setR({profile,price,px,ph,pl,src,fmt2,fPct,vaW,topHVN,topLVN,nearH,verdict,cls,color,action,actionBg,summary,conf,aboveVAH,belowVAL,abovePOC});
        setStatus(`✓ ${src} · ${candles.length} velas · 100 niveles · ${sym}`);
      }
    }catch(e:any){setStatus('✗ '+e.message);}
  },[sym,tf]);
  useEffect(()=>{if(triggerLoad>0)load();},[triggerLoad]);
  useEffect(()=>{if(r&&mainCanvas.current)drawVolProfile(mainCanvas.current,r.px,r.ph,r.pl,r.profile,spot);},[r,spot]);
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
            <div><div style={{fontSize:24,fontWeight:900,letterSpacing:2,color:r?.color||PSY.amber}}>{r?.verdict||'ESPERANDO...'}</div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,opacity:.6,letterSpacing:2,marginTop:3}}>{sym}/USD · {tf.toUpperCase()} · PSY-VOLPROFILE</div></div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",textAlign:'right'}}><div style={{fontSize:18,fontWeight:900,color:r?.color||PSY.amber}}>{r?r.fmt2(r.profile.poc):'—'}</div><div style={{fontSize:9,opacity:.6,letterSpacing:1}}>POINT OF CONTROL</div><div style={{fontSize:10,marginTop:3,color:PSY.txt2}}>VA: {r?r.fmt2(r.profile.val)+' / '+r.fmt2(r.profile.vah):'— / —'}</div></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:10}}>
            {[{l:'PRECIO vs POC',v:r?r.fPct((r.price-r.profile.poc)/r.profile.poc*100):'—',c:r?.abovePOC?PSY.teal:PSY.red},{l:'ZONA PRECIO',v:r?.aboveVAH?'SOBRE VAH':r?.belowVAL?'BAJO VAL':r?.abovePOC?'VA ALTO':'VA BAJO',c:r?.color||PSY.txt2},{l:'VA WIDTH',v:r?r.vaW+'%':'—',c:PSY.txt2},{l:'HVN CERCANO',v:r?.nearH?r.fmt2(r.nearH.price):'—',c:PSY.teal}].map(({l,v,c})=>(
              <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:6,padding:'7px 9px'}}><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,letterSpacing:1,marginBottom:2}}>{l}</div><div style={{fontSize:12,fontWeight:700,fontFamily:"'Share Tech Mono',monospace",color:c||PSY.txt2}}>{v}</div></div>
            ))}
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:'#c8d8e0',padding:'9px 11px',background:'rgba(0,0,0,0.2)',borderRadius:6,borderLeft:`3px solid ${r?.color||PSY.amber}`}}>{r?.summary||'Carga los datos.'}</div>
          <div style={{marginTop:9,display:'flex',alignItems:'center',gap:10}}><span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,padding:'5px 14px',borderRadius:5,fontWeight:700,background:r?.actionBg||'rgba(42,53,64,0.5)',color:r?.color||PSY.txt2,border:`1px solid ${r?.color||PSY.border}55`}}>{r?.action||'— CARGAR —'}</span><div><div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:PSY.txt2}}>Confianza: {r?.conf||'—'}%</div><div style={{height:4,borderRadius:2,background:'#1a2530',marginTop:4,width:130}}><div style={{height:'100%',borderRadius:2,background:r?.color||PSY.txt2,width:`${r?.conf||0}%`,transition:'width .5s'}}></div></div></div></div>
        </div>
        {/* POC/VAH/VAL cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}>
          {[{l:'VAH · VALUE AREA HIGH',v:r?r.fmt2(r.profile.vah):'—',d:r?r.fPct((r.price-r.profile.vah)/r.profile.vah*100)+' del precio':'—',col:'rgba(224,85,85,0.3)',bg:'rgba(224,85,85,0.06)',tc:PSY.red,desc:'70% del volumen ocurrió bajo este nivel. Resistencia institucional clave.'},
           {l:'POC · POINT OF CONTROL',v:r?r.fmt2(r.profile.poc):'—',d:r?r.fPct((r.price-r.profile.poc)/r.profile.poc*100)+' del precio':'—',col:'rgba(0,230,180,0.4)',bg:'rgba(0,230,180,0.06)',tc:PSY.teal,desc:'Nivel con mayor volumen negociado. El mercado vuelve aquí.'},
           {l:'VAL · VALUE AREA LOW',v:r?r.fmt2(r.profile.val):'—',d:r?r.fPct((r.price-r.profile.val)/r.profile.val*100)+' del precio':'—',col:'rgba(0,230,180,0.25)',bg:'rgba(0,230,180,0.04)',tc:PSY.teal,desc:'70% del volumen ocurrió sobre este nivel. Soporte institucional clave.'}].map(({l,v,d,col,bg,tc,desc})=>(
            <div key={l} style={{borderRadius:7,padding:'10px 12px',border:`1px solid ${col}`,background:bg}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:1.5,color:tc,marginBottom:3}}>{l}</div>
              <div style={{fontSize:18,fontWeight:900,fontFamily:"'Share Tech Mono',monospace",color:tc,lineHeight:1}}>{v}</div>
              <div style={{fontSize:10,marginTop:3,color:PSY.txt2,lineHeight:1.4}}>{desc}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,marginTop:2,color:tc}}>{d}</div>
            </div>
          ))}
        </div>
        {/* Main chart */}
        <div style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,overflow:'hidden',marginBottom:8}}>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 11px 2px'}}>PRICE + VOLUME PROFILE LATERAL · {r?.src||'—'}</div>
          {r?<canvas ref={mainCanvas} style={{display:'block',width:'100%'}}/>:<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:120,fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#1a2530',letterSpacing:2}}>— SIN DATOS —</div>}
        </div>
        {/* HVN LVN */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{t:'HVN · HIGH VOLUME NODES (SOPORTE/RESISTENCIA)',list:r?.topHVN,color:PSY.teal},{t:'LVN · LOW VOLUME NODES (ZONAS DE PASO RÁPIDO)',list:r?.topLVN,color:PSY.amber}].map(({t,list,color})=>(
            <div key={t} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'9px 11px'}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,color:PSY.txt2,marginBottom:5}}>{t}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,lineHeight:1.9,color}}>
                {list?.map((h:any,i:number)=>{const dist=(r.price-h.price)/h.price*100;const abv=r.price>h.price;return<div key={i}><span style={{color:abv?color:`${color}88`}}>{abv?'▲':'▼'} {r.fmt2(h.price)}</span><span style={{color:PSY.txt2}}> ({r.fPct(dist)})</span></div>;})||<span style={{color:'#1a2530'}}>Sin datos</span>}
              </div>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'5px 0',marginTop:8}}>{status}</div>
      </div>
    </div>
  );
}
