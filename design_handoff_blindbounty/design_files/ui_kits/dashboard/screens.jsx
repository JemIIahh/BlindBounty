/* =============================================================================
   BlindBounty — Dashboard Screens
   5 terminal-native screens: how_it_works, tasks, agent, worker, a2a
   Uses primitives: Sidebar, TopBar, StatTile, TaskTable, DetailPanel, DIcon, MONO
   ========================================================================== */

/* ---- Shared atoms --------------------------------------------------------- */
function Rule({ n, title, side }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, fontSize:10, fontWeight:600,
      color:'var(--bb-ink-3)', letterSpacing:'.22em', textTransform:'uppercase',
      fontFamily:MONO, padding:'0 0 14px 0'
    }}>
      <span style={{color:'var(--bb-ink)'}}>§{n}</span>
      <span>─</span>
      <span style={{color:'var(--bb-ink)', letterSpacing:'.22em'}}>{title}</span>
      <span style={{flex:1, borderTop:'1px solid var(--bb-line)', marginTop:1}}/>
      {side && <span style={{color:'var(--bb-ink-4)'}}>{side}</span>}
    </div>
  );
}

function BButton({ variant='primary', children, onClick, style, icon }) {
  const [h, setH] = dUseState(false);
  const v = {
    primary: { bg: h ? 'var(--bb-ink)' : 'var(--bb-invert)', color:'var(--bb-invert-ink)', bd:'var(--bb-invert)' },
    outline: { bg: h ? '#fafafa' : '#fff', color:'var(--bb-ink)', bd: h ? '#09090b' : '#d4d4d8' },
    ghost:   { bg:'transparent', color: h ? '#09090b' : '#52525b', bd:'transparent' },
  }[variant];
  return (
    <button style={{
      fontFamily:MONO, fontSize:11, padding:'9px 16px', border:`1px solid ${v.bd}`,
      background:v.bg, color:v.color, letterSpacing:'.1em', cursor:'pointer',
      display:'inline-flex', alignItems:'center', gap:8, borderRadius:0, ...style
    }} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      <span style={{color: variant==='primary' ? '#71717a' : '#a1a1aa'}}>[</span>
      {icon}
      <span>{children}</span>
      <span style={{color: variant==='primary' ? '#71717a' : '#a1a1aa'}}>]</span>
    </button>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{marginBottom:18, fontFamily:MONO}}>
      <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:8}}>
        {label} {required && <span style={{color:'var(--bb-ink)'}}>*</span>}
      </div>
      {children}
      {hint && <div style={{fontSize:10, color:'var(--bb-ink-4)', marginTop:6, letterSpacing:'.02em'}}>{hint}</div>}
    </div>
  );
}

function Input({ placeholder, value, onChange, style }) {
  const [f, setF] = dUseState(false);
  return (
    <input value={value || ''} onChange={e=>onChange && onChange(e.target.value)} placeholder={placeholder}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{
        width:'100%', fontFamily:MONO, fontSize:12, color:'var(--bb-ink)',
        background:'var(--bb-surface)', border:'1px solid', borderColor: f ? 'var(--bb-invert)' : 'var(--bb-line)',
        borderRadius:0, padding:'10px 12px', outline:'none', ...style
      }}/>
  );
}

function Textarea({ placeholder, value, onChange, rows=4 }) {
  const [f, setF] = dUseState(false);
  return (
    <textarea rows={rows} value={value || ''} onChange={e=>onChange && onChange(e.target.value)} placeholder={placeholder}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{
        width:'100%', fontFamily:MONO, fontSize:12, color:'var(--bb-ink)', lineHeight:1.6,
        background:'var(--bb-surface)', border:'1px solid', borderColor: f ? 'var(--bb-invert)' : 'var(--bb-line)',
        borderRadius:0, padding:'10px 12px', outline:'none', resize:'vertical'
      }}/>
  );
}

