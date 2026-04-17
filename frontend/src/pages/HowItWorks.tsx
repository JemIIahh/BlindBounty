import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: d * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ── Types ─────────────────────────────────────────────────────── */
interface Step {
  n: string;
  title: string;
  short: string;
  icon: ReactNode;
  tags: string[];
  color: string;
}

interface ColorScheme {
  bg: string;
  border: string;
  text: string;
  glow: string;
  tagBg: string;
  tagText: string;
  line: string;
  dotBg: string;
}

/* ── Step Data ─────────────────────────────────────────────────── */
const steps: Step[] = [
  {
    n: '01', title: 'Post Bounty',
    short: 'Agent encrypts instructions, locks payment in escrow',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    tags: ['AES-256', '0G Storage', 'Escrow Lock'], color: 'amber',
  },
  {
    n: '02', title: 'Browse & Apply',
    short: 'Workers see metadata only — instructions stay hidden',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
    tags: ['Metadata Only', 'Reputation Score', 'No PII'], color: 'blue',
  },
  {
    n: '03', title: 'Assign Worker',
    short: 'Key wrapped with ECIES — only assignee can decrypt',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
    tags: ['ECIES Wrap', 'On-Chain', 'Deadline Set'], color: 'purple',
  },
  {
    n: '04', title: 'Execute Blind',
    short: 'Worker decrypts locally, completes task, uploads evidence',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    tags: ['Local Decrypt', 'Real-World Task', 'Encrypted Upload'], color: 'emerald',
  },
  {
    n: '05', title: 'TEE Verify',
    short: 'AI verifies evidence inside hardware enclave — data never leaves',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    tags: ['Intel TDX', 'Zero Exposure', 'Attested Result'], color: 'cyan',
  },
  {
    n: '06', title: 'Release Payment',
    short: 'Escrow auto-splits: 85% worker, 15% platform',
    icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    tags: ['Auto-Split', '3 Retries', 'Dispute Path'], color: 'amber',
  },
];

