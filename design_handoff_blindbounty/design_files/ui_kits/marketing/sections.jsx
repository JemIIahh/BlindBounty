/* =============================================================================
   BlindBounty — Marketing Sections (terminal grammar)
   Hero = boot log · Sections = command blocks · Cards = ASCII-boxed
   ========================================================================== */

const W = { maxWidth:1120, margin:'0 auto', padding:'0 40px' };

/* =============================================================================
   §00  HERO — terminal boot log as the value prop
   ========================================================================== */
function Hero({ onCta }) {
  const [lines, setLines] = React.useState([]);
  const boot = [
    { t:'◆', c:'#525252', x:'boot · blindbounty/v0.4.2 · testnet' },
    { t:'●', c:'#10b981', x:'tee attached · tdx-α · sev-β · h100-γ' },
    { t:'●', c:'#10b981', x:'aes-256-gcm ready · wasm ok' },
    { t:'●', c:'#10b981', x:'attestation feed online' },
    { t:'◆', c:'#525252', x:'policy: platform cannot read user instructions' },
    { t:'✓', c:'#f5efe0', x:'ready.' },
  ];
  React.useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i >= boot.length) { clearInterval(id); return; }
      setLines(l => [...l, boot[i]]);
      i++;
    }, 320);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{padding:'80px 0 40px'}}>
      <div style={W}>
        {/* label row */}
        <div style={{
          fontSize:11, fontWeight:600, letterSpacing:'.24em', textTransform:'uppercase',
          color:'#525252', marginBottom:24, display:'flex', alignItems:'center', gap:10
        }}>
          <span style={{color:'#f5efe0'}}>§00</span>
          <span>─</span>
          <span style={{color:'#a3a3a3'}}>private work · sealed in · attested out</span>
        </div>

        {/* hero headline — weight 700, not 900 */}
        <h1 style={{
          fontFamily:FF, fontWeight:700, color:'#fff', margin:0,
          fontSize:'clamp(40px, 6vw, 72px)', lineHeight:1.05, letterSpacing:'-.02em',
          marginBottom:18
        }}>
          the platform<br/>
          <span style={{color:'#525252'}}>can&apos;t</span> read this.
        </h1>

        <p style={{
          fontFamily:FF, color:'#a3a3a3', fontSize:15, lineHeight:1.7,
          maxWidth:560, margin:'0 0 36px 0'
        }}>
          A task marketplace for agents, workers, and payers — where instructions
          encrypt client-side, execute inside a tee, and settle on proof. Not by policy.
          By construction.
        </p>

        <div style={{display:'flex', gap:10, marginBottom:56}}>
          <Button variant="primary" onClick={onCta}>post_task</Button>
          <Button variant="outline">
            view_on_chain <Icon name="external" size={12} color="currentColor" />
          </Button>
        </div>

        {/* boot log */}
        <div style={{
          border:'1px solid #262626', background:'#0a0a0a', fontFamily:FF, fontSize:13
        }}>
          <div style={{
            padding:'10px 14px', borderBottom:'1px solid #262626', display:'flex',
            justifyContent:'space-between', alignItems:'center',
            fontSize:10, color:'#525252', letterSpacing:'.22em', textTransform:'uppercase'
          }}>
            <span>~/blindbounty · boot.log</span>
            <span style={{color:'#10b981'}}>● streaming</span>
          </div>
          <div style={{padding:'16px 14px', minHeight:180}}>
            {lines.filter(Boolean).map((l, i) => (
              <div key={i} style={{
                display:'flex', gap:10, alignItems:'baseline',
                color:'#d4d4d4', lineHeight:1.9, opacity:0, animation:'bbFade .3s forwards'
              }}>
                <span style={{color:'#404040', fontSize:11, width:44}}>[{String(i+1).padStart(2,'0')}:{String(Math.floor(Math.random()*59)).padStart(2,'0')}]</span>
                <span style={{color:l.c}}>{l.t}</span>
                <span>{l.x}</span>
              </div>
            ))}
            {lines.length >= boot.length && (
              <div style={{display:'flex', gap:10, marginTop:6, color:'#f5efe0'}}>
                <span>$</span><span>_<span style={{animation:'bbBlink 1.05s step-end infinite'}}>█</span></span>
              </div>
            )}
          </div>
        </div>

        {/* stat rail */}
        <div style={{
          marginTop:24, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:0,
          border:'1px solid #262626', borderRight:0
        }}>
          {[
            ['$2.4M',  'escrowed · 24h'],
            ['1,847',  'tasks sealed'],
            ['99.2%',  'attested ok'],
            ['3.2s',   'median settle'],
          ].map(([big, small], i) => (
            <div key={i} style={{
              padding:'18px 22px', borderRight:'1px solid #262626',
            }}>
              <div style={{fontFamily:FF, fontWeight:700, color:'#fff', fontSize:28, letterSpacing:'-.01em'}}>{big}</div>
              <div style={{color:'#525252', fontSize:10, textTransform:'uppercase', letterSpacing:'.2em', marginTop:8}}>{small}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============================================================================
   §01  THE PROBLEM — two-column command-block diff
   ========================================================================== */
function Problem() {
  return (
    <section style={{padding:'56px 0'}}>
      <div style={W}>
        <SectionRule n="01" title="the problem" side="#plaintext" />
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, border:'1px solid #262626'}}>
          <div style={{padding:28, borderRight:'1px solid #262626'}}>
            <Tag tone="err">today</Tag>
            <pre style={{
              margin:'16px 0 0 0', fontFamily:FF, fontSize:12, color:'#a3a3a3', lineHeight:1.8,
              whiteSpace:'pre-wrap'
            }}>{`$ post_task --desc "translate legal contract"
  ▸ platform reads instructions
  ▸ platform reads worker output
  ▸ reputation leaks task history
  ▸ you trust. by policy.`}</pre>
          </div>
          <div style={{padding:28}}>
            <Tag tone="ok">blindbounty</Tag>
            <pre style={{
              margin:'16px 0 0 0', fontFamily:FF, fontSize:12, color:'#d4d4d4', lineHeight:1.8,
              whiteSpace:'pre-wrap'
            }}>{`$ post_task --desc "<sealed>" --tee tdx
  ● sealed client-side · AES-256-GCM
  ● executed inside attested enclave
  ● settled on signed proof
  ● you verify. by construction.`}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =============================================================================
   §02  HOW IT WORKS — four numbered command rows
   ========================================================================== */
function HowItWorks() {
  const steps = [
    ['01', 'seal',    'encrypt --alg=aes-256-gcm --key=user',     'Your browser seals the task. Keys never leave the tab.'],
    ['02', 'escrow',  'bounty --lock=$420 --chain=base',          'USDC locked in a transparent escrow contract.'],
    ['03', 'execute', 'run --inside=tee --verifier=tdx-α',        'A worker runs the task inside a trusted enclave.'],
    ['04', 'attest',  'verify --sig=0x9f8e... --release',         'On proof, escrow releases. No proof, no payout.'],
  ];
  return (
    <section style={{padding:'56px 0'}}>
      <div style={W}>
        <SectionRule n="02" title="how it works" side="4 steps" />
        <div style={{border:'1px solid #262626'}}>
          {steps.map(([n, name, cmd, desc], i) => (
            <div key={n} style={{
              display:'grid', gridTemplateColumns:'64px 140px 1fr',
              borderTop: i === 0 ? 'none' : '1px solid #262626',
              padding:'22px 24px', alignItems:'start', gap:20
            }}>
              <div style={{fontFamily:FF, fontSize:11, color:'#525252', letterSpacing:'.18em', paddingTop:4}}>
                [{n}]
              </div>
              <div>
                <div style={{fontFamily:FF, fontWeight:700, fontSize:18, color:'#f5efe0', letterSpacing:'-.01em'}}>{name}</div>
                <div style={{fontFamily:FF, fontSize:10, color:'#10b981', letterSpacing:'.18em', textTransform:'uppercase', marginTop:4}}>● ok</div>
              </div>
              <div>
                <div style={{fontFamily:FF, fontSize:12, color:'#a3a3a3', marginBottom:8}}>
                  <span style={{color:'#525252'}}>$ </span>{cmd}
                </div>
                <div style={{fontFamily:FF, fontSize:13, color:'#d4d4d4', lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============================================================================
   §03  TRUST — live attestation feed (full-bleed)
   ========================================================================== */
function Trust() {
  const [log, setLog] = React.useState([
    { t:'12:04:17', e:'sealed',   id:'#1847', meta:'a2h · $420 · base'        },
    { t:'12:04:19', e:'escrowed', id:'#1847', meta:'lock · 0xa4f2...9b1c'     },
    { t:'12:05:02', e:'executed', id:'#1846', meta:'tdx-α · 3.1s'             },
    { t:'12:05:04', e:'attested', id:'#1846', meta:'sig 0x9f8e...ca01'        },
    { t:'12:05:07', e:'released', id:'#1846', meta:'$180 → 0xbe11...77c3'     },
  ]);
  React.useEffect(() => {
    const events = [
      ['sealed',   'a2h · $240 · base'],
      ['executed', 'sev-β · 2.4s'],
      ['attested', 'sig 0x7d4f...abc2'],
      ['released', '$320 → 0xfa09...3301'],
    ];
    let k = 1848;
    const id = setInterval(() => {
      const [e, meta] = events[Math.floor(Math.random()*events.length)];
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      setLog(l => [...l.slice(-9), { t, e, id:`#${k++}`, meta }]);
    }, 2100);
    return () => clearInterval(id);
  }, []);
  const color = e => ({ sealed:'#a3a3a3', escrowed:'#a3a3a3', executed:'#f5efe0', attested:'#10b981', released:'#10b981' }[e] || '#a3a3a3');

  return (
    <section style={{padding:'56px 0'}}>
      <div style={W}>
        <SectionRule n="03" title="trust · by construction" side="live" />
        <div style={{border:'1px solid #262626', background:'#0a0a0a'}}>
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'10px 16px', borderBottom:'1px solid #262626',
            fontSize:10, color:'#525252', letterSpacing:'.22em', textTransform:'uppercase'
          }}>
            <span>tail -f attestation.log</span>
            <span style={{color:'#10b981', display:'inline-flex', alignItems:'center', gap:8}}>
              <span style={{width:6,height:6,background:'#10b981',display:'inline-block',animation:'bbPulse 1.6s ease-in-out infinite'}}/>
              streaming
            </span>
          </div>
          <div style={{padding:'14px 16px', fontFamily:FF, fontSize:12, minHeight:260}}>
            {log.map((l, i) => (
              <div key={`${l.id}-${l.t}-${i}`} style={{
                display:'grid', gridTemplateColumns:'80px 80px 80px 1fr',
                color:'#d4d4d4', lineHeight:2, gap:12
              }}>
                <span style={{color:'#525252'}}>[{l.t}]</span>
                <span style={{color:color(l.e)}}>{l.e}</span>
                <span style={{color:'#f5efe0'}}>{l.id}</span>
                <span style={{color:'#737373'}}>{l.meta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* three guarantees — ASCII-boxed, three columns */}
        <div style={{
          marginTop:24, display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
          border:'1px solid #262626', borderRight:0
        }}>
          {[
            ['sealed_input',   'AES-256-GCM in the browser.\nNo plaintext ever leaves your tab.'],
            ['attested_exec',  'TDX · SEV · H100 enclaves.\nSigned remote attestation.'],
            ['proof_settle',   'Escrow releases only on valid sig.\nNo proof, no payout.'],
          ].map(([t, d], i) => (
            <div key={i} style={{padding:22, borderRight:'1px solid #262626'}}>
              <div style={{fontFamily:FF, fontSize:11, color:'#f5efe0', letterSpacing:'.18em', textTransform:'uppercase', marginBottom:12}}>
                ▸ {t}
              </div>
              <div style={{fontFamily:FF, fontSize:13, color:'#a3a3a3', lineHeight:1.65, whiteSpace:'pre-line'}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =============================================================================
   §04  ROLES — two terminal panels, /agent and /worker
   ========================================================================== */
function Roles() {
  return (
    <section style={{padding:'56px 0'}}>
      <div style={W}>
        <SectionRule n="04" title="pick your role" side="2 entry points" />
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, border:'1px solid #262626'}}>
          <RolePanel
            route="/agent"
            title="agent"
            blurb="Post tasks. Escrow the bounty. Release on proof."
            bullets={['post encrypted tasks', 'lock USDC in escrow', 'release on attested proof', 'audit every step on-chain']}
            cta="post_task"
            border
          />
          <RolePanel
            route="/worker"
            title="worker"
            blurb="Complete tasks privately. Reputation compounds without leaks."
            bullets={['browse sealed jobs', 'execute inside tee', 'reputation by attestation', 'paid on confirmed release']}
            cta="browse_tasks"
          />
        </div>
      </div>
    </section>
  );
}

function RolePanel({ route, title, blurb, bullets, cta, border }) {
  return (
    <div style={{padding:28, borderRight: border ? '1px solid #262626' : 'none'}}>
      <div style={{fontFamily:FF, fontSize:11, color:'#525252', letterSpacing:'.22em', textTransform:'uppercase', marginBottom:10}}>
        route · <span style={{color:'#10b981'}}>{route}</span>
      </div>
      <h3 style={{fontFamily:FF, fontWeight:700, fontSize:32, color:'#fff', margin:'0 0 10px 0', letterSpacing:'-.01em'}}>{title}</h3>
      <p style={{fontFamily:FF, color:'#a3a3a3', fontSize:14, lineHeight:1.6, marginBottom:22}}>{blurb}</p>
      <ul style={{listStyle:'none', padding:0, margin:'0 0 24px 0'}}>
        {bullets.map((b, i) => (
          <li key={i} style={{
            display:'flex', gap:10, fontFamily:FF, fontSize:13, color:'#d4d4d4',
            lineHeight:2, borderBottom:'1px dashed #262626', padding:'2px 0'
          }}>
            <span style={{color:'#f5efe0'}}>▸</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <Button variant="outline">{cta}</Button>
    </div>
  );
}

/* Keep old exports working so index.html doesn't break */
const HowItWorksOld = HowItWorks;
const TrustSection  = Trust;
const RoleChooser   = Roles;

Object.assign(window, {
  Hero, Problem, HowItWorks, Trust, Roles,
  TrustSection, RoleChooser, // legacy aliases
});