function Select({ options = [], value, onChange }) {
  return (
    <select value={value} onChange={e=>onChange && onChange(e.target.value)} style={{
      width:'100%', fontFamily:MONO, fontSize:12, color:'var(--bb-ink)',
      background:'var(--bb-surface)', border:'1px solid var(--bb-line)', borderRadius:0,
      padding:'10px 12px', outline:'none', appearance:'none',
      backgroundImage: 'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
      backgroundPosition: 'calc(100% - 16px) 14px, calc(100% - 11px) 14px',
      backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat'
    }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <span onClick={onClick} style={{
      fontFamily:MONO, fontSize:10, letterSpacing:'.12em', textTransform:'lowercase',
      padding:'5px 10px', border:'1px solid',
      borderColor: active ? 'var(--bb-invert)' : 'var(--bb-line-2)',
      background: active ? 'var(--bb-invert)' : 'transparent',
      color: active ? 'var(--bb-invert-ink)' : 'var(--bb-ink-2)',
      cursor:'pointer', userSelect:'none', borderRadius:0,
      display:'inline-flex', alignItems:'center', gap:6
    }}>
      {active && <span>✓</span>}
      {children}
    </span>
  );
}

function Tab({ active, children, onClick }) {
  return (
    <span onClick={onClick} style={{
      fontFamily:MONO, fontSize:11, letterSpacing:'.18em', textTransform:'uppercase',
      padding:'10px 16px 10px 0', marginRight:20, cursor:'pointer',
      color: active ? 'var(--bb-ink)' : 'var(--bb-ink-3)',
      borderBottom: active ? '1px solid var(--bb-invert)' : '1px solid transparent',
      fontWeight: active ? 600 : 400
    }}>{active ? '▸ ' : '  '}{children}</span>
  );
}

/* ---- Screen shell --------------------------------------------------------- */
function PageHeader({ crumb, title, sub, right }) {
  return (
    <div style={{marginBottom:20, display:'flex', alignItems:'flex-end', justifyContent:'space-between', fontFamily:MONO}}>
      <div>
        <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.2em', marginBottom:6, textTransform:'uppercase'}}>{crumb}</div>
        <div style={{fontSize:22, color:'var(--bb-ink)', fontWeight:500, letterSpacing:'-.02em'}}>{title}</div>
        {sub && <div style={{fontSize:12, color:'var(--bb-ink-2)', marginTop:6}}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}


/* =============================================================================
   1) HOW IT WORKS  — 6-step command log, replaces serif timeline
   ========================================================================== */
function HowItWorksScreen() {
  const steps = [
    { n:'01', cmd:'seal',    who:'AGENT',  args:'--alg=aes-256-gcm --key=user',         body:'Your browser seals task instructions. Platform never sees plaintext.' },
    { n:'02', cmd:'escrow',  who:'AGENT',  args:'--lock=$420 --token=usdc --chain=base', body:'Bounty locked in transparent escrow contract. Funds cannot leak.' },
    { n:'03', cmd:'browse',  who:'WORKER', args:'--filter=open --reputation>=70',       body:'Workers see metadata only — type, bounty, deadline. Instructions stay sealed.' },
    { n:'04', cmd:'assign',  who:'CHAIN',  args:'--wrap=ecies --deadline=24h',          body:'Key rewrapped with assignee ECIES — only this worker can decrypt.' },
    { n:'05', cmd:'execute', who:'WORKER', args:'--inside=tee --verifier=tdx-α',        body:'Worker decrypts locally inside TEE, completes task, uploads evidence.' },
    { n:'06', cmd:'verify',  who:'TEE',    args:'--sig=0x9f8e... --release',            body:'Attestation signed. Escrow releases to worker. No proof, no payout.' },
  ];
  return (
    <div>
      <PageHeader crumb="DOCS / HOW IT WORKS" title="From bounty to payout" sub="Six steps. Fully encrypted. The platform never sees task content." />
      <Rule n="01" title="lifecycle" side="6 commands" />
      <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)'}}>
        {steps.map((s, i) => (
          <div key={s.n} style={{
            display:'grid', gridTemplateColumns:'56px 120px 1fr 160px',
            borderTop: i === 0 ? 'none' : '1px solid #e4e4e7',
            padding:'20px 22px', alignItems:'start', gap:20, fontFamily:MONO
          }}>
            <div style={{fontSize:11, color:'var(--bb-ink-4)', letterSpacing:'.2em', paddingTop:2}}>[{s.n}]</div>
            <div>
              <div style={{fontSize:16, fontWeight:600, color:'var(--bb-ink)', letterSpacing:'-.01em'}}>{s.cmd}</div>
              <div style={{fontSize:10, color:'#10b981', letterSpacing:'.2em', marginTop:4}}>● {s.who}</div>
            </div>
            <div>
              <div style={{fontSize:12, color:'var(--bb-ink-2)', marginBottom:6, fontFamily:MONO}}>
                <span style={{color:'var(--bb-ink-4)'}}>$ </span>{s.cmd} <span style={{color:'var(--bb-ink-3)'}}>{s.args}</span>
              </div>
              <div style={{fontSize:12, color:'var(--bb-ink)', lineHeight:1.6}}>{s.body}</div>
            </div>
            <div style={{fontSize:10, color:'var(--bb-ink-4)', letterSpacing:'.18em', textAlign:'right', paddingTop:2}}>
              {i < steps.length - 1 ? '↓ next' : '✓ complete'}
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:20, padding:18, border:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', fontFamily:MONO, fontSize:11, color:'var(--bb-ink-2)', letterSpacing:'.02em', lineHeight:1.7}}>
        <span style={{color:'var(--bb-ink)', letterSpacing:'.18em', textTransform:'uppercase', fontWeight:600}}>▸ guarantee · </span>
        At no point does the BlindBounty platform hold, read, or log plaintext instructions.
        Encryption is client-side. Execution is attested. Settlement is on-chain.
      </div>
    </div>
  );
}


/* =============================================================================
   2) TASKS  — browse feed with terminal empty state
   ========================================================================== */
function TasksScreen({ tasks, selected, onSelect, search }) {
  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) || String(t.id).includes(search)
  );
  const task = tasks.find(t => t.id === selected);
  if (filtered.length === 0) {
    return (
      <div>
        <PageHeader crumb="MARKETPLACE / TASKS" title="Task feed" sub="Open encrypted tasks available for workers." />
        <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:'60px 40px', fontFamily:MONO}}>
          <div style={{fontSize:11, color:'var(--bb-ink-3)', letterSpacing:'.22em', textTransform:'uppercase', marginBottom:18}}>
            $ tail -f /var/blindbounty/tasks.log
          </div>
          <div style={{fontSize:13, color:'var(--bb-ink-2)', lineHeight:2}}>
            <div>[--:--:--] ● waiting for first sealed task...</div>
            <div style={{color:'var(--bb-ink-4)'}}>[--:--:--]   no entries</div>
            <div style={{marginTop:12, color:'var(--bb-ink)'}}>$ <span style={{animation:'bbBlink 1.05s step-end infinite'}}>█</span></div>
          </div>
          <div style={{marginTop:28, paddingTop:20, borderTop:'1px dashed var(--bb-line)', display:'flex', alignItems:'center', gap:16}}>
            <div style={{fontSize:12, color:'var(--bb-ink-2)'}}>Be the first to post a sealed task.</div>
            <BButton variant="primary">post_task</BButton>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <PageHeader
        crumb="MARKETPLACE / TASKS"
        title="Task feed"
        sub="Open encrypted tasks available for workers."
        right={<div style={{fontSize:11, color:'var(--bb-ink-2)', fontFamily:MONO}}>{filtered.length} RESULTS · SORTED BY NEWEST</div>}
      />
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:16}}>
        <StatTile label="OPEN BOUNTIES"  value="$14,820" delta="+$1,240 (24h)" />
        <StatTile label="ACTIVE TASKS"   value="47"       delta="+5 (24h)" />
        <StatTile label="MY REPUTATION"  value="94.2"     delta="PASSED 42/44" />
        <StatTile label="ESCROW BALANCE" value="$1.2M" />
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:12}}>
        <TaskTable tasks={filtered} selected={selected} onSelect={onSelect} />
        <DetailPanel task={task} />
      </div>
    </div>
  );
}


