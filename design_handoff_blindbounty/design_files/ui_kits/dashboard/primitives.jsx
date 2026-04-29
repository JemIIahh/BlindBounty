const { useState: dUseState } = React;

function DIcon({ name, size = 16, color = 'currentColor' }) {
  const p = {
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    chev: <polyline points="9 18 15 12 9 6"/>,
    dot: <circle cx="12" cy="12" r="4" fill="currentColor"/>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    check: <polyline points="20 6 9 17 4 12"/>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    cash: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{p[name]}</svg>
  );
}

const MONO = `'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace`;

function Sidebar({ active, onNav }) {
  const items = [
    ['browse', 'BROWSE'],
    ['my tasks', 'MY TASKS'],
    ['post', 'POST'],
    ['wallet', 'WALLET'],
    ['attestation', 'ATTESTATION'],
    ['settings', 'SETTINGS'],
  ];
  return (
    <aside style={{
      width:220, background:'var(--bb-surface-2)', borderRight:'1px solid var(--bb-line)',
      padding:'20px 0', fontFamily:MONO, display:'flex', flexDirection:'column'
    }}>
      <div style={{padding:'0 20px 20px', borderBottom:'1px solid var(--bb-line)', display:'flex', alignItems:'center', gap:8}}>
        <svg width={24} height={24} viewBox="0 0 44 44" style={{flexShrink:0}}>
          <rect width="44" height="44" fill="#09090b"/>
          <g transform="translate(22 22)" fill="#f5efe0">
            <path d="M 0 -15 L 12.5 -7.5 L 0 -1.5 Z"/>
            <path d="M 0 -15 L 12.5 -7.5 L 0 -1.5 Z" transform="rotate(60)"/>
            <path d="M 0 -15 L 12.5 -7.5 L 0 -1.5 Z" transform="rotate(120)"/>
            <path d="M 0 -15 L 12.5 -7.5 L 0 -1.5 Z" transform="rotate(180)"/>
            <path d="M 0 -15 L 12.5 -7.5 L 0 -1.5 Z" transform="rotate(240)"/>
            <path d="M 0 -15 L 12.5 -7.5 L 0 -1.5 Z" transform="rotate(300)"/>
          </g>
          <circle cx="22" cy="22" r="3.8" fill="#f5efe0"/>
          <rect x="17" y="21" width="10" height="2" fill="#09090b" rx=".5"/>
        </svg>
        <span style={{fontSize:12, fontWeight:700, letterSpacing:'.1em'}}>BLINDBOUNTY</span>
      </div>
      <div style={{padding:'16px 0', flex:1}}>
        <div style={{padding:'0 20px 8px', fontSize:10, color:'var(--bb-ink-4)', letterSpacing:'.15em'}}>MARKETPLACE</div>
        {items.map(([k, l]) => (
          <div key={k} onClick={()=>onNav && onNav(k)} style={{
            padding:'9px 20px', fontSize:12, letterSpacing:'.05em',
            color: active===k ? '#09090b' : '#52525b',
            background: active===k ? '#e4e4e7' : 'transparent',
            borderLeft: active===k ? '2px solid #09090b' : '2px solid transparent',
            cursor:'pointer'
          }}>{l}</div>
        ))}
      </div>
      <div style={{padding:'16px 20px', borderTop:'1px solid #e4e4e7', fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.1em'}}>
        <div>v0.4.2 · TESTNET</div>
        <div style={{marginTop:6, display:'flex', alignItems:'center', gap:6}}>
          <span style={{width:6, height:6, background:'#10b981'}}/>TEE ONLINE
        </div>
      </div>
    </aside>
  );
}

function TopBar({ search, setSearch }) {
  return (
    <div style={{
      height:56, borderBottom:'1px solid var(--bb-line)', display:'flex',
      alignItems:'center', padding:'0 24px', gap:16, background:'var(--bb-surface)', fontFamily:MONO
    }}>
      <div style={{flex:1, display:'flex', alignItems:'center', gap:10, background:'var(--bb-bg)', padding:'8px 12px', border:'1px solid var(--bb-line)'}}>
        <DIcon name="search" size={14} color="#71717a" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="SEARCH TASKS, WORKERS, HASHES…" style={{
          flex:1, background:'transparent', border:'none', outline:'none',
          fontFamily:MONO, fontSize:12, color:'var(--bb-ink)', letterSpacing:'.05em'
        }}/>
        <span style={{fontSize:10, color:'var(--bb-ink-4)', border:'1px solid var(--bb-line)', padding:'1px 6px'}}>⌘K</span>
      </div>
      <button style={{
        fontFamily:MONO, fontSize:11, padding:'8px 14px', border:'1px solid var(--bb-invert)',
        background:'var(--bb-invert)', color:'var(--bb-invert-ink)', letterSpacing:'.1em', cursor:'pointer', display:'flex', alignItems:'center', gap:6
      }}>
        <DIcon name="plus" size={12} color="#fff" /> POST TASK
      </button>
      <div style={{display:'flex', alignItems:'center', gap:6, padding:'6px 10px', border:'1px solid var(--bb-line)', fontSize:11}}>
        <span style={{width:6, height:6, background:'#10b981'}}/>0x4A2F…9B1C
      </div>
    </div>
  );
}

function StatTile({ label, value, delta }) {
  return (
    <div style={{
      background:'var(--bb-surface)', border:'1px solid var(--bb-line)', padding:'16px 18px', fontFamily:MONO
    }}>
      <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.15em', marginBottom:6}}>{label}</div>
      <div style={{fontSize:22, color:'var(--bb-ink)', fontWeight:500, letterSpacing:'-0.02em'}}>{value}</div>
      {delta && <div style={{fontSize:11, color:'#10b981', marginTop:4}}>{delta}</div>}
    </div>
  );
}

function TaskRow({ id, title, bounty, type, status, time, onClick, selected }) {
  const statusColors = {
    OPEN:      { c:'var(--bb-ink)', bg:'transparent', bd:'var(--bb-ink)' },
    ASSIGNED:  { c:'var(--bb-ink-3)', bg:'var(--bb-surface-2)', bd:'var(--bb-line-2)' },
    VERIFYING: { c:'#1e40af', bg:'#dbeafe', bd:'#60a5fa' },
    PASSED:    { c:'#065f46', bg:'#d1fae5', bd:'#10b981' },
    FAILED:    { c:'#991b1b', bg:'#fee2e2', bd:'#ef4444' },
  }[status];
  return (
    <div onClick={onClick} style={{
      display:'grid', gridTemplateColumns:'80px 1fr 90px 70px 110px 70px',
      padding:'14px 18px', borderBottom:'1px solid var(--bb-line)',
      alignItems:'center', fontFamily:MONO, fontSize:12,
      background: selected ? 'var(--bb-selected)' : 'var(--bb-surface)', cursor:'pointer'
    }}>
      <span style={{color:'var(--bb-ink-3)'}}>#{id}</span>
      <span style={{color:'var(--bb-ink)'}}>{title}</span>
      <span style={{color:'var(--bb-ink)', fontWeight:500}}>${bounty}</span>
      <span style={{
        fontSize:9, color:'var(--bb-ink-2)', border:'1px solid var(--bb-line-2)', padding:'1px 5px',
        width:'max-content', letterSpacing:'.1em'
      }}>{type}</span>
      <span style={{
        fontSize:9, letterSpacing:'.15em', padding:'3px 7px',
        border:`1px solid ${statusColors.bd}`, color:statusColors.c, background:statusColors.bg,
        width:'max-content'
      }}>{status}</span>
      <span style={{color:'var(--bb-ink-3)', fontSize:11}}>{time}</span>
    </div>
  );
}

function TaskTable({ tasks, selected, onSelect }) {
  return (
    <div style={{background:'var(--bb-surface)', border:'1px solid var(--bb-line)', fontFamily:MONO}}>
      <div style={{
        display:'grid', gridTemplateColumns:'80px 1fr 90px 70px 110px 70px',
        padding:'10px 18px', borderBottom:'1px solid var(--bb-line)',
        background:'var(--bb-surface-2)', fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.15em'
      }}>
        <span>ID</span><span>TITLE</span><span>BOUNTY</span><span>TYPE</span><span>STATUS</span><span>AGE</span>
      </div>
      {tasks.map(t => <TaskRow key={t.id} {...t} selected={selected===t.id} onClick={()=>onSelect(t.id)} />)}
    </div>
  );
}

function DetailPanel({ task }) {
  if (!task) return (
    <div style={{flex:1, padding:40, fontFamily:MONO, color:'var(--bb-ink-4)', fontSize:12, textAlign:'center', border:'1px solid var(--bb-line)', background:'var(--bb-surface-2)'}}>
      SELECT A TASK →
    </div>
  );
  return (
    <div style={{flex:1, background:'var(--bb-surface)', border:'1px solid var(--bb-line)', padding:24, fontFamily:MONO}}>
      <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.15em', marginBottom:10}}>TASK DETAIL · #{task.id}</div>
      <h2 style={{fontSize:20, margin:'0 0 20px', color:'var(--bb-ink)', fontWeight:500, letterSpacing:'-0.01em'}}>{task.title}</h2>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20}}>
        <div style={{border:'1px solid var(--bb-line)', padding:12}}>
          <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.15em', marginBottom:6}}>BOUNTY</div>
          <div style={{fontSize:18, color:'var(--bb-ink)', fontWeight:500}}>${task.bounty}.00 USDC</div>
        </div>
        <div style={{border:'1px solid var(--bb-line)', padding:12}}>
          <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.15em', marginBottom:6}}>DEADLINE</div>
          <div style={{fontSize:18, color:'var(--bb-ink)', fontWeight:500}}>48h</div>
        </div>
      </div>

      <div style={{border:'1px solid var(--bb-line)', padding:14, marginBottom:16}}>
        <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.15em', marginBottom:8}}>ENCRYPTED INSTRUCTIONS · AES-256-GCM</div>
        <div style={{fontSize:11, color:'var(--bb-ink-2)', lineHeight:1.7, wordBreak:'break-all', fontFamily:MONO}}>
          9f8e:a2bc:1d4f:6091:eeb3:7a0c:4515:9827:cc3a:1b78:3ef2:80dd:5914:60a8:b7c4:22fa:0e55:4a1a:cd3b:91fe…
        </div>
      </div>

      <div style={{border:'1px solid var(--bb-line)', padding:14, marginBottom:16}}>
        <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.15em', marginBottom:10}}>LIFECYCLE</div>
        {[
          ['POSTED', '12:04:17', true],
          ['ESCROWED', '12:04:19', true],
          ['ASSIGNED · Worker 0xa17f…', '12:09:02', task.status !== 'OPEN'],
          ['EVIDENCE SUBMITTED', '—', ['VERIFYING','PASSED','FAILED'].includes(task.status)],
          ['TEE VERIFIED', '—', ['PASSED','FAILED'].includes(task.status)],
          ['PAID OUT', '—', task.status === 'PASSED'],
        ].map(([l, t, done], i) => (
          <div key={i} style={{display:'grid', gridTemplateColumns:'16px 1fr 80px', alignItems:'center', padding:'5px 0', fontSize:11}}>
            <span style={{width:8, height:8, background:done?'#10b981':'var(--bb-line)'}}/>
            <span style={{color:done?'var(--bb-ink)':'var(--bb-ink-4)'}}>{l}</span>
            <span style={{color:'var(--bb-ink-3)', textAlign:'right'}}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{display:'flex', gap:8}}>
        <button style={{flex:1, padding:'11px', border:'1px solid var(--bb-invert)', background:'var(--bb-invert)', color:'var(--bb-invert-ink)', fontFamily:MONO, fontSize:11, letterSpacing:'.1em', cursor:'pointer'}}>ACCEPT TASK</button>
        <button style={{padding:'11px 16px', border:'1px solid var(--bb-line-2)', background:'var(--bb-surface)', color:'var(--bb-ink)', fontFamily:MONO, fontSize:11, letterSpacing:'.1em', cursor:'pointer'}}>VIEW ON CHAIN ↗</button>
      </div>
    </div>
  );
}

Object.assign(window, { DIcon, Sidebar, TopBar, StatTile, TaskRow, TaskTable, DetailPanel, MONO });
