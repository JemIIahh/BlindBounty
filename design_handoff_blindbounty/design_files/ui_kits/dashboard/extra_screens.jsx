/* =============================================================================
   BlindBounty — Dashboard Screens · extra
   EarningsScreen, VerificationScreen, SettingsScreen
   Uses primitives exposed on window: StatTile, MONO, Rule, BButton,
   Field, Input, Textarea, Select, Chip, Tab, PageHeader
   ========================================================================== */
const { useState: xUseState, useMemo: xUseMemo } = React;

/* ---- Shared tiny bits ----------------------------------------------------- */
function KVRow({ k, v, mono, last }) {
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'180px 1fr', padding:'11px 0',
      borderBottom: last ? 'none' : '1px dashed var(--bb-line)',
      fontFamily:MONO, fontSize:12
    }}>
      <span style={{color:'var(--bb-ink-3)', letterSpacing:'.12em', textTransform:'uppercase', fontSize:10, paddingTop:2}}>{k}</span>
      <span style={{color:'var(--bb-ink)', fontFamily: mono ? MONO : MONO, wordBreak:'break-all'}}>{v}</span>
    </div>
  );
}

function StatusPill({ tone='ink', children }) {
  const tones = {
    ok:    { bg:'#d1fae5', fg:'#065f46', bd:'#10b981' },
    warn:  { bg:'#fef3c7', fg:'#92400e', bd:'#f59e0b' },
    bad:   { bg:'#fee2e2', fg:'#991b1b', bd:'#ef4444' },
    info:  { bg:'#dbeafe', fg:'#1e40af', bd:'#60a5fa' },
    ink:   { bg:'transparent', fg:'var(--bb-ink)', bd:'var(--bb-invert)' },
  }[tone] || {};
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      fontFamily:MONO, fontSize:9, letterSpacing:'.18em', textTransform:'uppercase',
      padding:'3px 8px', border:`1px solid ${tones.bd}`, background: tones.bg,
      color: tones.fg, fontWeight:600, whiteSpace:'nowrap'
    }}>{children}</span>
  );
}

/* =============================================================================
   EARNINGS — worker wallet screen
   Summary cards · earnings sparkline · pending payments · transactions
   ========================================================================== */
