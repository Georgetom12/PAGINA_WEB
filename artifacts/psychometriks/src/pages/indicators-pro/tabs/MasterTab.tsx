// Ruta: artifacts/psychometriks/src/pages/indicators/tabs/MasterTab.tsx
import { useState, useCallback } from 'react';
import { fetchSpot, getBestSpot } from '../shared/fetchSpot';
import { fetchCandles } from '../shared/fetchCandles';
import { calcADX, calcRSI, calcMACD } from '../shared/calcIndicators';
import { fmtPrice, fmtPct, MASTER_SYMBOLS, type TF } from '../shared/types';
interface Props { triggerLoad: number; }
interface CardData {
  sym: string; price: number|null; chg: number|null;
  adx: number|null; rsi: number|null; macdBull: boolean|null;
  verdict: string; color: string; cls: string;
  miniPrices: number[];
}
export default function MasterTab({ triggerLoad }: Props) {
  const [tf,setTf]=useState<TF>('1h');
  const [cards,setCards]=useState<CardData[]>([]);
  const [loading,setLoading]=useState(false);
  const [status,setStatus]=useState('Presiona CARGAR TODOS para analizar todos los pares');
  const [ts,setTs]=useState('—');
  const PSY={teal:'#00e6b4',red:'#e05555',amber:'#e6b400',bg2:'#0d1318',bg3:'#0a0f14',border:'#2a3540',txt2:'#6a8a9a'};

  const loadCard=async(sym:string,tf:TF):Promise<CardData>=>{
    try{
      const[sr,cr]=await Promise.allSettled([fetchSpot(sym),fetchCandles(sym,tf,120)]);
      let price:number|null=null,chg:number|null=null;
      if(sr.status==='fulfilled'&&sr.value.length){const b=getBestSpot(sr.value)!;price=b.price;chg=b.chg;}
      let adx:number|null=null,rsi:number|null=null,macdBull:boolean|null=null,miniPrices:number[]=[];
      let verdict='NEUTRAL',color=PSY.amber,cls='neutral';
      if(cr.status==='fulfilled'){
        const{candles}=cr.value;
        const C=candles.map(c=>c.c),H=candles.map(c=>c.h),L=candles.map(c=>c.l);
        miniPrices=C.slice(-30);
        // ADX
        try{
          const period=14;const TR:number[]=[],PDM:number[]=[],MDM:number[]=[];
          for(let i=1;i<C.length;i++){TR.push(Math.max(H[i]-L[i],Math.abs(H[i]-C[i-1]),Math.abs(L[i]-C[i-1])));const up=H[i]-H[i-1],dn=L[i-1]-L[i];PDM.push(up>dn&&up>0?up:0);MDM.push(dn>up&&dn>0?dn:0);}
          const w=(a:number[],p:number)=>{let s=0;for(let i=0;i<p;i++)s+=a[i];const o=[s];for(let i=p;i<a.length;i++){s=s-s/p+a[i];o.push(s);}return o;};
          const atr=w(TR,period),pDM=w(PDM,period),mDM=w(MDM,period);
          const DIp:number[]=[],DIm:number[]=[],DX:number[]=[];
          for(let i=0;i<atr.length;i++){const dp=atr[i]>0?100*pDM[i]/atr[i]:0,dm=atr[i]>0?100*mDM[i]/atr[i]:0;DIp.push(dp);DIm.push(dm);DX.push((dp+dm)>0?100*Math.abs(dp-dm)/(dp+dm):0);}
          let av=0;for(let i=0;i<period;i++)av+=DX[i];av/=period;
          for(let i=period;i<DX.length;i++)av=(av*(period-1)+DX[i])/period;
          const lastDIP=DIp[DIp.length-1],lastDIM=DIm[DIm.length-1];
          adx=av;
          if(av>=25&&lastDIP>lastDIM){verdict='ALCISTA';color=PSY.teal;cls='bull';}
          else if(av>=25&&lastDIP<=lastDIM){verdict='BAJISTA';color=PSY.red;cls='bear';}
          else{verdict='NEUTRAL';color=PSY.amber;cls='neutral';}
        }catch(_){}
        // RSI
        try{const raw=calcRSI(C,14);rsi=raw[raw.length-1];}catch(_){}
        // MACD
        try{
          const k=(a:number[],p:number)=>{const m=2/(p+1);let e=a[0];const o=[e];for(let i=1;i<a.length;i++){e=a[i]*m+e*(1-m);o.push(e);}return o;};
          const f=k(C,12),s=k(C,26),skip=25;
          const mf=f.slice(skip).map((v,i)=>v-s[skip+i]);const sf=k(mf,9);
          macdBull=mf[mf.length-1]>sf[sf.length-1];
        }catch(_){}
      }
      return{sym,price,chg,adx,rsi,macdBull,verdict,color,cls,miniPrices};
    }catch(_){return{sym,price:null,chg:null,adx:null,rsi:null,macdBull:null,verdict:'ERROR',color:PSY.txt2,cls:'neutral',miniPrices:[]};}
  };

  const loadAll=useCallback(async()=>{
    setLoading(true);setStatus('Cargando '+MASTER_SYMBOLS.length+' pares...');
    setCards(MASTER_SYMBOLS.map(s=>({sym:s,price:null,chg:null,adx:null,rsi:null,macdBull:null,verdict:'...',color:PSY.txt2,cls:'neutral',miniPrices:[]})));
    const batchSize=4;
    for(let i=0;i<MASTER_SYMBOLS.length;i+=batchSize){
      const batch=MASTER_SYMBOLS.slice(i,i+batchSize);
      const results=await Promise.all(batch.map(s=>loadCard(s,tf)));
      setCards(prev=>{const next=[...prev];results.forEach(r=>{const idx=next.findIndex(c=>c.sym===r.sym);if(idx>=0)next[idx]=r;});return next;});
    }
    setLoading(false);setTs(new Date().toLocaleTimeString('es-EC'));
    setStatus(`✓ ${MASTER_SYMBOLS.length} pares analizados · ${tf.toUpperCase()}`);
  },[tf]);

  const MiniChart=({prices,color}:{prices:number[],color:string})=>{
    if(!prices.length)return null;
    const W=260,H=40;const mn=Math.min(...prices)*0.999,mx=Math.max(...prices)*1.001,rng=mx-mn||1;
    const n=prices.length;
    const pts=prices.map((p,i)=>`${i/(n-1)*(W-2)+1},${H-2-(p-mn)/rng*(H-4)}`).join(' ');
    const fillPts=`1,${H-2} `+pts+` ${W-1},${H-2}`;
    const col=color==='#00e6b4'?'rgba(0,230,180,':'color==='#e05555'?'rgba(224,85,85,':'rgba(230,180,0,';
    return(
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{display:'block',marginTop:6}}>
        <polygon points={fillPts} fill={col+'0.12)'} />
        <polyline points={pts} fill="none" stroke={col+'0.85)'} strokeWidth="1.5"/>
      </svg>
    );
  };

  return(
    <div>
      <div style={{background:PSY.bg3,borderBottom:`1px solid ${PSY.border}`,padding:'10px 18px',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.amber,letterSpacing:1}}>⭐ MASTER — ANÁLISIS MULTI-PAR</span>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2}}>TF:</span>
        <select value={tf} onChange={e=>setTf(e.target.value as TF)} style={{background:PSY.bg2,color:'#c8d8e0',border:`1px solid ${PSY.border}`,borderRadius:5,padding:'4px 8px',fontFamily:"'Share Tech Mono',monospace",fontSize:10}}>
          <option value="15m">15min</option><option value="1h">1h</option><option value="4h">4h</option><option value="1d">1d</option>
        </select>
        <button onClick={loadAll} disabled={loading}
          style={{background:'rgba(0,230,180,0.1)',border:'1px solid rgba(0,230,180,0.3)',color:PSY.teal,fontFamily:"'Share Tech Mono',monospace",fontSize:10,padding:'5px 14px',borderRadius:5,cursor:loading?'not-allowed':'pointer',opacity:loading?.5:1}}>
          {loading?'⟳ CARGANDO...':'⟳ CARGAR TODOS'}
        </button>
        <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2}}>{ts!=='—'?`Actualizado: ${ts}`:''}</span>
      </div>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'4px 18px',borderBottom:`1px solid #1a2530`}}>{status}</div>

      {/* Summary stats */}
      {cards.length>0&&!loading&&(()=>{
        const bulls=cards.filter(c=>c.cls==='bull').length;
        const bears=cards.filter(c=>c.cls==='bear').length;
        const neuts=cards.filter(c=>c.cls==='neutral'&&c.verdict!=='...').length;
        return(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,padding:'10px 18px',borderBottom:`1px solid #1a2530`}}>
            {[{l:'ALCISTAS',v:bulls,c:PSY.teal},{l:'BAJISTAS',v:bears,c:PSY.red},{l:'NEUTRALES',v:neuts,c:PSY.amber}].map(({l,v,c})=>(
              <div key={l} style={{background:PSY.bg2,border:`1px solid ${PSY.border}`,borderRadius:7,padding:'10px',textAlign:'center'}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,marginBottom:4}}>{l}</div>
                <div style={{fontSize:28,fontWeight:900,fontFamily:"'Share Tech Mono',monospace",color:c}}>{v}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Cards grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10,padding:'12px 18px'}}>
        {cards.length===0?(
          <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',justifyContent:'center',height:200,fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#2a3540',letterSpacing:2}}>
            Presiona CARGAR TODOS para analizar {MASTER_SYMBOLS.length} pares
          </div>
        ):cards.map(card=>(
          <div key={card.sym} style={{background:PSY.bg2,border:`1px solid ${card.color==='#00e6b4'?'rgba(0,230,180,0.35)':card.color==='#e05555'?'rgba(224,85,85,0.3)':'rgba(230,180,0,0.2)'}`,borderRadius:9,overflow:'hidden',transition:'border-color .3s'}}>
            {/* Card header */}
            <div style={{padding:'9px 12px',borderBottom:`1px solid ${PSY.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:12,fontWeight:700,color:PSY.teal}}>{card.sym}/USDT</span>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#c8d8e0'}}>{card.price?fmtPrice(card.price):'—'}</div>
                {card.chg!==null&&<div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:card.chg>=0?PSY.teal:PSY.red}}>{fmtPct(card.chg)}</div>}
              </div>
            </div>
            {/* Card body */}
            <div style={{padding:'9px 12px'}}>
              {card.verdict==='...'?(
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:70,fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:'#2a3540',letterSpacing:2}}>CARGANDO...</div>
              ):(
                <>
                  <MiniChart prices={card.miniPrices} color={card.color}/>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,margin:'7px 0'}}>
                    {[
                      {l:'ADX',v:card.adx?card.adx.toFixed(1):'—',c:card.adx&&card.adx>=25?card.color:PSY.amber},
                      {l:'RSI',v:card.rsi?card.rsi.toFixed(1):'—',c:card.rsi&&card.rsi>=70?PSY.red:card.rsi&&card.rsi<=30?PSY.teal:'#c8d8e0'},
                      {l:'MACD',v:card.macdBull!==null?(card.macdBull?'BULL':'BEAR'):'—',c:card.macdBull?PSY.teal:PSY.red},
                      {l:'TF',v:tf.toUpperCase(),c:PSY.txt2},
                    ].map(({l,v,c})=>(
                      <div key={l} style={{background:'rgba(0,0,0,0.2)',borderRadius:4,padding:'4px 5px',textAlign:'center'}}>
                        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:PSY.txt2,letterSpacing:.5,marginBottom:1}}>{l}</div>
                        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,fontWeight:700,color:c}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{borderRadius:5,padding:'6px 9px',fontFamily:"'Share Tech Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:1,textAlign:'center',background:card.color==='#00e6b4'?'rgba(0,230,180,0.1)':card.color==='#e05555'?'rgba(224,85,85,0.1)':'rgba(230,180,0,0.08)',color:card.color,border:`1px solid ${card.color}44`}}>
                    {card.verdict}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:PSY.txt2,padding:'8px 18px'}}>PSY MASTER v1 · {MASTER_SYMBOLS.length} pares · PSYCHOMETRIKS</div>
    </div>
  );
}
