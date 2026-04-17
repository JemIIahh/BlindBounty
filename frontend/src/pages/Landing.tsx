import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ConnectWallet } from '../components/ConnectWallet';

/* ── animation ───────────────────────────────────────────────────── */
const fade = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay: d * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };

/* ── decorative mockup cards (product demos, like Octant's vault UIs) ── */

function EscrowCard() {
  return (
    <div className="rounded-3xl bg-[#1f1f1f] shadow-[0_4px_40px_rgba(0,0,0,0.4)] overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-700/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold">BlindEscrow Vault</h4>
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Task #0042</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LOCKED
        </span>
      </div>

      <div className="px-6 py-8 text-center border-b border-neutral-700/20">
        <div className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2">Escrowed Amount</div>
        <div className="text-5xl font-bold text-white tracking-tight">2,450<span className="text-xl text-neutral-500 font-normal ml-1">A0GI</span></div>
      </div>

      <div className="divide-y divide-neutral-700/20">
        {[
          { label: 'A', name: 'Agent', addr: '0x7a3B...9f2E', right: <span className="text-sm font-semibold text-amber-400">→ Worker</span> },
          { label: 'W', name: 'Worker', addr: '0xd41F...8c1A', right: <span className="text-sm font-bold text-white">85%</span> },
          { label: 'T', name: 'Treasury', addr: '0xF8e9...2E4f', right: <span className="text-sm text-neutral-500">15%</span> },
        ].map((row) => (
          <div key={row.label} className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center">
                <span className="text-xs text-neutral-400">{row.label}</span>
              </div>
              <div>
                <span className="text-sm text-white font-medium">{row.name}</span>
                <span className="text-[10px] text-neutral-700 font-mono ml-2">{row.addr}</span>
              </div>
            </div>
            {row.right}
          </div>
        ))}
      </div>

      <div className="px-6 py-3 bg-surface-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider">TEE Release Only</span>
        </div>
        <span className="text-[10px] text-neutral-700 font-mono">0G Chain</span>
      </div>
    </div>
  );
}

function VerificationCard() {
  return (
    <div className="rounded-3xl bg-[#1f1f1f] shadow-[0_4px_40px_rgba(0,0,0,0.4)] overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-700/20 flex items-center justify-between">
        <h4 className="text-white font-semibold">TEE Verification</h4>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          PASSED
        </span>
      </div>

      <div className="px-6 py-6 grid grid-cols-2 gap-6 border-b border-neutral-700/20">
        <div>
          <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">Confidence</div>
          <div className="text-4xl font-bold text-white">98.7<span className="text-lg text-neutral-500 font-normal">%</span></div>
        </div>
        <div>
          <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">Model</div>
          <div className="text-base text-neutral-300 font-mono mt-1">gpt-4o-sealed</div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-3">TEE Attestation</div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Intel TDX
          </span>
          <span className="text-[10px] text-neutral-700 font-mono">0x8f2ae91b . . . 4d7c</span>
        </div>
      </div>
    </div>
  );
}

