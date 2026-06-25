// PSY INDICATORS - Main Page Container
// Ruta: artifacts/psychometriks/src/pages/indicators/IndicatorsPage.tsx

import { useState, useCallback } from 'react';
import ADXTab      from './tabs/ADXTab';
import RSITab      from './tabs/RSITab';
import MACDTab     from './tabs/MACDTab';
import OITab       from './tabs/OITab';
import CVDTab      from './tabs/CVDTab';
import VolProfileTab from './tabs/VolProfileTab';
import LiqMapTab   from './tabs/LiqMapTab';
import MasterTab   from './tabs/MasterTab';
import { SYMBOLS, type TF } from './shared/types';

type TabId = 'adx'|'rsi'|'macd'|'oi'|'cvd'|'vol'|'liq'|'master';

const TABS: { id: TabId; label: string; color?: string }[] = [
  { id:'adx',    label:'ADX' },
  { id:'rsi',    label:'RSI' },
  { id:'macd',   label:'MACD' },
  { id:'oi',     label:'OI + FUNDING' },
  { id:'cvd',    label:'CVD' },
  { id:'vol',    label:'VOL PROFILE' },
  { id:'liq',    label:'LIQ MAP' },
  { id:'master', label:'⭐ MASTER', color:'#e6b400' },
];