function EarningsScreen() {
  const [period, setPeriod] = xUseState('month');
  const summary = {
    total:     12_480.75,
    available:  4_220.00,
    pending:    1_840.00,
    this_mo:    1_860.00,
    last_mo:    1_520.00,
    this_wk:      540.00,
  };
  const chart = period === 'week'
    ? [120, 90, 180, 60, 145, 0, 95]
    : period === 'month'
      ? [420, 520, 610, 480, 780, 540, 620, 490, 730, 880, 560, 640, 920, 510, 430]
      : [1200, 1840, 2100, 950, 1560, 1870, 2340, 1420, 1980, 2620, 1640, 1860];
  const chartMax = Math.max(...chart, 1);

  const pending = [
    { id:'p-41', task_id:'#1847', title:'translate · legal contract → FR', bounty: 420, submitted:'apr 18 · 12:04', expected:'apr 19 · ~24h', status:'awaiting_review' },
    { id:'p-40', task_id:'#1845', title:'summarize · sealed court docs',   bounty: 240, submitted:'apr 18 · 09:11', expected:'apr 18 · ~4h',  status:'under_review' },
    { id:'p-39', task_id:'#1842', title:'extract · line items from 2k pdf',bounty: 450, submitted:'apr 17 · 22:33', expected:'apr 18 · released', status:'approved_pending_payment' },
  ];

  const txs = [
    { id:'t-210', type:'task_payment', amount: 320.00, status:'completed', hash:'0x9f8e42bc...a10b', net:'base',     at:'apr 17 · 14:22', task:'#1843 · annotate medical images' },
    { id:'t-209', type:'task_payment', amount: 180.00, status:'completed', hash:'0x41ab9cd2...78ee', net:'base',     at:'apr 16 · 10:08', task:'#1841 · reproduce flaky test' },
    { id:'t-208', type:'bonus',        amount:  40.00, status:'completed', hash:'0x22cc001f...9901', net:'base',     at:'apr 15 · 18:47', task:'rep +2 bonus' },
    { id:'t-207', type:'withdrawal',   amount:-2000.00,status:'completed', hash:'0x88e8bb32...22f0', net:'base',     at:'apr 14 · 09:00', task:'withdraw · USDC' },
    { id:'t-206', type:'task_payment', amount: 240.00, status:'completed', hash:'0x7701aabb...112c', net:'polygon',  at:'apr 13 · 22:19', task:'#1839 · schedule · q3 planning' },
    { id:'t-205', type:'task_payment', amount: 120.00, status:'pending',   hash:null,                net:'base',     at:'apr 13 · 14:51', task:'#1836 · translate · tech spec' },
    { id:'t-204', type:'refund',       amount:  80.00, status:'completed', hash:'0x1100aa..c9ab',    net:'base',     at:'apr 12 · 11:04', task:'#1834 · refund · task cancelled' },
  ];

  return (
    <div>
      <PageHeader
        crumb="ACCOUNT / EARNINGS"
        title="Earnings"
        sub="Wallet balance · payouts · withdrawal history."
        right={<BButton variant="primary" icon={<span style={{color:'#a1a1aa'}}>↗</span>}>withdraw</BButton>}
      />

      {/* Summary tiles */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:16}}>
        <StatTile label="TOTAL EARNED"     value={'$' + summary.total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}     delta={'LIFETIME · ' + txs.filter(t=>t.type==='task_payment').length + ' PAYOUTS'}/>
        <StatTile label="AVAILABLE"        value={'$' + summary.available.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} delta={'USDC · BASE'}/>
        <StatTile label="PENDING"          value={'$' + summary.pending.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}   delta={pending.length + ' TASKS IN REVIEW'}/>
        <StatTile label="THIS MONTH"       value={'$' + summary.this_mo.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}   delta={'+' + Math.round(((summary.this_mo - summary.last_mo) / summary.last_mo) * 100) + '% vs last'}/>
      </div>

      {/* Chart + Sparkline */}
      <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:'18px 22px 22px', marginBottom:16}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <Rule n="01" title="payout history" side={`${chart.length} periods`} />
          </div>
          <div style={{display:'flex', gap:6, marginBottom:14}}>
            {['week','month','year'].map(p => (
              <Chip key={p} active={period === p} onClick={()=>setPeriod(p)}>{p}</Chip>
            ))}
          </div>
        </div>
        <div style={{
          display:'flex', alignItems:'flex-end', gap:period==='month'?4:8, height:140,
          borderLeft:'1px solid var(--bb-line)', borderBottom:'1px solid var(--bb-line)', paddingLeft:8, paddingBottom:0, position:'relative'
        }}>
          {/* grid lines */}
          {[0.25, 0.5, 0.75, 1].map(r => (
            <div key={r} style={{position:'absolute', left:8, right:0, bottom:r*140,
              borderTop:'1px dashed var(--bb-line)', opacity:.6}}/>
          ))}
          {chart.map((v, i) => (
            <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative', zIndex:1}}>
              <div style={{
                width:'100%', background: v === 0 ? 'var(--bb-line)' : 'var(--bb-invert)',
                height: `${(v / chartMax) * 120 + 2}px`,
                opacity: v === 0 ? .4 : 1, transition:'height .25s ease'
              }}/>
            </div>
          ))}
        </div>
        <div style={{display:'flex', justifyContent:'space-between', marginTop:8, fontFamily:MONO, fontSize:9, color:'var(--bb-ink-4)', letterSpacing:'.18em'}}>
          <span>
            {period === 'week' ? 'MON' : period === 'month' ? 'APR 01' : 'JAN'}
          </span>
          <span>
            PEAK · ${Math.max(...chart).toLocaleString()}
          </span>
          <span>
            {period === 'week' ? 'SUN' : period === 'month' ? 'APR 15' : 'DEC'}
          </span>
        </div>
      </div>

      {/* Pending payments */}
      <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', marginBottom:16}}>
        <div style={{padding:'12px 18px', borderBottom:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span style={{fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.2em', textTransform:'uppercase'}}>pending payments · {pending.length}</span>
          <span style={{fontFamily:MONO, fontSize:9, color:'#10b981', letterSpacing:'.2em'}}>● ESCROW HELD</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'80px 1fr 90px 140px 140px 150px', padding:'10px 18px', borderBottom:'1px solid var(--bb-line)', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.16em'}}>
          <span>TASK</span><span>TITLE</span><span>BOUNTY</span><span>SUBMITTED</span><span>EXPECTED</span><span>STATUS</span>
        </div>
        {pending.map((p, i) => {
          const tone = p.status === 'approved_pending_payment' ? 'ok'
                     : p.status === 'under_review' ? 'info' : 'warn';
          const label = p.status === 'approved_pending_payment' ? '✓ RELEASING'
                      : p.status === 'under_review' ? '● REVIEWING' : '◌ AWAITING';
          return (
            <div key={p.id} style={{
              display:'grid', gridTemplateColumns:'80px 1fr 90px 140px 140px 150px',
              padding:'13px 18px', borderBottom: i === pending.length-1 ? 'none' : '1px solid #f4f4f5',
              fontFamily:MONO, fontSize:12, color:'var(--bb-ink)', alignItems:'center'
            }}>
              <span style={{color:'var(--bb-ink-3)'}}>{p.task_id}</span>
              <span>{p.title}</span>
              <span style={{fontWeight:500}}>${p.bounty}</span>
              <span style={{color:'var(--bb-ink-2)'}}>{p.submitted}</span>
              <span style={{color:'var(--bb-ink-2)'}}>{p.expected}</span>
              <span><StatusPill tone={tone}>{label}</StatusPill></span>
            </div>
          );
        })}
      </div>

      {/* Transactions */}
      <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)'}}>
        <div style={{padding:'12px 18px', borderBottom:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span style={{fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.2em', textTransform:'uppercase'}}>transaction log · last 30d</span>
          <span style={{fontFamily:MONO, fontSize:9, color:'var(--bb-ink-4)', letterSpacing:'.18em'}}>{txs.length} ENTRIES</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'120px 120px 1fr 110px 100px 150px 90px', padding:'10px 18px', borderBottom:'1px solid var(--bb-line)', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.16em'}}>
          <span>TIME</span><span>TYPE</span><span>REF</span><span>AMOUNT</span><span>NET</span><span>TX HASH</span><span>STATUS</span>
        </div>
        {txs.map((t, i) => {
          const neg = t.amount < 0;
          const amt = (neg ? '-$' : '+$') + Math.abs(t.amount).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});
          const typeLabel = t.type.replace('_',' ');
          return (
            <div key={t.id} style={{
              display:'grid', gridTemplateColumns:'120px 120px 1fr 110px 100px 150px 90px',
              padding:'11px 18px', borderBottom: i === txs.length-1 ? 'none' : '1px solid #f4f4f5',
              fontFamily:MONO, fontSize:12, color:'var(--bb-ink)', alignItems:'center'
            }}>
              <span style={{color:'var(--bb-ink-3)'}}>{t.at}</span>
              <span style={{color:'var(--bb-ink-2)', textTransform:'uppercase', letterSpacing:'.1em', fontSize:10}}>{typeLabel}</span>
              <span style={{color:'var(--bb-ink)'}}>{t.task}</span>
              <span style={{fontWeight:500, color: neg ? 'var(--bb-ink-2)' : 'var(--bb-ink)'}}>{amt}</span>
              <span style={{color:'var(--bb-ink-2)', textTransform:'uppercase', letterSpacing:'.08em', fontSize:10}}>{t.net}</span>
              <span style={{color:'var(--bb-ink-3)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {t.hash ? <a href="#" style={{color:'var(--bb-ink-2)', textDecoration:'underline dotted', textUnderlineOffset:3}}>{t.hash}</a> : '—'}
              </span>
              <span><StatusPill tone={t.status === 'completed' ? 'ok' : t.status === 'pending' ? 'warn' : 'bad'}>
                {t.status === 'completed' ? '✓ ok' : t.status === 'pending' ? '● pending' : '✗ failed'}
              </StatusPill></span>
            </div>
          );
        })}
      </div>

      {/* Withdraw footer */}
      <div style={{marginTop:16, padding:18, border:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', display:'flex', alignItems:'center', gap:20, fontFamily:MONO, fontSize:11}}>
        <span style={{color:'var(--bb-ink-3)', letterSpacing:'.18em', textTransform:'uppercase'}}>▸ minimum withdrawal</span>
        <span style={{color:'var(--bb-ink)', fontWeight:500}}>$10.00 USDC</span>
        <span style={{color:'var(--bb-ink-4)'}}>·</span>
        <span style={{color:'var(--bb-ink-3)', letterSpacing:'.18em', textTransform:'uppercase'}}>network fee</span>
        <span style={{color:'var(--bb-ink)'}}>~$0.04</span>
        <span style={{color:'var(--bb-ink-4)'}}>·</span>
        <span style={{color:'var(--bb-ink-3)', letterSpacing:'.18em', textTransform:'uppercase'}}>settlement</span>
        <span style={{color:'var(--bb-ink)'}}>&lt; 30s on BASE</span>
      </div>
    </div>
  );
}


/* =============================================================================
   VERIFICATION — TEE attestation + evidence chain + audit log
   ========================================================================== */
function VerificationScreen() {
  const [tab, setTab] = xUseState('trigger');
  const [taskId, setTaskId] = xUseState('1847');
  const [cat, setCat] = xUseState('translation');
  const [req, setReq] = xUseState('Translate the attached 40-page legal contract from English to French. Preserve formatting and clause numbering. Deliver as .docx.');
  const [ev, setEv]  = xUseState('Delivered 40pp .docx translation · hash=0x3dc2... · clause numbering preserved · screenshots attached.');
  const [status, setStatus] = xUseState('ready'); /* ready | running | passed | failed */
  const [showResult, setShowResult] = xUseState(true);
  const run = () => {
    setStatus('running'); setShowResult(false);
    setTimeout(() => { setStatus('passed'); setShowResult(true); }, 2200);
  };
  const result = {
    passed: status === 'passed',
    confidence: 0.972,
    model:'tdx-verifier-α · claude-haiku-4.5',
    attestation:'0xDCAP9f8e42bc1a10b...signed',
    reasoning:
      'Evidence matches all 4 stated requirements. (1) Translation language correct (FR), (2) clause numbering preserved across 40 pages, (3) format .docx verified via mime+magic bytes, (4) no placeholder tokens present. Confidence 97.2%. Forensic checks clean.',
  };

  return (
    <div>
      <PageHeader crumb="ACCOUNT / VERIFICATION" title="Verification" sub="TEE-attested evidence verification · cryptographic custody chain." />

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:20}}>
        <StatTile label="TEE ENCLAVE"   value="ONLINE" delta="tdx-α · gen4"/>
        <StatTile label="MY VERIFIED"   value="42"     delta="PASSED 42/44"/>
        <StatTile label="AVG CONFIDENCE" value="96.1%" delta="LIFETIME"/>
        <StatTile label="DISPUTES OPEN" value="0"      delta="clean · 30d"/>
      </div>

      <div style={{borderBottom:'1px solid var(--bb-line)', marginBottom:20}}>
        <Tab active={tab==='trigger'} onClick={()=>setTab('trigger')}>trigger</Tab>
        <Tab active={tab==='chain'}   onClick={()=>setTab('chain')}>evidence_chain</Tab>
        <Tab active={tab==='audit'}   onClick={()=>setTab('audit')}>audit_log</Tab>
      </div>

      {tab === 'trigger' && (
        <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16}}>
          {/* Trigger form */}
          <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:22}}>
            <Rule n="01" title="trigger sealed verification" side="in-enclave" />
            <Field label="Task ID" required><Input value={taskId} onChange={setTaskId}/></Field>
            <Field label="Category" required hint="Passed to the verifier for task-shape reasoning.">
              <Input value={cat} onChange={setCat}/>
            </Field>
            <Field label="Task requirements" required>
              <Textarea rows={4} value={req} onChange={setReq}/>
            </Field>
            <Field label="Evidence summary" required hint="Summary is hashed; raw attachments stay with worker.">
              <Textarea rows={4} value={ev} onChange={setEv}/>
            </Field>
            <div style={{display:'flex', alignItems:'center', gap:12}}>
              <BButton variant="primary" onClick={run}>
                {status === 'running' ? 'verifying…' : 'seal_and_verify'}
              </BButton>
              <BButton variant="outline" onClick={()=>{setStatus('ready'); setShowResult(false);}}>reset</BButton>
              <span style={{marginLeft:'auto', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.16em', textTransform:'uppercase'}}>
                ● enclave handshake · ok
              </span>
            </div>

            {status === 'running' && (
              <div style={{marginTop:18, padding:18, border:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', fontFamily:MONO}}>
                <div style={{fontSize:11, color:'var(--bb-ink-3)', letterSpacing:'.22em', textTransform:'uppercase', marginBottom:10}}>▸ verifying in tee enclave…</div>
                <div style={{fontSize:12, color:'var(--bb-ink-2)', lineHeight:1.85}}>
                  <div>$ seal evidence_summary → 0x3dc2…</div>
                  <div>$ attest enclave (tdx-α · gen4) …ok</div>
                  <div>$ fetch requirements from chain…ok</div>
                  <div style={{color:'var(--bb-ink)'}}>$ reason over evidence vs requirements <span style={{animation:'bbBlink 1.05s step-end infinite'}}>█</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          <div>
            {showResult && (status === 'passed' || status === 'failed') ? (
              <div style={{border:'1px solid', borderColor: result.passed ? '#10b981' : '#ef4444', background: result.passed ? '#d1fae5' : '#fee2e2', padding:0}}>
                <div style={{padding:'14px 20px', borderBottom:`1px solid ${result.passed ? '#10b981' : '#ef4444'}`, display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:MONO}}>
                  <span style={{fontSize:11, letterSpacing:'.2em', textTransform:'uppercase', color: result.passed ? '#065f46' : '#991b1b', fontWeight:600}}>▸ verification result</span>
                  <StatusPill tone={result.passed ? 'ok' : 'bad'}>{result.passed ? '✓ PASSED' : '✗ FAILED'}</StatusPill>
                </div>
                <div style={{padding:'18px 20px', fontFamily:MONO}}>
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18}}>
                    <div>
                      <div style={{fontSize:10, color: result.passed ? '#065f46' : '#991b1b', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:4}}>status</div>
                      <div style={{fontSize:22, fontWeight:700, color: result.passed ? '#065f46' : '#991b1b', letterSpacing:'-.02em'}}>{result.passed ? 'PASSED' : 'FAILED'}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10, color: result.passed ? '#065f46' : '#991b1b', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:4}}>confidence</div>
                      <div style={{fontSize:22, fontWeight:700, color:'var(--bb-ink)', letterSpacing:'-.02em'}}>{(result.confidence*100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div style={{fontSize:10, color: result.passed ? '#065f46' : '#991b1b', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:4}}>model</div>
                      <div style={{fontSize:12, color:'var(--bb-ink)'}}>{result.model}</div>
                    </div>
                    <div>
                      <div style={{fontSize:10, color: result.passed ? '#065f46' : '#991b1b', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:4}}>tee attestation</div>
                      <div style={{fontSize:11, color:'var(--bb-ink)', wordBreak:'break-all'}}>{result.attestation}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:10, color: result.passed ? '#065f46' : '#991b1b', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:6}}>reasoning</div>
                    <div style={{fontSize:12, color:'var(--bb-ink)', lineHeight:1.75}}>{result.reasoning}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:22}}>
                <Rule n="i" title="what the enclave checks" />
                {[
                  ['requirements parsed','extract n testable conditions'],
                  ['evidence hashed',    'BLAKE3 of summary + attachments'],
                  ['reasoning sealed',   'verifier runs inside tdx enclave'],
                  ['attestation signed', 'DCAP quote from enclave vendor'],
                  ['result posted',      'on-chain · releases escrow'],
                ].map(([k, v], i) => (
                  <div key={k} style={{
                    display:'grid', gridTemplateColumns:'24px 150px 1fr', alignItems:'baseline',
                    padding:'9px 0', borderBottom: i === 4 ? 'none' : '1px dashed var(--bb-line)',
                    fontFamily:MONO, fontSize:12
                  }}>
                    <span style={{color:'var(--bb-ink-4)', fontSize:10}}>{String(i+1).padStart(2,'0')}</span>
                    <span style={{color:'var(--bb-ink)', fontWeight:500}}>{k}</span>
                    <span style={{color:'var(--bb-ink-2)'}}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'chain' && <EvidenceChain/>}
      {tab === 'audit' && <AuditLog/>}
    </div>
  );
}

function EvidenceChain() {
  const chain = [
    { id:5, action:'verified',    at:'apr 18 · 12:12', actor:'0xTEE0...α',      hash:'0x3dc2f41cb9b10aa7188e2a4c2f3e9a77ba102bd48a5b1c22', note:'DCAP attested · conf=0.972 · released $420' },
    { id:4, action:'viewed',      at:'apr 18 · 12:08', actor:'0x4a2f...9b1c',   hash:'0x3dc2f41cb9b10aa7188e2a4c2f3e9a77ba102bd48a5b1c22', note:'agent view · sealed' },
    { id:3, action:'submitted',   at:'apr 18 · 12:04', actor:'0xbe11...77c3',   hash:'0x3dc2f41cb9b10aa7188e2a4c2f3e9a77ba102bd48a5b1c22', note:'evidence hash · BLAKE3' },
    { id:2, action:'exported',    at:'apr 18 · 11:42', actor:'0xbe11...77c3',   hash:'0x9f8e2b41dd31108fc22e7a33b1c55afa001002008899aabb', note:'worker exported plaintext (TEE-gated)' },
    { id:1, action:'integrity_check', at:'apr 18 · 09:11', actor:'0xCHAIN',     hash:'0xbb4488ddaa...', note:'merkle root ok · 0 drift' },
  ];

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:14, fontFamily:MONO}}>
        <BButton variant="outline">verify_integrity</BButton>
        <StatusPill tone="ok">✓ merkle pass · 0 drift</StatusPill>
        <span style={{marginLeft:'auto', fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.18em', textTransform:'uppercase'}}>task · #1847</span>
      </div>

      <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:'6px 22px 22px'}}>
        {chain.map((e, i) => {
          const toneMap = {
            verified:'ok', viewed:'info', submitted:'warn',
            exported:'info', integrity_check:'info'
          };
          return (
            <div key={e.id} style={{display:'grid', gridTemplateColumns:'38px 1fr', gap:0, alignItems:'flex-start', paddingTop:16}}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                <div style={{width:10, height:10, background:'var(--bb-invert)', marginTop:6}}/>
                {i < chain.length - 1 && <div style={{width:1, flex:1, background:'var(--bb-line-2)', marginTop:4}}/>}
              </div>
              <div style={{paddingBottom:18, borderBottom: i === chain.length-1 ? 'none' : '1px dashed var(--bb-line)'}}>
                <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6, fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.18em', textTransform:'uppercase'}}>
                  <span>#{String(e.id).padStart(4,'0')}</span>
                  <span>·</span>
                  <span>{e.at}</span>
                  <span style={{marginLeft:'auto'}}><StatusPill tone={toneMap[e.action]}>{e.action.replace('_',' ')}</StatusPill></span>
                </div>
                <div style={{fontFamily:MONO, fontSize:12, color:'var(--bb-ink)', wordBreak:'break-all', marginBottom:4}}>{e.hash}</div>
                <div style={{fontFamily:MONO, fontSize:11, color:'var(--bb-ink-2)'}}>
                  <span style={{color:'var(--bb-ink-3)'}}>submitter </span>{e.actor}
                  <span style={{color:'var(--bb-ink-4)'}}> · </span>
                  <span>{e.note}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AuditLog() {
  const events = [
    { action:'verified',        actor:'0xTEE0...α',        at:'apr 18 · 12:12', detail:'release tx 0x9f8e42bc...a10b · $420 → 0xbe11...77c3' },
    { action:'viewed',          actor:'0x4a2f...9b1c',     at:'apr 18 · 12:08', detail:'agent fetched sealed_hash for review' },
    { action:'submitted',       actor:'0xbe11...77c3',     at:'apr 18 · 12:04', detail:'evidence posted · BLAKE3 · size 4.3MB' },
    { action:'exported',        actor:'0xbe11...77c3',     at:'apr 18 · 11:42', detail:'worker decrypted & exported plaintext · tee-gated' },
    { action:'integrity_check', actor:'0xCHAIN',           at:'apr 18 · 09:11', detail:'chain merkle ok · 0 drift · verifier quorum 3/3' },
    { action:'viewed',          actor:'0xbe11...77c3',     at:'apr 18 · 09:02', detail:'worker assigned · rewrap ECIES sent' },
    { action:'submitted',       actor:'0x4a2f...9b1c',     at:'apr 18 · 08:47', detail:'task posted · bounty locked in escrow' },
  ];
  const toneMap = {
    verified:'ok', viewed:'info', submitted:'warn',
    exported:'info', integrity_check:'info'
  };
  return (
    <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)'}}>
      <div style={{padding:'12px 18px', borderBottom:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', display:'flex', justifyContent:'space-between', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.2em', textTransform:'uppercase'}}>
        <span>audit events · task #1847</span>
        <span style={{color:'#10b981'}}>● LIVE</span>
      </div>
      {events.map((e, i) => (
        <div key={i} style={{
          display:'grid', gridTemplateColumns:'140px 150px 130px 1fr',
          padding:'11px 18px', borderBottom: i === events.length-1 ? 'none' : '1px solid #f4f4f5',
          alignItems:'center', fontFamily:MONO, fontSize:12
        }}>
          <span><StatusPill tone={toneMap[e.action]}>{e.action.replace('_',' ')}</StatusPill></span>
          <span style={{color:'var(--bb-ink-2)'}}>{e.actor}</span>
          <span style={{color:'var(--bb-ink-3)', fontSize:11}}>{e.at}</span>
          <span style={{color:'var(--bb-ink)'}}>{e.detail}</span>
        </div>
      ))}
    </div>
  );
}


/* =============================================================================
   SETTINGS — profile + wallet + network + notifications + human verification
   ========================================================================== */
function SettingsScreen() {
  const [network, setNetwork] = xUseState('base');
  const [emailN, setEmailN]   = xUseState(true);
  const [pushN, setPushN]     = xUseState(false);
  const [digestN, setDigestN] = xUseState(true);
  const [lang, setLang]       = xUseState('en');
  const [orbVerified]         = xUseState(true);
  const [xHandle]             = xUseState('@jem_11ah');
  const [xVerified]           = xUseState(true);

  const networks = [
    { key:'base', name:'Base', fast:true },
    { key:'ethereum', name:'Ethereum' },
    { key:'polygon', name:'Polygon', fast:true },
    { key:'arbitrum', name:'Arbitrum', fast:true },
    { key:'avalanche', name:'Avalanche' },
    { key:'optimism', name:'Optimism', fast:true },
    { key:'celo', name:'Celo' },
    { key:'monad', name:'Monad' },
  ];
  const langs = [
    { value:'en', label:'English' },
    { value:'fr', label:'Français' },
    { value:'de', label:'Deutsch' },
    { value:'es', label:'Español' },
    { value:'ja', label:'日本語' },
    { value:'zh', label:'中文' },
  ];

  return (
    <div>
      <PageHeader crumb="ACCOUNT / SETTINGS" title="Settings" sub="Identity · network · notifications · preferences." />

      <div style={{display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:16}}>
        <div>
          {/* Identity */}
          <Panel n="01" title="identity">
            <KVRow k="wallet address" v="0x4a2f8db3e1c7a9f0b5d6e4c28f13a70b9b1c1a7e" mono/>
            <KVRow k="account tier"  v={<span>worker · <span style={{color:'var(--bb-ink-2)'}}>reputation 94.2</span></span>}/>
            <KVRow k="social · X"    v={xVerified
              ? <span>{xHandle} <StatusPill tone="ok">✓ OAUTH VERIFIED</StatusPill></span>
              : <span style={{color:'var(--bb-ink-3)'}}>— not linked —</span>}/>
            <KVRow k="human proof"   v={orbVerified
              ? <span>World ID · <StatusPill tone="ok">✓ ORB VERIFIED</StatusPill></span>
              : <span style={{color:'var(--bb-ink-3)'}}>— unverified · required above $5 —</span>}
              last/>
          </Panel>

          {/* Network */}
          <Panel n="02" title="preferred payment network" side="default for withdrawals">
            <div style={{display:'flex', flexWrap:'wrap', gap:8, padding:'4px 0 2px'}}>
              {networks.map(n => (
                <button key={n.key} onClick={()=>setNetwork(n.key)} style={{
                  fontFamily:MONO, fontSize:11, padding:'7px 12px', border:'1px solid',
                  borderColor: network === n.key ? 'var(--bb-invert)' : 'var(--bb-line-2)',
                  background: network === n.key ? 'var(--bb-invert)' : 'transparent',
                  color: network === n.key ? 'var(--bb-invert-ink)' : 'var(--bb-ink-2)',
                  cursor:'pointer', letterSpacing:'.04em', borderRadius:0,
                  display:'inline-flex', alignItems:'center', gap:6
                }}>
                  {network === n.key && <span>✓</span>}
                  <span>{n.name}</span>
                  {n.fast && <span style={{fontSize:8, color: network === n.key ? '#a1a1aa' : '#71717a', letterSpacing:'.18em'}}>FAST</span>}
                </button>
              ))}
            </div>
            <div style={{marginTop:10, fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.02em'}}>
              ▸ default chain for receiving payouts. each task can override.
            </div>
          </Panel>

          {/* Notifications */}
          <Panel n="03" title="notifications">
            <Toggle label="Email" desc="Task events, payouts, submissions" value={emailN} onChange={setEmailN}/>
            <Toggle label="Browser push" desc="Live events while the dashboard is open" value={pushN} onChange={setPushN}/>
            <Toggle label="Weekly digest" desc="Sunday summary · earnings + reputation" value={digestN} onChange={setDigestN} last/>
          </Panel>

          {/* Language */}
          <Panel n="04" title="language · locale">
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
              {langs.map(l => (
                <button key={l.value} onClick={()=>setLang(l.value)} style={{
                  fontFamily:MONO, fontSize:11, padding:'10px 12px', border:'1px solid',
                  borderColor: lang === l.value ? 'var(--bb-invert)' : 'var(--bb-line)',
                  background: lang === l.value ? 'var(--bb-invert)' : 'var(--bb-surface)',
                  color: lang === l.value ? 'var(--bb-invert-ink)' : 'var(--bb-ink-2)',
                  cursor:'pointer', letterSpacing:'.04em', textAlign:'left', borderRadius:0
                }}>
                  {lang === l.value ? '✓ ' : '  '}
                  {l.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel n="05" title="danger" last>
            <div style={{display:'flex', alignItems:'center', gap:12, padding:'6px 0'}}>
              <BButton variant="outline">export_keys</BButton>
              <BButton variant="outline">rotate_session</BButton>
              <BButton variant="outline"
                style={{borderColor:'#ef4444', color:'#b91c1c'}}>logout</BButton>
              <span style={{marginLeft:'auto', fontFamily:MONO, fontSize:10, color:'var(--bb-ink-3)', letterSpacing:'.16em', textTransform:'uppercase'}}>
                keys are generated & held in-browser only
              </span>
            </div>
          </Panel>
        </div>

        {/* Right column — session state */}
        <div>
          <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:22, marginBottom:12}}>
            <Rule n="i" title="session state" />
            <KVRow k="session id"    v="s-a4f29b1c02de" mono/>
            <KVRow k="authorized on" v="apr 18 · 08:47 UTC"/>
            <KVRow k="valid until"   v="apr 25 · 08:47 UTC"/>
            <KVRow k="device"        v="chromium · macos · fingerprint 0x1f22"/>
            <KVRow k="ip · asn"      v="hidden · tor-compatible" last/>
          </div>
          <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface)', padding:22, marginBottom:12}}>
            <Rule n="ii" title="in-browser keys" />
            <KVRow k="signing key"  v="0x77a2...9b1c · ed25519" mono/>
            <KVRow k="ecies public" v="0x9f8e...c02a · secp256k1" mono/>
            <KVRow k="last rotated" v="apr 10 · 4:02 UTC"/>
            <KVRow k="backup"       v={<span>● mnemonic held locally · <a href="#" style={{color:'var(--bb-ink)', textDecoration:'underline dotted', textUnderlineOffset:3}}>view</a></span>} last/>
          </div>
          <div style={{border:'1px solid var(--bb-line)', background:'var(--bb-surface-2)', padding:18, fontFamily:MONO, fontSize:11, color:'var(--bb-ink-2)', lineHeight:1.7}}>
            <div style={{color:'var(--bb-ink)', letterSpacing:'.18em', textTransform:'uppercase', fontWeight:600, marginBottom:6}}>▸ privacy</div>
            BlindBounty never stores your private key. Signing and decryption happen in your browser.
            The platform holds only ciphertext, attestations, and chain state.
          </div>
          <div style={{marginTop:12, fontFamily:MONO, fontSize:10, color:'var(--bb-ink-4)', letterSpacing:'.18em', textTransform:'uppercase', textAlign:'right'}}>
            v0.4.2 · build a4f29b1 · apr 18 2026
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ n, title, side, last, children }) {
  return (
    <div style={{
      border:'1px solid var(--bb-line)', background:'var(--bb-surface)',
      padding:22, marginBottom: last ? 0 : 12
    }}>
      <Rule n={n} title={title} side={side}/>
      {children}
    </div>
  );
}

function Toggle({ label, desc, value, onChange, last }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'10px 0', borderBottom: last ? 'none' : '1px dashed var(--bb-line)', fontFamily:MONO
    }}>
      <div>
        <div style={{fontSize:12, color:'var(--bb-ink)', fontWeight:500}}>{label}</div>
        <div style={{fontSize:11, color:'var(--bb-ink-3)', marginTop:2}}>{desc}</div>
      </div>
      <button role="switch" aria-checked={value} onClick={()=>onChange(!value)} style={{
        width:52, height:22, border:'1px solid', borderColor: value ? 'var(--bb-invert)' : 'var(--bb-line-2)',
        background: value ? 'var(--bb-invert)' : 'transparent',
        cursor:'pointer', position:'relative', borderRadius:0, padding:0
      }}>
        <span style={{
          position:'absolute', top:2, left: value ? 28 : 2,
          width:16, height:16, background: value ? 'var(--bb-invert-ink)' : 'var(--bb-ink-3)',
          transition:'left .14s ease'
        }}/>
      </button>
    </div>
  );
}

Object.assign(window, {
  EarningsScreen, VerificationScreen, SettingsScreen,
  KVRow, StatusPill, Panel, Toggle
});
