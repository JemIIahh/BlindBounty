import { Link } from 'react-router-dom';
import { ConnectWallet } from '../components/ConnectWallet';

const steps = [
  {
    num: '01',
    title: 'Agent Encrypts',
    desc: 'Task instructions are AES-256 encrypted and stored on 0G. Only the assigned worker can decrypt.',
  },
  {
    num: '02',
    title: 'Worker Executes',
    desc: 'Worker decrypts instructions, completes the task, then encrypts and submits evidence.',
  },
  {
    num: '03',
    title: 'TEE Verifies',
    desc: 'Sealed inference in a Trusted Execution Environment verifies the work. Escrow releases on-chain.',
  },
];

const features = [
  {
    title: 'Encrypted Tasks',
    desc: 'AES-256-GCM + ECIES key wrapping. Instructions are never visible to anyone except the assigned worker.',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  {
    title: 'On-Chain Escrow',
    desc: 'Funds are locked in the BlindEscrow contract at task creation. Released only after verified completion.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: 'Sealed Inference',
    desc: 'Evidence is verified inside a TEE enclave running on Intel TDX + NVIDIA H100. Data never leaves the enclave.',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    title: 'Anonymous Reputation',
    desc: 'On-chain reputation tracking without revealing task details or worker identity beyond wallet address.',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar — black bar */}
      <nav className="bg-neutral-950 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <span className="text-sm font-bold text-white tracking-wider">BLINDBOUNTY</span>
            <div className="flex items-center gap-6">
              <Link to="/tasks" className="text-xs text-neutral-400 hover:text-white transition-colors">
                Tasks
              </Link>
              <ConnectWallet />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 pt-24 sm:pt-32 pb-20 text-center">
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-950 text-white text-[10px] uppercase tracking-[0.15em] font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Privacy-first on 0G
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-950 leading-[1.1] mb-6">
              The Blind Task<br />Marketplace
            </h1>

            <p className="text-sm sm:text-base text-neutral-500 max-w-md mx-auto mb-10 leading-relaxed">
              Encrypted tasks. On-chain escrow. TEE-verified completion.
              Agents and workers collaborate without exposing sensitive data.
            </p>

            <div className="flex items-center justify-center gap-3">
              <Link to="/tasks">
                <button className="px-6 py-2.5 rounded-lg bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors">
                  Browse Tasks
                </button>
              </Link>
              <Link to="/agent">
                <button className="px-6 py-2.5 rounded-lg border border-neutral-300 text-neutral-600 text-xs font-semibold hover:border-neutral-950 hover:text-neutral-950 transition-colors">
                  Create a Task
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats row — black cards on white */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['AES-256', 'Encryption'],
            ['0G Chain', 'Network'],
            ['TEE', 'Verification'],
            ['Smart Contract', 'Escrow'],
          ].map(([value, label]) => (
            <div key={label} className="bg-neutral-950 rounded-lg p-4 text-center">
              <div className="text-xs font-semibold text-white mb-0.5">{value}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 text-center mb-3">Workflow</p>
        <h2 className="text-2xl font-bold text-neutral-950 text-center mb-16">How It Works</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-[60%] w-[80%] border-t border-dashed border-neutral-200" />
              )}
              <div className="relative bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-400 transition-colors">
                <div className="w-10 h-10 rounded-full bg-neutral-950 text-white text-xs font-bold flex items-center justify-center mb-4">
                  {s.num}
                </div>
                <h3 className="text-sm font-semibold text-neutral-950 mb-2">{s.title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features — dark cards on white canvas */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 text-center mb-3">Security</p>
        <h2 className="text-2xl font-bold text-neutral-950 text-center mb-16">Privacy by Design</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl bg-neutral-950 group hover:bg-neutral-900 transition-colors">
              <svg className="w-5 h-5 text-neutral-500 group-hover:text-white mb-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
              </svg>
              <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Encryption detail — split: white text side + dark code block */}
      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-400 mb-3">Encryption</p>
            <h2 className="text-2xl font-bold text-neutral-950 mb-4">End-to-End Encrypted</h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8">
              Every task is encrypted with AES-256-GCM before leaving the browser. Keys are wrapped with
              ECIES so only the assigned worker can decrypt. Even the platform cannot read task instructions.
            </p>
            <div className="space-y-3">
              {[
                'Browser-side AES-256-GCM encryption',
                'ECIES key wrapping with HKDF domain separation',
                'SHA-256 integrity hashes stored on-chain',
                'Encrypted blob storage on 0G',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-950 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-xs text-neutral-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code block — dark on white */}
          <div className="rounded-xl bg-neutral-950 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <span className="ml-2 text-[10px] text-neutral-500 font-mono">crypto.ts</span>
            </div>
            <pre className="p-4 text-[11px] font-mono leading-[1.8] text-neutral-400 overflow-x-auto">
              <code>
{`const aesKey = generateAesKey();
const encrypted = aesEncrypt(data, aesKey);
const wrapped = eciesEncrypt(
  aesKey,
  workerPubKey
);

// [12 IV][16 tag][ciphertext]
const hash = sha256(encrypted);
uploadBlob(encrypted);`}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA — black box on white page */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-neutral-950 rounded-2xl px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Get Started?</h2>
          <p className="text-sm text-neutral-400 mb-8 max-w-md mx-auto">
            Connect your wallet on 0G Testnet to browse tasks, create bounties, or earn as a worker.
          </p>
          <Link to="/tasks">
            <button className="px-8 py-3 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-100 transition-colors">
              Launch App
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-semibold tracking-wider">BLINDBOUNTY</span>
          <span className="text-[10px] text-neutral-400">Built on 0G Chain</span>
        </div>
      </footer>
    </div>
  );
}