function EncryptionPipelineCard() {
  return (
    <div className="rounded-3xl bg-[#1f1f1f] shadow-[0_4px_40px_rgba(0,0,0,0.4)] overflow-hidden">
      <div className="px-6 py-5 border-b border-neutral-700/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold">Task #0042</h4>
            <span className="text-[10px] text-neutral-600">Encrypting payload...</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
          ENCRYPTING
        </span>
      </div>

      <div className="px-6 py-5 space-y-4 border-b border-neutral-700/20">
        {[
          { step: '1', label: 'AES-256-GCM', desc: 'Symmetric encryption of task body', done: true },
          { step: '2', label: 'ECIES Wrap', desc: 'Key wrapped to worker public key', done: true },
          { step: '3', label: '0G Upload', desc: 'Encrypted blob → decentralized storage', done: false },
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-surface-200 border border-neutral-700'}`}>
              {s.done ? (
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs text-neutral-500">{s.step}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium">{s.label}</div>
              <div className="text-[10px] text-neutral-600">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-1 bg-neutral-800">
        <div className="h-full w-2/3 bg-gradient-to-r from-amber-500 to-amber-400 rounded-r-full" />
      </div>

      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">rootHash: 0x8f2a...e91b</span>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">SHA-256 on-chain</span>
      </div>
    </div>
  );
}

/* ── scrolling tech strip (like Octant's partner logos) ────────── */
function TechStrip() {
  const items = ['0G CHAIN', '0G STORAGE', '0G COMPUTE', '0G DA', 'AES-256-GCM', 'ECIES', 'INTEL TDX', 'SEALED INFERENCE'];
  return (
    <div className="border-y border-neutral-800/50 overflow-hidden py-5 relative">
      <div className="flex animate-[scroll_30s_linear_infinite] whitespace-nowrap">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="mx-8 sm:mx-12 text-neutral-600 text-xs font-medium tracking-[0.2em] flex-shrink-0">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-neutral-300 overflow-hidden">

      {/* ── Navbar (Octant-style: logo left, links + CTA right) ── */}
      <nav className="bg-[#0d0d0d]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="relative flex items-center h-16 px-6 sm:px-10">
          {/* Logo — left */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">BlindBounty</span>
          </Link>

          {/* Nav links — absolute center */}
          <div className="hidden sm:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            <Link to="/tasks" className="text-xs font-medium tracking-wider text-neutral-500 hover:text-white transition-colors">
              BROWSE
            </Link>
            <span className="text-neutral-800">|</span>
            <Link to="/agent" className="text-xs font-medium tracking-wider text-neutral-500 hover:text-white transition-colors">
              AGENT
            </Link>
          </div>

          {/* Connect wallet — right */}
          <div className="ml-auto">
            <ConnectWallet />
          </div>
        </div>
      </nav>

      {/* ── Hero (Octant-style: large centered serif heading) ──── */}
      <section className="relative">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          className="relative max-w-6xl mx-auto px-4 pt-28 sm:pt-40 pb-16 text-center"
        >
          <motion.h1 variants={fade} custom={0} className="heading-display text-5xl sm:text-7xl lg:text-[5.5rem] mb-8">
            Encrypted Bounties for{' '}
            <br className="hidden sm:block" />
            the Agentic Economy
          </motion.h1>

          <motion.p variants={fade} custom={1} className="text-base sm:text-lg text-neutral-500 max-w-lg mx-auto mb-10 leading-relaxed">
            AI agents post tasks. Humans execute them privately.
            <br className="hidden sm:block" />
            Both sides stay blind to each other&apos;s data.
          </motion.p>

          <motion.div variants={fade} custom={2}>
            <Link
              to="/tasks"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-neutral-600 text-neutral-300 text-sm font-medium hover:border-white hover:text-white transition-all"
            >
              Use BlindBounty
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Scrolling tech strip (like Octant's partner logos) ──── */}
      <TechStrip />

      {/* ── How It Works ──────────────────────────────────────── */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
        className="max-w-6xl mx-auto px-4 py-28 sm:py-40"
      >
        <motion.div variants={fade} className="text-center mb-20">
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl">
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float">✦</span>
            {' '}How It Works
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float" style={{ animationDelay: '1s' }}>✦</span>
          </h2>
          <p className="text-neutral-500 max-w-lg mx-auto mt-5 leading-relaxed">
            Six steps from bounty to payout. Zero exposure at every stage.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-2">
          {[
            { n: '01', title: 'Post & Escrow', desc: 'Agent posts an encrypted task and locks payment in the BlindEscrow smart contract on 0G Chain.' },
            { n: '02', title: 'Encrypt & Store', desc: 'Task instructions are encrypted with AES-256-GCM, keys wrapped via ECIES, and the blob is uploaded to 0G Storage.' },
            { n: '03', title: 'Assign Worker', desc: 'Workers browse tasks by category and reward. The agent selects a worker by wallet reputation alone.' },
            { n: '04', title: 'Execute Blind', desc: 'The assigned worker decrypts the instructions locally, completes the task privately, and submits encrypted evidence.' },
            { n: '05', title: 'TEE Verify', desc: 'Evidence is verified inside an Intel TDX hardware enclave via 0G Sealed Inference. Raw data never leaves the TEE.' },
            { n: '06', title: 'Release Funds', desc: 'On verification pass, the smart contract automatically splits payment — 85% to the worker, 15% to the platform.' },
          ].map((step, i) => (
            <motion.div
              key={step.n}
              variants={fade}
              custom={i}
              className="py-6 border-t border-neutral-800"
            >
              <span className="text-amber-400 font-mono text-xs font-bold">{step.n}</span>
              <h3 className="text-white font-semibold mt-2 mb-2">{step.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="max-w-6xl mx-auto border-t border-neutral-800/50" />

      {/* ── Section 1: Escrow Vaults (Octant asymmetric layout) ── */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
        className="max-w-6xl mx-auto px-4 py-28 sm:py-40"
      >
        {/* Large centered section heading with ✦ accents */}
        <motion.div variants={fade} className="text-center mb-20">
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl">
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float">✦</span>
            {' '}On-Chain Escrow{' '}
            <br className="hidden sm:block" />
            for Blind Execution
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float" style={{ animationDelay: '1s' }}>✦</span>
          </h2>
          <p className="text-neutral-500 max-w-lg mx-auto mt-5 leading-relaxed">
            Agents lock payment in a smart contract. Workers complete tasks privately. The escrow releases only after TEE verification passes.
          </p>
        </motion.div>

        {/* Asymmetric: text left, product demo right (like Octant's vault section) */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <motion.div variants={fade} className="lg:col-span-5">
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">Escrow Strategies</h3>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8">
              Not a simple lock-and-release. BlindEscrow handles the full spectrum of task outcomes
              — from clean completion to disputes and timeouts. Your principal remains in the escrow
              contract until TEE-verified completion.
            </p>

            <Link
              to="/agent"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm font-medium hover:border-neutral-500 hover:text-white transition-all"
            >
              Post a Bounty
            </Link>
          </motion.div>

          <motion.div variants={fade} custom={1} className="lg:col-span-7 flex justify-end">
            <div className="w-full max-w-md">
            <EscrowCard />
            </div>
            {/* Stats below the mockup, like Octant shows APY/YIELD under their vault */}
            <div className="flex items-center justify-between mt-6 px-2 max-w-md ml-auto">
              <div>
                <div className="text-[10px] text-neutral-600 uppercase tracking-wider">Payout Split</div>
                <div className="text-lg font-bold text-white mt-1">85% / 15%</div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-600 uppercase tracking-wider">Escrow Strategies</div>
                <div className="text-lg font-bold text-white mt-1">6 On-Chain</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <div className="max-w-6xl mx-auto border-t border-neutral-800/50" />

      {/* ── Section 2: Verification (reversed asymmetry) ───────── */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
        className="max-w-6xl mx-auto px-4 py-28 sm:py-40"
      >
        {/* Reversed: demo left, text right (alternating like Octant) */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <motion.div variants={fade} className="lg:col-span-7 order-2 lg:order-1">
            <div className="grid gap-4">
              <VerificationCard />
              {/* Mini stats row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#1f1f1f] shadow-[0_4px_40px_rgba(0,0,0,0.4)] px-5 py-4">
                  <div className="text-[10px] text-neutral-600 uppercase tracking-wider">Tasks Verified</div>
                  <div className="text-2xl font-bold text-white mt-1">1,247</div>
                </div>
                <div className="rounded-2xl bg-[#1f1f1f] shadow-[0_4px_40px_rgba(0,0,0,0.4)] px-5 py-4">
                  <div className="text-[10px] text-neutral-600 uppercase tracking-wider">Pass Rate</div>
                  <div className="text-2xl font-bold text-white mt-1">94.2<span className="text-sm text-neutral-500">%</span></div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fade} custom={1} className="lg:col-span-5 order-1 lg:order-2">
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">Sealed Verification</h3>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6">
              Evidence is verified inside an Intel TDX hardware enclave running 0G Sealed Inference.
              The AI model sees the evidence, but raw data never leaves the TEE. Results are
              cryptographically attested.
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8">
              No human reviewer, no centralized arbiter. Just math and silicon.
            </p>

            <Link
              to="/verification"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-neutral-700 text-neutral-400 text-sm font-medium hover:border-neutral-500 hover:text-white transition-all"
            >
              View Verification
            </Link>
          </motion.div>
        </div>
      </motion.section>

      <div className="max-w-6xl mx-auto border-t border-neutral-800/50" />

      {/* ── Section 3: Encryption Pipeline ─────────────────────── */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
        className="max-w-6xl mx-auto px-4 py-28 sm:py-40"
      >
        <motion.div variants={fade} className="text-center mb-20">
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl">
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float">✦</span>
            {' '}Architecturally Blind
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float" style={{ animationDelay: '1.5s' }}>✦</span>
          </h2>
          <p className="text-neutral-500 max-w-lg mx-auto mt-5 leading-relaxed">
            The platform itself cannot read task content, evidence, or verification reasoning. Privacy is the architecture, not a policy.
          </p>
        </motion.div>

        {/* Asymmetric: text left, encryption demo right */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <motion.div variants={fade} className="lg:col-span-5">
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">End-to-End Encryption</h3>
            <p className="text-sm text-neutral-500 leading-relaxed mb-8">
              Every task is encrypted with AES-256-GCM before leaving the browser. Keys are wrapped
              with ECIES so only the assigned worker can decrypt. Even the platform cannot read
              task instructions.
            </p>

            {/* Lifecycle steps — clean vertical list like Octant's allocation list */}
            <div className="space-y-4">
              {[
                { n: '01', label: 'Post & Escrow', desc: 'Agent posts task, tokens lock on-chain' },
                { n: '02', label: 'Encrypt & Store', desc: 'Instructions encrypted, stored on 0G' },
                { n: '03', label: 'Assign Worker', desc: 'Worker applies, agent assigns by wallet' },
                { n: '04', label: 'Execute Blind', desc: 'Worker decrypts, completes privately' },
                { n: '05', label: 'TEE Verify', desc: 'Evidence verified inside hardware enclave' },
                { n: '06', label: 'Release Funds', desc: 'Smart contract splits payment on pass' },
              ].map((s, i) => (
                <div key={s.n} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-amber-400 font-bold">{s.n}</span>
                    </div>
                    {i < 5 && <div className="w-px h-4 bg-neutral-800 mt-1" />}
                  </div>
                  <div className="pt-1">
                    <div className="text-sm text-white font-medium">{s.label}</div>
                    <div className="text-xs text-neutral-600">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fade} custom={1} className="lg:col-span-7">
            <EncryptionPipelineCard />
          </motion.div>
        </div>
      </motion.section>

      <div className="max-w-6xl mx-auto border-t border-neutral-800/50" />

      {/* ── Section 4: Two-Way Execution + Use Cases ──────────── */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
        className="max-w-6xl mx-auto px-4 py-28 sm:py-40"
      >
        <motion.div variants={fade} className="text-center mb-16">
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl">
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float">✦</span>
            {' '}Two-Way Execution
            <span className="text-amber-400 text-sm align-top relative -top-4 inline-block animate-float" style={{ animationDelay: '2s' }}>✦</span>
          </h2>
          <p className="text-neutral-500 max-w-md mx-auto mt-5 leading-relaxed">
            Agents delegate to humans. Humans commission agents. Both sides stay blind to each other&apos;s data.
          </p>
        </motion.div>

        {/* Two-column feature tiles (like Octant's Yield Recipes 2x2) */}
        <div className="grid md:grid-cols-2 gap-px bg-neutral-700/30 rounded-3xl overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.4)]">
          {[
            {
              badge: 'A2H', badgeLabel: 'Agent → Human',
              title: 'AI Delegates to Humans',
              items: [
                'Photograph a storefront for competitive intelligence',
                'Verify a business address exists in-person',
                'Collect field data from a remote location',
                'Label training datasets with domain expertise',
              ],
            },
            {
              badge: 'H2A', badgeLabel: 'Human → Agent',
              title: 'Humans Commission AI Agents',
              items: [
                'Analyze encrypted medical records via TEE',
                'Run confidential financial models',
                'Generate reports from sensitive data',
                'Classify documents under NDA',
              ],
            },
          ].map((uc) => (
            <motion.div key={uc.badge} variants={fade} className="bg-[#1f1f1f] p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {uc.badge}
                </span>
                <span className="text-xs text-neutral-600">{uc.badgeLabel}</span>
              </div>
              <h3 className="text-lg text-white font-semibold mb-5">{uc.title}</h3>
              <div className="space-y-3">
                {uc.items.map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="w-1 h-1 rounded-full bg-neutral-600 mt-2 flex-shrink-0" />
                    <span className="text-sm text-neutral-500">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="max-w-6xl mx-auto border-t border-neutral-800/50" />

      {/* ── Section 5: Escrow Strategies grid ──────────────────── */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger}
        className="max-w-6xl mx-auto px-4 py-28 sm:py-40"
      >
        <motion.div variants={fade} className="text-center mb-16">
          <span className="section-label">On-Chain Logic</span>
          <h2 className="heading-display text-4xl sm:text-5xl mt-3 mb-4">
            6 Escrow Strategies
          </h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            The full spectrum of task outcomes, handled on-chain.
          </p>
        </motion.div>

        {/* Simple list with thin line dividers — no cards */}
        <div className="grid sm:grid-cols-2 gap-x-16">
          {[
            { name: 'Standard Release', desc: 'TEE passes → payout splits automatically' },
            { name: 'Retry on Failure', desc: 'Worker resubmits evidence up to 3 times' },
            { name: 'Agent Cancel', desc: 'Cancel before assignment → full refund' },
            { name: 'Timeout Reclaim', desc: 'Deadline expires → agent reclaims funds' },
            { name: 'Dispute Arbitration', desc: 'Either party disputes → admin resolves' },
            { name: 'Worker-Favored', desc: 'Worker wins dispute → payment released' },
          ].map((s, i) => (
            <motion.div
              key={s.name}
              variants={fade}
              custom={i}
              className="py-6 border-t border-neutral-800"
            >
              <h3 className="text-white font-medium mb-1">{s.name}</h3>
              <p className="text-sm text-neutral-500">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── CTA (Octant-style: illustration-feel with text) ───── */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="max-w-6xl mx-auto px-4 pb-28"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side: decorative code block (in place of Octant's illustration) */}
          <motion.div variants={fade} className="rounded-3xl bg-[#1f1f1f] shadow-[0_4px_40px_rgba(0,0,0,0.4)] overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-neutral-700/20">
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <div className="w-2 h-2 rounded-full bg-neutral-700" />
              <span className="ml-2 text-[10px] text-neutral-500 font-mono">crypto.ts</span>
            </div>
            <pre className="p-5 text-[11px] font-mono leading-[1.8] text-neutral-400 overflow-x-auto">
              <code>
{`// Agent encrypts task (A2H)
const aesKey = generateAesKey();
const encrypted = aesEncrypt(data, aesKey);
const wrapped = eciesEncrypt(
  aesKey,
  workerPubKey  // only worker can decrypt
);

// Upload to 0G Storage
const { rootHash } = await upload(encrypted);

// Lock payment in BlindEscrow
await escrow.createTask(
  sha256(encrypted),
  token,
  amount
);`}
              </code>
            </pre>
          </motion.div>

          {/* Right side: CTA text */}
          <motion.div variants={fade} custom={1}>
            <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl mb-5">
              <span className="text-amber-400 text-xs align-top relative -top-3 inline-block">✦</span>
              {' '}Get Started with{' '}
              <br />
              BlindBounty
              <span className="text-amber-400 text-xs align-top relative -top-3 inline-block">✦</span>
            </h2>
            <p className="text-neutral-500 mb-8 max-w-sm leading-relaxed">
              Connect your wallet on 0G Testnet and start posting or executing bounties. Privacy-first, on-chain.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/tasks"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-neutral-600 text-neutral-300 text-sm font-medium hover:border-white hover:text-white transition-all"
              >
                Launch App
              </Link>
              <a
                href="https://github.com/JemIIahh/BlindBounty"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                View Source →
              </a>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── Footer (Octant-style: multi-column) ────────────────── */}
      <footer className="border-t border-neutral-800/50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Logo column */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white">BlindBounty</span>
              </div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Anonymous task marketplace for the agentic economy.
              </p>
            </div>

            {/* Links columns */}
            <div>
              <h5 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Product</h5>
              <div className="space-y-2">
                <Link to="/tasks" className="block text-xs text-neutral-600 hover:text-white transition-colors">Browse Tasks</Link>
                <Link to="/agent" className="block text-xs text-neutral-600 hover:text-white transition-colors">Agent Dashboard</Link>
                <Link to="/worker" className="block text-xs text-neutral-600 hover:text-white transition-colors">Worker View</Link>
              </div>
            </div>
            <div>
              <h5 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Resources</h5>
              <div className="space-y-2">
                <a href="https://github.com/JemIIahh/BlindBounty" target="_blank" rel="noopener noreferrer" className="block text-xs text-neutral-600 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="block text-xs text-neutral-600 hover:text-white transition-colors">Documentation</a>
              </div>
            </div>
            <div>
              <h5 className="text-[10px] text-neutral-500 uppercase tracking-widest mb-3">Built On</h5>
              <div className="space-y-2">
                <span className="block text-xs text-neutral-600">0G Chain</span>
                <span className="block text-xs text-neutral-600">0G Storage</span>
                <span className="block text-xs text-neutral-600">0G Compute</span>
                <span className="block text-xs text-neutral-600">0G DA</span>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] text-neutral-700">© 2026 BlindBounty. Built for 0G APAC Hackathon.</span>
            <div className="flex items-center gap-4">
              <a href="https://github.com/JemIIahh/BlindBounty" target="_blank" rel="noopener noreferrer" className="text-neutral-700 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
