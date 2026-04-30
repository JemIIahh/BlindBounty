import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Breadcrumb, PageHeader, Button } from '../components/bb';
import { EncryptedFlow } from '../components/landing/EncryptedFlow';

type Persona = 'poster' | 'worker';

export default function HowItWorks() {
  const [persona, setPersona] = useState<Persona>('poster');

  return (
    <div className="max-w-5xl">
      <Breadcrumb items={['docs', 'how_it_works']} />
      <PageHeader
        title="How BlindBounty works"
        description="A walkthrough of what happens when you post a task or accept one — and why neither the platform, the chain, nor anyone except the assigned worker can see what's being done."
      />

      {/* ── 60-second pitch ──────────────────────────────────── */}
      <section className="mt-10 mb-16">
        <SectionTitle num="01" title="The 60-second version" />
        <div className="rounded-2xl border border-line bg-surface p-7 mb-10">
          <p className="text-base text-ink-2 leading-relaxed">
            BlindBounty is a marketplace where <strong className="text-ink">someone with a task</strong> (an AI agent, a business, or another human) hires <strong className="text-ink">someone to do it</strong>. The unusual part: <strong className="text-ink">the task itself is encrypted end-to-end</strong>. Workers see only the category, payout, and rough location until they're picked. The platform — us — never sees the task content at all. When the worker submits proof, an AI verifies it inside a hardware enclave and the smart contract releases payment automatically.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8">
          <div className="text-xs font-mono uppercase tracking-widest text-ink-3 mb-6 text-center">
            the four-step lifecycle
          </div>
          <EncryptedFlow />
        </div>
      </section>

      {/* ── Prereqs ──────────────────────────────────────────── */}
      <section className="mb-16">
        <SectionTitle num="02" title="What you'll need" />
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              t: 'A crypto wallet',
              b: 'MetaMask, Rabby, or any EVM-compatible wallet. We use it for identity and payment — no email, no signup.',
            },
            {
              t: 'Testnet 0G tokens',
              b: 'We\'re live on 0G Galileo testnet. Tokens are free from the official faucet — they have no real value but are needed for gas + escrow.',
            },
            {
              t: 'That\'s it',
              b: 'No KYC. No identity check. No application. Connect your wallet, pick a side (post or work), and you\'re in.',
            },
          ].map((item, i) => (
            <motion.div
              key={item.t}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-3 mb-2">prereq 0{i + 1}</div>
              <h3 className="text-base font-semibold text-ink mb-2">{item.t}</h3>
              <p className="text-sm text-ink-2 leading-relaxed">{item.b}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Persona toggle ───────────────────────────────────── */}
      <section className="mb-16">
        <SectionTitle num="03" title="Step by step" />

        <div className="inline-flex items-center border border-line rounded-full p-1 mb-8 text-xs font-mono">
          <PersonaButton active={persona === 'poster'} onClick={() => setPersona('poster')}>
            I'm posting a task
          </PersonaButton>
          <PersonaButton active={persona === 'worker'} onClick={() => setPersona('worker')}>
            I want to earn
          </PersonaButton>
        </div>

        {persona === 'poster' ? <PosterFlow /> : <WorkerFlow />}
      </section>

      {/* ── Privacy guarantees ───────────────────────────────── */}
      <section className="mb-16">
        <SectionTitle num="04" title="What stays private" />
        <div className="rounded-2xl border border-line overflow-hidden">
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-0 bg-surface px-6 py-3 border-b border-line text-[10px] font-mono uppercase tracking-widest text-ink-3">
            <div>thing</div>
            <div>what we keep secret</div>
            <div>who can see it</div>
          </div>
          {[
            {
              thing: 'Task instructions',
              keep: 'Encrypted with AES-256 in your browser before upload. Stored on 0G Storage as random bytes.',
              who: 'Only the assigned worker',
            },
            {
              thing: 'Worker identity',
              keep: 'Wallet address only. No name, no email, no KYC. Reputation is tied to the wallet.',
              who: 'Public (the wallet, not the human)',
            },
            {
              thing: 'Submitted evidence',
              keep: 'Encrypted before upload. Decrypted only inside an Intel TDX hardware enclave.',
              who: 'Only the AI verifier inside the TEE',
            },
            {
              thing: 'Verification verdict',
              keep: 'Pass / fail signed by the enclave. Written on-chain.',
              who: 'Public (just the result, not the data)',
            },
            {
              thing: 'Payment + escrow',
              keep: 'Visible on the chain explorer. No way around that — it\'s how trustless settlement works.',
              who: 'Public (amounts, not parties\' names)',
            },
          ].map((row, i, arr) => (
            <div
              key={row.thing}
              className={`grid grid-cols-[1fr_2fr_1fr] gap-0 px-6 py-4 text-sm ${i < arr.length - 1 ? 'border-b border-line' : ''}`}
            >
              <div className="font-semibold text-ink">{row.thing}</div>
              <div className="text-ink-2 leading-relaxed pr-4">{row.keep}</div>
              <div className="text-ink-3 leading-relaxed">{row.who}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 0G stack ─────────────────────────────────────────── */}
      <section className="mb-16">
        <SectionTitle num="05" title="What it's built on" />
        <p className="text-sm text-ink-2 leading-relaxed mb-6 max-w-3xl">
          BlindBounty runs entirely on the <strong className="text-ink">0G stack</strong> — a decentralized network purpose-built for AI workloads. Each piece does one thing:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              k: '0G Chain',
              v: 'EVM-compatible L1 where our smart contracts live: task registry, escrow, reputation. This is where bounties get locked and released.',
            },
            {
              k: '0G Storage',
              v: 'Decentralized blob storage. Encrypted task instructions and encrypted evidence land here. No one — including 0G — can decrypt them.',
            },
            {
              k: '0G Compute (Sealed Inference)',
              v: 'GPU TEEs (Intel TDX + NVIDIA H100) that run the verification AI. Evidence is decrypted inside the chip; raw data never leaves.',
            },
            {
              k: '0G DA',
              v: 'Data availability proofs for task metadata — guarantees someone can\'t just pretend a bounty never existed.',
            },
          ].map((row) => (
            <div key={row.k} className="rounded-2xl border border-line bg-surface p-5">
              <div className="font-mono text-sm font-semibold text-cream mb-2">{row.k}</div>
              <p className="text-sm text-ink-2 leading-relaxed">{row.v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="mb-16">
        <SectionTitle num="06" title="Common questions" />
        <div className="space-y-2">
          {[
            {
              q: 'Can BlindBounty read my task instructions?',
              a: 'No. Encryption happens in your browser before upload, with AES-256-GCM. Only the worker you assign can decrypt — the AES key is wrapped to their public key using ECIES. Even if our servers were seized, the ciphertext is useless.',
            },
            {
              q: 'How does the AI verify evidence without seeing it?',
              a: 'It does see it — but only inside a hardware enclave (Intel TDX with an NVIDIA H100 TEE). Memory inside the enclave is encrypted; nothing leaves except a signed verdict (PASS/FAIL). The signature proves the AI ran correctly without exposing the data.',
            },
            {
              q: 'What happens if a worker doesn\'t submit on time?',
              a: 'Each task has a deadline. If it expires, you can reclaim the escrowed funds. If a worker submits and the verifier returns FAIL, the task can be re-assigned or refunded depending on the rules you set when posting.',
            },
            {
              q: 'How are workers selected?',
              a: 'Workers browse the marketplace and apply (they only see metadata: category, location zone, payout, deadline). The poster picks one based on their reputation score and prior completion record. Identity stays anonymous — only the wallet is visible.',
            },
            {
              q: 'What\'s the fee?',
              a: 'On successful verification, 85% of the escrow goes to the worker and 15% to the platform treasury. Released atomically by the smart contract — no manual payouts.',
            },
            {
              q: 'Is this on mainnet?',
              a: 'Not yet. We\'re live on the 0G Galileo testnet (chain id 16602). Mainnet is on the post-hackathon roadmap.',
            },
          ].map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-line bg-surface p-8 mb-10">
        <div className="text-xs font-mono uppercase tracking-widest text-cream mb-3">Ready?</div>
        <h2 className="text-2xl font-bold text-ink mb-3">Pick a side and try it.</h2>
        <p className="text-sm text-ink-2 leading-relaxed mb-6 max-w-2xl">
          Connect your wallet, grab some testnet 0G from the faucet, and either post a bounty or browse open ones. The whole loop — post, assign, verify, pay — runs on testnet so there's nothing to lose.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/agent">
            <Button variant="primary" label="Post a bounty" size="md" />
          </Link>
          <Link to="/tasks">
            <Button variant="outline" label="Browse open tasks" size="md" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────
function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-[10px] font-mono uppercase tracking-widest text-cream">§{num}</span>
      <span className="text-[10px] font-mono uppercase tracking-widest text-ink">{title}</span>
      <span className="flex-1 h-px bg-line" />
    </div>
  );
}

function PersonaButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full transition-colors ${
        active ? 'bg-cream text-bg' : 'text-ink-2 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function StepCard({
  n,
  title,
  body,
  whatYouSee,
}: {
  n: string;
  title: string;
  body: string;
  whatYouSee: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-line bg-surface p-6"
    >
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-cream font-mono text-lg font-bold">{n}</span>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
      </div>
      <p className="text-sm text-ink-2 leading-relaxed mb-4">{body}</p>
      <div className="border-t border-line pt-3 mt-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-ink-3 mb-1">What you'll see</div>
        <p className="text-xs text-ink-3 leading-relaxed">{whatYouSee}</p>
      </div>
    </motion.div>
  );
}

function PosterFlow() {
  const steps = [
    {
      n: '01',
      title: 'Write your task and lock the bounty',
      body: 'Type the instructions like you\'re briefing a freelancer. Set a payout, deadline, category, and rough location zone. When you submit, your browser encrypts the instructions with AES-256 before they leave — the platform never sees the plaintext. The bounty amount gets locked in a smart-contract escrow.',
      whatYouSee: 'A simple form on /agent. After confirming the wallet transaction, your task appears in the marketplace as encrypted metadata only.',
    },
    {
      n: '02',
      title: 'Workers apply — you pick one',
      body: 'Anonymous workers (just wallet + reputation) apply to your task. They see the metadata you posted but not the instructions yet. You pick one based on their reputation and history. The moment you assign, the AES key gets wrapped to the worker\'s public key — they\'re now the only one who can read the task.',
      whatYouSee: 'A list of applicants with their reputation score and completed-job count. One click assigns.',
    },
    {
      n: '03',
      title: 'Worker does the work, submits encrypted evidence',
      body: 'The worker decrypts the instructions locally, completes the task, and uploads encrypted evidence. You don\'t need to review it manually — verification is automated.',
      whatYouSee: 'A status badge moves from "assigned" → "in progress" → "submitted". You don\'t see what they uploaded.',
    },
    {
      n: '04',
      title: 'TEE verifies, escrow releases',
      body: 'The encrypted evidence is sent to a hardware enclave (Intel TDX + NVIDIA H100) where an AI model decrypts and evaluates it. The chip signs a PASS or FAIL verdict. On PASS, the smart contract automatically sends 85% to the worker and 15% to the platform treasury.',
      whatYouSee: 'A "verified" badge with a TEE attestation hash, and a payment confirmation. Total time: usually under 60 seconds.',
    },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {steps.map((s) => (
        <StepCard key={s.n} {...s} />
      ))}
    </div>
  );
}

function WorkerFlow() {
  const steps = [
    {
      n: '01',
      title: 'Browse open tasks anonymously',
      body: 'Connect your wallet and look through the marketplace. You see each task\'s category, payout, deadline, and rough location zone — but the actual instructions stay encrypted until you\'re assigned. Filter by anything that fits your skills or location.',
      whatYouSee: 'A grid on /tasks with filterable cards. Each card shows: $X bounty, category tag, deadline, location zone. No instructions yet.',
    },
    {
      n: '02',
      title: 'Apply — get assigned',
      body: 'Tap "Apply" on a task you can do. The poster reviews applicants by reputation and picks one. If picked, you receive the AES key (wrapped to your public key — only your wallet can unwrap it). At that moment, instructions decrypt in your browser.',
      whatYouSee: 'Status flips from "applied" to "assigned". The full task instructions become readable.',
    },
    {
      n: '03',
      title: 'Do the work, upload evidence',
      body: 'Complete the task. Upload your evidence (a photo, file, video, whatever the task asked for) — your browser encrypts it before upload, so even we can\'t see what you did.',
      whatYouSee: 'A drag-and-drop submission form. After upload, the task moves to "submitted" and you wait for verification.',
    },
    {
      n: '04',
      title: 'Get paid',
      body: 'The AI verifier inside the hardware enclave checks your evidence. If it passes, the smart contract sends 85% of the escrow straight to your wallet — no invoicing, no waiting for the poster to approve. Reputation goes up.',
      whatYouSee: 'A "paid" notification on /earnings with the on-chain payment hash, and your reputation score ticks up.',
    },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {steps.map((s) => (
        <StepCard key={s.n} {...s} />
      ))}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg/30 transition-colors"
      >
        <span className="text-sm font-medium text-ink">{q}</span>
        <span className={`text-cream font-mono text-xs ml-4 transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-4 text-sm text-ink-2 leading-relaxed border-t border-line pt-3"
        >
          {a}
        </motion.div>
      )}
    </div>
  );
}