export default function IndicatorsPage() {
  const [activeTab,   setActiveTab]   = useState<TabId>('adx');
  const [sym,         setSym]         = useState('BTC');
  const [tf,          setTF]          = useState<TF>('1h');
  const [triggerLoad, setTriggerLoad] = useState(0);
  const [arOn,        setArOn]        = useState(false);
  const [arTimer,     setArTimer]     = useState<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => setTriggerLoad(t => t + 1), []);

  const toggleAR = () => {
    if (arOn && arTimer) { clearInterval(arTimer); setArTimer(null); setArOn(false); }
    else { load(); const t = setInterval(load, 60000); setArTimer(t); setArOn(true); }
  };

  const PSY = {
    bg: '#080c10', bg2: '#0d1318', bg3: '#0a0f14',
    teal: '#00e6b4', border: '#2a3540', txt2: '#6a8a9a', amber: '#e6b400'
  };

  return (
    <div style={{ background:PSY.bg, minHeight:'100vh', color:'#c8d8e0', fontFamily:"'Exo 2',sans-serif" }}>

      {/* Header */}
      <div style={{ background:PSY.bg2, borderBottom:`1px solid ${PSY.border}`, padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, position:'sticky', top:0, zIndex:100 }}>
        <div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:PSY.teal, letterSpacing:3, opacity:.8 }}>PSYCHOMETRIKS · PSY INDICATORS v1</div>
          <div style={{ fontSize:14, fontWeight:700, color:PSY.teal }}>Suite Completa · ADX · RSI · MACD · OI · CVD · VOLPROFILE · LIQMAP</div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, padding:'3px 8px', borderRadius:4, background:'rgba(0,230,180,0.12)', color:PSY.teal, border:'1px solid rgba(0,230,180,0.3)' }}>
            {sym}/USDT · {tf.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Global selector bar */}
      <div style={{ background:PSY.bg3, borderBottom:`1px solid #1a2530`, padding:'7px 18px', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2 }}>PAR:</span>
        <select value={sym} onChange={e => setSym(e.target.value)}
          style={{ background:PSY.bg2, color:'#c8d8e0', border:`1px solid ${PSY.border}`, borderRadius:5, padding:'4px 8px', fontFamily:"'Share Tech Mono',monospace", fontSize:10, cursor:'pointer', minWidth:130 }}>
          <optgroup label="── MAJOR ──">
            {['BTC','ETH','SOL','BNB','XRP','ADA','AVAX','LINK','LTC','DOT'].map(s => <option key={s} value={s}>{s}/USDT</option>)}
          </optgroup>
          <optgroup label="── MEME ──">
            {['DOGE','SHIB','PEPE','WIF','BONK','BOME','FLOKI'].map(s => <option key={s} value={s}>{s}/USDT</option>)}
          </optgroup>
          <optgroup label="── DeFi/L2 ──">
            {['ONDO','ARB','OP','SUI','INJ','NEAR','TRUMP','TAO','FET','WLD'].map(s => <option key={s} value={s}>{s}/USDT</option>)}
          </optgroup>
          <optgroup label="── OTROS ──">
            {['ICP','FIL','APT','TIA','JUP','XAU'].map(s => <option key={s} value={s}>{s}</option>)}
          </optgroup>
        </select>

        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2 }}>TF:</span>
        <select value={tf} onChange={e => setTF(e.target.value as TF)}
          style={{ background:PSY.bg2, color:'#c8d8e0', border:`1px solid ${PSY.border}`, borderRadius:5, padding:'4px 8px', fontFamily:"'Share Tech Mono',monospace", fontSize:10, cursor:'pointer' }}>
          <option value="15m">15 min</option>
          <option value="1h">1 hora</option>
          <option value="4h">4 horas</option>
          <option value="1d">1 día</option>
        </select>

        <button onClick={load}
          style={{ background:'rgba(0,230,180,0.1)', border:'1px solid rgba(0,230,180,0.3)', color:PSY.teal, fontFamily:"'Share Tech Mono',monospace", fontSize:10, padding:'5px 14px', borderRadius:5, cursor:'pointer', letterSpacing:1 }}>
          ⟳ CARGAR
        </button>

        <button onClick={toggleAR}
          style={{ background: arOn ? 'rgba(0,230,180,0.1)' : 'rgba(42,53,64,0.5)', border:`1px solid ${arOn ? 'rgba(0,230,180,0.4)' : PSY.border}`, color: arOn ? PSY.teal : PSY.txt2, fontFamily:"'Share Tech Mono',monospace", fontSize:9, padding:'4px 10px', borderRadius:5, cursor:'pointer' }}>
          ⏱ AUTO {arOn ? '1min ON' : 'OFF'}
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{ background:PSY.bg2, borderBottom:`2px solid ${PSY.border}`, display:'flex', overflowX:'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink:0, padding:'11px 16px',
              fontFamily:"'Share Tech Mono',monospace", fontSize:10, letterSpacing:1,
              cursor:'pointer', background:'transparent',
              border:'none', borderBottom: activeTab === tab.id ? `2px solid ${tab.color || PSY.teal}` : '2px solid transparent',
              color: activeTab === tab.id ? (tab.color || PSY.teal) : PSY.txt2,
              marginBottom:-2, transition:'all .2s', whiteSpace:'nowrap',
              display:'flex', alignItems:'center', gap:6
            }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background: activeTab === tab.id ? (tab.color || PSY.teal) : PSY.border, transition:'all .2s' }}></span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'adx'    && <ADXTab        sym={sym} tf={tf} triggerLoad={triggerLoad} />}
        {activeTab === 'rsi'    && <RSITab         sym={sym} tf={tf} triggerLoad={triggerLoad} />}
        {activeTab === 'macd'   && <MACDTab        sym={sym} tf={tf} triggerLoad={triggerLoad} />}
        {activeTab === 'oi'     && <OITab          sym={sym} triggerLoad={triggerLoad} />}
        {activeTab === 'cvd'    && <CVDTab         sym={sym} tf={tf} triggerLoad={triggerLoad} />}
        {activeTab === 'vol'    && <VolProfileTab  sym={sym} tf={tf} triggerLoad={triggerLoad} />}
        {activeTab === 'liq'    && <LiqMapTab      sym={sym} triggerLoad={triggerLoad} />}
        {activeTab === 'master' && <MasterTab      triggerLoad={triggerLoad} />}
      </div>

      <div style={{ background:PSY.bg2, borderTop:`1px solid ${PSY.border}`, padding:'7px 18px', display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2 }}>PSY INDICATORS v1 · PSYCHOMETRIKS</span>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:PSY.txt2 }}>{new Date().toLocaleTimeString('es-EC')}</span>
      </div>
    </div>
  );
}
