/* =============================================================================
   BlindBounty — Marketing Primitives (terminal grammar)
   Single-family Plex Mono · sharp corners · hairline borders · no glass
   ========================================================================== */

const { useState, useEffect, useRef } = React;

const FF = "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace";

/* Minimal icon set. Same vocabulary as before, drawn in hairline mono. */
function Icon({ name, size = 16, color = 'currentColor', strokeWidth = 1.5 }) {
  const paths = {
    lock:      <><rect x="3" y="11" width="18" height="11" rx="1"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    shield:    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></>,
    bolt:      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
    arrow:     <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    check:     <polyline points="20 6 9 17 4 12"/>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
    clock:     <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    external:  <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth={strokeWidth} strokeLinecap="square" strokeLinejoin="miter" style={{flexShrink:0}}>
      {paths[name]}
    </svg>
  );
}

/* Official aperture mark — 6-blade iris with slit. */
function LogoMark({ size = 24, bg = '#0d0d0d', blade = '#f5efe0', slit = '#0d0d0d' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" style={{flexShrink:0}}>
      <rect width="44" height="44" fill={bg}/>
      <g transform="translate(22 22)" fill={blade}>
        {[0,60,120,180,240,300].map(r => (
          <path key={r} d="M 0 -15 L 12.5 -7.5 L 0 -1.5 Z" transform={`rotate(${r})`}/>
        ))}
      </g>
      <circle cx="22" cy="22" r="3.8" fill={blade}/>
      <rect x="17" y="21" width="10" height="2" fill={slit} rx=".5"/>
    </svg>
  );
}

/* Terminal-bracket button:  [ post task ]   [ view on chain ↗ ]  */
function Button({ variant='primary', children, onClick, style }) {
  const [hover, setHover] = useState(false);
  const base = {
    fontFamily:FF, fontWeight:600, fontSize:13, padding:'10px 18px', borderRadius:0,
    cursor:'pointer', transition:'all .15s', display:'inline-flex', alignItems:'center',
    gap:8, letterSpacing:'.04em', textTransform:'lowercase', ...style
  };
  const variants = {
    primary: { ...base, background: hover ? '#fff' : '#f5efe0', color:'#0d0d0d', border:'1px solid #f5efe0' },
    outline: { ...base, background:'transparent', color: hover ? '#f5efe0' : '#d4d4d4',
               border: `1px solid ${hover ? '#f5efe0' : '#404040'}` },
    ghost:   { ...base, background:'transparent', color: hover ? '#fff' : '#737373', border:'1px solid transparent' },
  };
  return (
    <button style={variants[variant]} onClick={onClick}
            onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
      <span style={{color: variant==='primary' ? '#737373' : '#525252'}}>[</span>
      <span>{children}</span>
      <span style={{color: variant==='primary' ? '#737373' : '#525252'}}>]</span>
    </button>
  );
}

/* Uppercase tag chip — sharp corners, hairline border. */
function Tag({ tone='neutral', children }) {
  const v = {
    ok:      { bg:'transparent', color:'#10b981', bd:'#10b981' },
    warn:    { bg:'transparent', color:'#f5efe0', bd:'#f5efe0' },
    err:     { bg:'transparent', color:'#ef4444', bd:'#ef4444' },
    neutral: { bg:'transparent', color:'#a3a3a3', bd:'#404040' },
  }[tone];
  return <span style={{
    background:v.bg, color:v.color, border:`1px solid ${v.bd}`, borderRadius:0,
    padding:'2px 8px', fontSize:10, fontWeight:600, letterSpacing:'.18em',
    textTransform:'uppercase', fontFamily:FF, display:'inline-flex', alignItems:'center', gap:6
  }}>{children}</span>;
}

/* Sharp, hairline card — replaces GlassCard. No backdrop-blur, no rounding. */
function Panel({ children, style }) {
  return (
    <div style={{
      background:'#0d0d0d', border:'1px solid rgba(255,255,255,.08)', borderRadius:0,
      padding:24, ...style
    }}>{children}</div>
  );
}

/* Full-width rule with optional title + side tag:  §01 ─ THE PROBLEM ─────── #encrypted */
function SectionRule({ n, title, side }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, fontSize:11, fontWeight:500,
      color:'#525252', letterSpacing:'.22em', textTransform:'uppercase',
      fontFamily:FF, padding:'0 0 20px 0'
    }}>
      <span style={{color:'#f5efe0'}}>§{n}</span>
      <span>─</span>
      <span style={{color:'#fff', letterSpacing:'.22em'}}>{title}</span>
      <span style={{flex:1, borderTop:'1px solid #262626', marginTop:1}}/>
      {side && <span style={{color:'#737373'}}>{side}</span>}
    </div>
  );
}

/* Prompt prefix —  $ command args */
function Prompt({ path='~', children, blink=false }) {
  return (
    <div style={{display:'flex', alignItems:'baseline', gap:10, fontFamily:FF, fontSize:13}}>
      <span style={{color:'#10b981'}}>$</span>
      <span style={{color:'#525252'}}>{path}</span>
      <span style={{color:'#f5efe0'}}>{children}</span>
      {blink && <span style={{color:'#f5efe0', animation:'bbBlink 1.05s step-end infinite'}}>_</span>}
    </div>
  );
}

/* Top navigation — status-bar style, no rounded CTA. */
function Navbar({ active='browse', onNav }) {
  const links = ['browse', 'how_it_works', 'trust', 'docs'];
  return (
    <nav style={{
      position:'sticky', top:0, zIndex:50, background:'#0d0d0d',
      borderBottom:'1px solid #262626',
      padding:'14px 40px', display:'flex', alignItems:'center', justifyContent:'space-between',
      fontFamily:FF, fontSize:13
    }}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <LogoMark size={24} />
        <span style={{fontWeight:700, fontSize:13, color:'#fff', letterSpacing:'.02em'}}>blindbounty</span>
        <span style={{color:'#404040'}}>·</span>
        <span style={{color:'#525252', fontSize:11}}>v0.4.2</span>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:28, fontSize:12}}>
        {links.map(l => (
          <a key={l} onClick={()=>onNav && onNav(l)} style={{
            color: active===l ? '#f5efe0' : '#737373', cursor:'pointer',
            transition:'color .15s', letterSpacing:'.02em'
          }} onMouseEnter={e=>e.currentTarget.style.color='#fff'}
             onMouseLeave={e=>e.currentTarget.style.color=active===l?'#f5efe0':'#737373'}>
            {active===l ? '▸ ' : '  '}{l}
          </a>
        ))}
      </div>
      <Button variant="primary" style={{padding:'8px 14px', fontSize:12}}>connect_wallet</Button>
    </nav>
  );
}

/* Status-bar footer — mirrors dashboard bottom rail. */
function Footer() {
  return (
    <footer style={{
      borderTop:'1px solid #262626', padding:'14px 40px', marginTop:64,
      color:'#525252', fontFamily:FF, fontSize:11, letterSpacing:'.02em',
      display:'flex', alignItems:'center', justifyContent:'space-between'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:18}}>
        <span style={{color:'#10b981'}}>● tee_online</span>
        <span>blindbounty/v0.4.2</span>
        <span>testnet</span>
        <span>commit 0xa4f2c1b</span>
      </div>
      <div style={{display:'flex', gap:24}}>
        <span>docs</span><span>github</span><span>privacy</span><span>terms</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Icon, LogoMark, Button, Tag, Panel, SectionRule, Prompt, Navbar, Footer, FF });