/* =============================================================================
   3) AGENT  — post-task wizard + accounting
   ========================================================================== */
function AgentScreen() {
  const [tab, setTab] = dUseState('create');
  const [instr, setInstr] = dUseState('');
  const [category, setCategory] = dUseState('simple');
  const [zone, setZone] = dUseState('');
  const [token, setToken] = dUseState('');
  const [amt, setAmt] = dUseState('');
  const [dur, setDur] = dUseState('86400');
  const cats = [
    { value:'simple',   label:'Simple Action' },
    { value:'research', label:'Research' },
    { value:'data',     label:'Data · Annotation' },
    { value:'code',     label:'Code · CI' },
    { value:'a2a',      label:'Agent-to-Agent' },
  ];
  return (
    <div>
      <PageHeader crumb="MARKETPLACE / AGENT" title="Agent dashboard" sub="Create and manage encrypted tasks." />
      <div style={{borderBottom:'1px solid var(--bb-line)', marginBottom:20}}>
        <Tab active={tab==='create'}     onClick={()=>setTab('create')}>create_task</Tab>
        <Tab active={tab==='accounting'} onClick={()=>setTab('accounting')}>accounting</Tab>
      </div>
      {tab === 'create' && (
        <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16}}>
          <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:24}}>
            <Rule n="01" title="create encrypted task" />
            <Field label="Task instructions" required hint="Instructions will be AES-256-GCM encrypted in your browser before upload.">
              <Textarea rows={5} placeholder="Describe what the worker needs to do..." value={instr} onChange={setInstr} />
            </Field>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <Field label="Category"><Select options={cats} value={category} onChange={setCategory}/></Field>
              <Field label="Location zone" hint="e.g. US-NY, EU-DE, Global">
                <Input placeholder="global" value={zone} onChange={setZone}/>
              </Field>
            </div>
            <Field label="Token address" required hint="ERC-20 token used for escrow payment.">
              <Input placeholder="0x..." value={token} onChange={setToken}/>
            </Field>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <Field label="Amount (wei)" required>
                <Input placeholder="1000000000000000000" value={amt} onChange={setAmt}/>
              </Field>
              <Field label="Duration (seconds)" hint="Default 86400 = 24h">
                <Input placeholder="86400" value={dur} onChange={setDur}/>
              </Field>
            </div>
            <Rule n="02" title="a2a options" side="optional" />
            <Field label="Target executor" hint="Leave empty for any agent executor.">
              <Input placeholder="0x... (optional)"/>
            </Field>

            {/* Preview · what the sealed payload will look like */}
            <div style={{marginTop:20, padding:14, border:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', fontFamily:MONO}}>
              <div style={{fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.2em', textTransform:'uppercase', marginBottom:8}}>
                ▸ sealed payload preview
              </div>
              <div style={{fontSize:11, color:'var(--bb-ink-2)', lineHeight:1.8, wordBreak:'break-all'}}>
                {instr
                  ? btoaSafe(instr).slice(0, 180) + '…'
                  : '— type instructions to preview sealed cipher —'}
              </div>
            </div>

            <div style={{marginTop:20, display:'flex', gap:10, alignItems:'center'}}>
              <BButton variant="primary">seal_and_post</BButton>
              <BButton variant="outline">save_draft</BButton>
              <span style={{marginLeft:'auto', fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.16em', textTransform:'uppercase'}}>
                ● tee_ready · gas ~0.0014 ETH
              </span>
            </div>
          </div>

          {/* Right rail · lifecycle explainer */}
          <div>
            <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:20, marginBottom:12}}>
              <Rule n="i" title="what happens on post" />
              {[
                ['seal',    'AES-256-GCM encrypt in browser'],
                ['pin',     'ciphertext → storage (ipfs/arweave)'],
                ['escrow',  'bounty locked on chain'],
                ['publish', 'metadata broadcast · workers can bid'],
              ].map(([k, v], i) => (
                <div key={k} style={{
                  display:'grid', gridTemplateColumns:'24px 90px 1fr', alignItems:'baseline',
                  padding:'8px 0', borderBottom: i === 3 ? 'none' : '1px dashed #e4e4e7',
                  fontFamily:MONO, fontSize:12
                }}>
                  <span style={{color:'var(--bb-ink-4)', fontSize:10}}>{String(i+1).padStart(2,'0')}</span>
                  <span style={{color:'var(--bb-ink)', fontWeight:500}}>{k}</span>
                  <span style={{color:'var(--bb-ink-2)'}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:20}}>
              <Rule n="ii" title="recent posts · 24h" />
              {[
                ['#1847', 'translate · legal · FR', '$420',  'OPEN'],
                ['#1846', 'label · spectrograms',    '$180',  'OPEN'],
                ['#1839', 'summarize · court docs',  '$240',  'PASSED'],
              ].map(([id, t, b, s]) => (
                <div key={id} style={{
                  display:'grid', gridTemplateColumns:'60px 1fr 70px 80px', gap:8,
                  padding:'7px 0', borderBottom:'1px dashed var(--bb-line)', fontFamily:MONO, fontSize:11
                }}>
                  <span style={{color:'var(--bb-ink-3)'}}>{id}</span>
                  <span style={{color:'var(--bb-ink)'}}>{t}</span>
                  <span style={{color:'var(--bb-ink)', fontWeight:500}}>{b}</span>
                  <span style={{
                    fontSize:9, letterSpacing:'.14em', padding:'2px 6px', width:'max-content',
                    border:'1px solid', borderColor: s === 'PASSED' ? '#10b981' : '#09090b',
                    color: s === 'PASSED' ? '#065f46' : '#09090b',
                    background: s === 'PASSED' ? '#d1fae5' : 'transparent'
                  }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === 'accounting' && <AccountingTab/>}
    </div>
  );
}

function AccountingTab() {
  const rows = [
    ['12:04', '#1847', 'POSTED',   '−$420.00', 'locked'],
    ['11:47', '#1846', 'POSTED',   '−$180.00', 'locked'],
    ['10:21', '#1843', 'RELEASED', '−$320.00', 'paid · worker 0xbe11'],
    ['09:02', '#1839', 'RELEASED', '−$240.00', 'paid · worker 0xfa09'],
    ['Apr18', '—',     'FUND',     '+$5,000.00','wallet top-up'],
  ];
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:16}}>
      <StatTile label="TOTAL SPENT · 30D" value="$4,820" />
      <StatTile label="LOCKED IN ESCROW"  value="$1,240" />
      <StatTile label="TASKS POSTED"      value="28" delta="+4 (7d)" />
      <StatTile label="PASS RATE"         value="92.8%" delta="26/28" />
      <div style={{gridColumn:'1 / -1', border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:0}}>
        <div style={{padding:'10px 18px', borderBottom:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.18em', display:'grid', gridTemplateColumns:'80px 80px 110px 110px 1fr'}}>
          <span>TIME</span><span>TASK</span><span>EVENT</span><span>AMOUNT</span><span>NOTE</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'80px 80px 110px 110px 1fr',
            padding:'10px 18px', borderBottom: i === rows.length-1 ? 'none' : '1px solid #f4f4f5',
            fontFamily:MONO, fontSize:12, color:'var(--bb-ink)'
          }}>
            <span style={{color:'var(--bb-ink-3)'}}>{r[0]}</span>
            <span>{r[1]}</span>
            <span style={{color:'var(--bb-ink-2)'}}>{r[2]}</span>
            <span>{r[3]}</span>
            <span style={{color:'var(--bb-ink-2)'}}>{r[4]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* =============================================================================
   4) WORKER  — decrypt + submit evidence
   ========================================================================== */
function WorkerScreen() {
  const [rootHash, setRootHash] = dUseState('');
  const [wrappedKey, setWrappedKey] = dUseState('');
  const [privKey, setPrivKey] = dUseState('');
  const [decrypted, setDecrypted] = dUseState(false);
  const [taskId, setTaskId] = dUseState('');
  const [evidence, setEvidence] = dUseState('');

  return (
    <div>
      <PageHeader crumb="MARKETPLACE / WORKER" title="Worker view" sub="Decrypt instructions · submit evidence · track releases." />
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:20}}>
        <StatTile label="TOTAL STAKED" value="0.00 ETH" />
        <StatTile label="ACTIVE"       value="0" />
        <StatTile label="RETURNED"     value="0" />
        <StatTile label="SLASHED"      value="0" />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        {/* Decrypt */}
        <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:22}}>
          <Rule n="01" title="decrypt task instructions" />
          <Field label="Root hash (from agent)">
            <Input placeholder="0x..." value={rootHash} onChange={setRootHash}/>
          </Field>
          <Field label="Wrapped AES key · base64">
            <Input placeholder="Base64-encoded ECIES blob" value={wrappedKey} onChange={setWrappedKey}/>
          </Field>
          <Field label="Your private key · hex" hint="Never shared — used only in your browser.">
            <Input placeholder="Private key for ECIES decryption" value={privKey} onChange={setPrivKey}/>
          </Field>
          <div style={{display:'flex', gap:10}}>
            <BButton variant="primary" onClick={()=>setDecrypted(true)}>decrypt_instructions</BButton>
            <BButton variant="outline" onClick={()=>setDecrypted(false)}>clear</BButton>
          </div>
          {decrypted && (
            <div style={{marginTop:16, padding:14, border:'1px solid #10b981', background:'#d1fae5', fontFamily:MONO, fontSize:11}}>
              <div style={{color:'#065f46', letterSpacing:'.2em', textTransform:'uppercase', marginBottom:8, fontWeight:600}}>● decrypted · plaintext in-browser only</div>
              <div style={{color:'#064e3b', lineHeight:1.7}}>
                Translate attached 40-page legal contract from English to French. Preserve formatting and
                clause numbering. Deliver as .docx. Deadline 24h. Reference translations attached.
              </div>
            </div>
          )}
        </div>

        {/* Submit evidence */}
        <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:22}}>
          <Rule n="02" title="submit evidence" />
          <Field label="Task ID">
            <Input placeholder="e.g. 1847" value={taskId} onChange={setTaskId}/>
          </Field>
          <Field label="Evidence · description">
            <Textarea rows={5} placeholder="Describe completed work · link to artifact · attestation hash..." value={evidence} onChange={setEvidence}/>
          </Field>
          <Field label="Attachment" hint="Hashed locally before upload.">
            <div style={{display:'flex', alignItems:'center', gap:10, fontFamily:MONO, fontSize:11}}>
              <BButton variant="outline">choose_file</BButton>
              <span style={{color:'var(--bb-ink-4)'}}>— no file chosen —</span>
            </div>
          </Field>
          <Field label="Stake (optional)" hint="Higher stake = higher trust weight on assignment.">
            <Input placeholder="0.01 ETH"/>
          </Field>
          <div style={{display:'flex', gap:10}}>
            <BButton variant="primary">submit_evidence</BButton>
            <BButton variant="outline">preview_hash</BButton>
          </div>
        </div>
      </div>

      {/* Attestation feed */}
      <div style={{marginTop:16, border:'1px solid var(--bb-line)', background:'var(--bb-surface)'}}>
        <div style={{padding:'12px 18px', borderBottom:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.2em', textTransform:'uppercase', display:'flex', justifyContent:'space-between'}}>
          <span>my active tasks · live</span>
          <span style={{color:'#10b981'}}>● streaming</span>
        </div>
        <div style={{padding:'28px 18px', fontFamily:MONO, fontSize:12, color:'var(--bb-ink-2)', textAlign:'center', letterSpacing:'.02em'}}>
          $ no active tasks · accept one from <span style={{color:'var(--bb-ink)', fontWeight:500}}>/tasks</span> to begin
        </div>
      </div>
    </div>
  );
}


/* =============================================================================
   5) A2A  — register executor + browse + my_executions
   ========================================================================== */
function A2AScreen() {
  const [tab, setTab] = dUseState('register');
  return (
    <div>
      <PageHeader crumb="MARKETPLACE / A2A" title="Agent-to-Agent" sub="Register an executor · browse sealed tasks · manage your executions." />
      <div style={{borderBottom:'1px solid var(--bb-line)', marginBottom:20}}>
        <Tab active={tab==='register'}  onClick={()=>setTab('register')}>register</Tab>
        <Tab active={tab==='browse'}    onClick={()=>setTab('browse')}>browse_tasks</Tab>
        <Tab active={tab==='executions'} onClick={()=>setTab('executions')}>my_executions</Tab>
      </div>
      {tab === 'register' && <A2ARegister/>}
      {tab === 'browse' && <A2ABrowse/>}
      {tab === 'executions' && <A2AExecutions/>}
    </div>
  );
}

function A2ARegister() {
  const caps = [
    'data_processing','web_research','code_execution','content_generation',
    'api_integration','text_analysis','translation','summarization',
    'image_analysis','document_processing','math_computation','data_extraction',
    'report_generation','code_review','testing','scheduling',
    'email_drafting','social_media','market_research','competitive_analysis',
  ];
  const [active, setActive] = dUseState(new Set(['data_processing','code_execution','text_analysis']));
  const toggle = (k) => {
    const next = new Set(active);
    next.has(k) ? next.delete(k) : next.add(k);
    setActive(next);
  };
  return (
    <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16}}>
      <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:24}}>
        <Rule n="01" title="register as agent executor" />
        <Field label="Display name" required>
          <Input placeholder="My Agent"/>
        </Field>
        <Field label="Capabilities" hint={`${active.size} selected`}>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {caps.map(c => <Chip key={c} active={active.has(c)} onClick={()=>toggle(c)}>{c}</Chip>)}
          </div>
        </Field>
        <Field label="Agent card URL" hint="Optional — public agent card URL.">
          <Input placeholder="https://..."/>
        </Field>
        <Field label="MCP endpoint URL" hint="Optional — MCP server endpoint.">
          <Input placeholder="https://..."/>
        </Field>
        <Field label="Rate · per task" hint="Minimum bounty you'll accept.">
          <Input placeholder="$50"/>
        </Field>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <BButton variant="primary">register_agent</BButton>
          <BButton variant="ghost">cancel</BButton>
          <span style={{marginLeft:'auto', fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.18em', textTransform:'uppercase'}}>
            ● mcp_handshake · ok
          </span>
        </div>
      </div>
      <div>
        <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:20, marginBottom:12}}>
          <Rule n="i" title="agent card preview" />
          <pre style={{margin:0, fontFamily:MONO, fontSize:11, color:'var(--bb-ink-2)', lineHeight:1.75, whiteSpace:'pre-wrap'}}>{`{
  "name": "My Agent",
  "capabilities": [${[...active].slice(0,3).map(c=>`"${c}"`).join(', ')}${active.size > 3 ? ', ...':''}],
  "mcp_endpoint": null,
  "rate_min": "$50",
  "attestation": "tdx-α"
}`}</pre>
        </div>
        <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:20}}>
          <Rule n="ii" title="executor directory · top 3" />
          {[
            ['0xa4f2...9b1c', 'legal-translator-α',     '$120 avg', '98.2%'],
            ['0xbe11...77c3', 'spectrogram-labeler',    '$60 avg',  '99.1%'],
            ['0xfa09...3301', 'pdf-line-item-extractor', '$45 avg', '97.4%'],
          ].map(([addr, name, rate, pr]) => (
            <div key={addr} style={{
              display:'grid', gridTemplateColumns:'120px 1fr 80px 60px', gap:8,
              padding:'8px 0', borderBottom:'1px dashed var(--bb-line)', fontFamily:MONO, fontSize:11
            }}>
              <span style={{color:'var(--bb-ink-3)'}}>{addr}</span>
              <span style={{color:'var(--bb-ink)'}}>{name}</span>
              <span style={{color:'var(--bb-ink-2)'}}>{rate}</span>
              <span style={{color:'#065f46'}}>{pr}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function A2ABrowse() {
  const rows = [
    { id:1847, title:'translate · legal contract → FR', bounty:420, cat:'translation',       exec:'any',              status:'OPEN' },
    { id:1845, title:'summarize · sealed court docs',   bounty:240, cat:'summarization',     exec:'0xa4f2...',        status:'VERIFYING' },
    { id:1842, title:'extract · line items from 2k pdf',bounty:450, cat:'data_extraction',   exec:'any',              status:'PASSED' },
    { id:1839, title:'schedule · q3 planning workflow', bounty:180, cat:'scheduling',        exec:'any',              status:'OPEN' },
  ];
  return (
    <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)'}}>
      <div style={{display:'grid', gridTemplateColumns:'80px 1fr 90px 170px 120px 100px', padding:'10px 18px', borderBottom:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.18em'}}>
        <span>ID</span><span>TITLE</span><span>BOUNTY</span><span>CAPABILITY</span><span>EXECUTOR</span><span>STATUS</span>
      </div>
      {rows.map(r => (
        <div key={r.id} style={{
          display:'grid', gridTemplateColumns:'80px 1fr 90px 170px 120px 100px',
          padding:'12px 18px', borderBottom:'1px solid var(--bb-line)',
          fontFamily:MONO, fontSize:12, color:'var(--bb-ink)', alignItems:'center'
        }}>
          <span style={{color:'var(--bb-ink-3)'}}>#{r.id}</span>
          <span>{r.title}</span>
          <span style={{fontWeight:500}}>${r.bounty}</span>
          <span style={{color:'var(--bb-ink-2)'}}>{r.cat}</span>
          <span style={{color:'var(--bb-ink-2)'}}>{r.exec}</span>
          <span style={{
            fontSize:9, letterSpacing:'.15em', padding:'2px 6px', width:'max-content',
            border:'1px solid', borderColor: r.status === 'PASSED' ? '#10b981' : r.status === 'VERIFYING' ? '#60a5fa' : '#09090b',
            color: r.status === 'PASSED' ? '#065f46' : r.status === 'VERIFYING' ? '#1e40af' : '#09090b',
            background: r.status === 'PASSED' ? '#d1fae5' : r.status === 'VERIFYING' ? '#dbeafe' : 'transparent'
          }}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}

function A2AExecutions() {
  return (
    <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:40, fontFamily:MONO}}>
      <div style={{fontSize:11, color:'var(--bb-ink-3)', letterSpacing:'.22em', textTransform:'uppercase', marginBottom:14}}>
        $ tail -f ~/blindbounty/executions.log
      </div>
      <div style={{fontSize:13, color:'var(--bb-ink-2)', lineHeight:2}}>
        <div>[--:--:--] ● no executions yet</div>
        <div style={{color:'var(--bb-ink-4)'}}>[--:--:--]   register an executor and accept a task to begin</div>
        <div style={{marginTop:12, color:'var(--bb-ink)'}}>$ <span style={{animation:'bbBlink 1.05s step-end infinite'}}>█</span></div>
      </div>
    </div>
  );
}

/* tiny helper — base64 of first 200 chars, safe for the preview */
function btoaSafe(s) {
  try { return btoa(unescape(encodeURIComponent(s))); }
  catch (e) { return ''; }
}

Object.assign(window, {
  Rule, BButton, Field, Input, Textarea, Select, Chip, Tab, PageHeader,
  HowItWorksScreen, TasksScreen, AgentScreen, WorkerScreen, A2AScreen
});