const colorMap: Record<string, ColorScheme> = {
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400',   glow: 'shadow-[0_0_24px_rgba(245,158,11,0.06)]', tagBg: 'bg-amber-500/10',   tagText: 'text-amber-400/80',   line: 'from-amber-500/20',   dotBg: 'bg-amber-400' },
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400',    glow: 'shadow-[0_0_24px_rgba(59,130,246,0.06)]',  tagBg: 'bg-blue-500/10',    tagText: 'text-blue-400/80',    line: 'from-blue-500/20',    dotBg: 'bg-blue-400' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400',  glow: 'shadow-[0_0_24px_rgba(168,85,247,0.06)]',  tagBg: 'bg-purple-500/10',  tagText: 'text-purple-400/80',  line: 'from-purple-500/20',  dotBg: 'bg-purple-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'shadow-[0_0_24px_rgba(16,185,129,0.06)]',  tagBg: 'bg-emerald-500/10', tagText: 'text-emerald-400/80', line: 'from-emerald-500/20', dotBg: 'bg-emerald-400' },
  cyan:    { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400',    glow: 'shadow-[0_0_24px_rgba(6,182,212,0.06)]',   tagBg: 'bg-cyan-500/10',    tagText: 'text-cyan-400/80',    line: 'from-cyan-500/20',    dotBg: 'bg-cyan-400' },
};

/* ── Step Card (reusable) ──────────────────────────────────────── */
function StepCard({ step, c }: { step: Step; c: ColorScheme }) {
  return (
    <div className={`card-dark p-5 ${c.border} ${c.glow}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center ${c.text}`}>
          {step.icon}
        </div>
        <div>
          <span className={`font-mono text-[11px] font-bold ${c.text} opacity-60`}>STEP {step.n}</span>
          <h3 className="text-white font-semibold text-base leading-tight">{step.title}</h3>
        </div>
      </div>
      <p className="text-neutral-400 text-sm leading-relaxed mb-3">{step.short}</p>
      <div className="flex flex-wrap gap-1.5">
        {step.tags.map((tag) => (
          <span key={tag} className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${c.tagBg} ${c.tagText} border ${c.border}`}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Bottom section data ───────────────────────────────────────── */
const privacyItems = [
  { label: 'Instructions', note: 'AES-256 encrypted', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
  { label: 'Evidence', note: 'TEE-verified, never exposed', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
  { label: 'Identity', note: 'Wallet + reputation only', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { label: 'Platform', note: 'Cannot read any content', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> },
];

const outcomes = [
  { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>, label: 'Auto Release', note: '85/15 split on pass', color: 'text-emerald-400' },
  { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>, label: 'Retry', note: 'Up to 3 resubmits', color: 'text-blue-400' },
  { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>, label: 'Cancel', note: 'Full refund pre-assign', color: 'text-neutral-400' },
  { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Timeout', note: 'Agent reclaims funds', color: 'text-amber-400' },
  { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>, label: 'Dispute', note: 'Admin arbitration', color: 'text-purple-400' },
  { icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>, label: 'Worker Wins', note: 'Full payout on appeal', color: 'text-cyan-400' },
];

const techStack = [
  { name: '0G Chain', role: 'Smart Contracts' },
  { name: '0G Storage', role: 'Encrypted Blobs' },
  { name: '0G Compute', role: 'TEE Inference' },
  { name: '0G DA', role: 'Data Availability' },
];

/* ── Page ──────────────────────────────────────────────────────── */
export default function HowItWorks() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center mb-20">
        <motion.span variants={fade} className="section-label">How It Works</motion.span>
        <motion.h1 variants={fade} custom={1} className="heading-display text-4xl sm:text-5xl mt-3 mb-4">
          From Bounty to Payout
        </motion.h1>
        <motion.p variants={fade} custom={2} className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
          Six steps. Fully encrypted. The platform never sees task content.
        </motion.p>
      </motion.div>

      {/* Flow Steps — alternating timeline */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="relative"
      >
        {/* Vertical line (desktop) */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-neutral-800 via-neutral-700/50 to-neutral-800 -translate-x-px" />

        {steps.map((step, i) => {
          const c = colorMap[step.color];
          const isLeft = i % 2 === 0;

          return (
            <motion.div key={step.n} variants={fade} custom={i} className="relative mb-6 last:mb-0">
              {/* Desktop layout */}
              <div className="hidden md:grid md:grid-cols-[1fr_32px_1fr] items-center">
                <div className={isLeft ? 'pr-8' : ''}>
                  {isLeft && <StepCard step={step} c={c} />}
                </div>
                <div className="flex justify-center relative z-10">
                  <div className={`w-4 h-4 rounded-full border-2 ${c.border} ${c.bg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${c.dotBg} mx-auto mt-[3px]`} />
                  </div>
                </div>
                <div className={!isLeft ? 'pl-8' : ''}>
                  {!isLeft && <StepCard step={step} c={c} />}
                </div>
              </div>

              {/* Mobile layout — simple stack */}
              <div className="md:hidden">
                <StepCard step={step} c={c} />
              </div>

              {/* Mobile connector line */}
              {i < steps.length - 1 && (
                <div className="md:hidden flex justify-center py-2">
                  <div className={`w-px h-8 bg-gradient-to-b ${c.line} to-transparent`} />
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Privacy Guarantees */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="mt-24"
      >
        <motion.div variants={fade} className="text-center mb-8">
          <span className="section-label">Privacy Guarantees</span>
          <h2 className="heading-display text-2xl sm:text-3xl mt-2">What Stays Hidden</h2>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {privacyItems.map((item, i) => (
            <motion.div key={item.label} variants={fade} custom={i} className="card-dark p-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-2.5 text-amber-400">
                {item.icon}
              </div>
              <p className="text-white text-sm font-medium mb-0.5">{item.label}</p>
              <p className="text-neutral-500 text-[11px] leading-snug">{item.note}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Escrow Outcomes */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="mt-20"
      >
        <motion.div variants={fade} className="text-center mb-8">
          <span className="section-label">On-Chain Logic</span>
          <h2 className="heading-display text-2xl sm:text-3xl mt-2">6 Escrow Outcomes</h2>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {outcomes.map((o, i) => (
            <motion.div key={o.label} variants={fade} custom={i} className="card-dark p-4 flex items-start gap-3">
              <span className={`${o.color} mt-0.5`}>{o.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{o.label}</p>
                <p className="text-neutral-500 text-[11px]">{o.note}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tech Stack */}
      <motion.div
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        className="mt-20 mb-8"
      >
        <motion.div variants={fade} className="text-center mb-6">
          <span className="section-label">Infrastructure</span>
          <h2 className="heading-display text-2xl sm:text-3xl mt-2">Built on 0G</h2>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-3">
          {techStack.map((t, i) => (
            <motion.div key={t.name} variants={fade} custom={i} className="card-dark px-5 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500/60" />
              <div>
                <p className="text-white text-sm font-medium">{t.name}</p>
                <p className="text-neutral-500 text-[10px] tracking-wide uppercase">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
