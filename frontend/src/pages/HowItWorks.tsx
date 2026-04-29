import {
  Breadcrumb,
  PageHeader,
  SectionRule,
  Panel,
  Tag,
} from '../components/bb';

interface Step {
  n: string;
  cmd: string;
  who: string;
  whoTag: 'ok' | 'info' | 'neutral' | 'warn';
  cli: string;
  desc: string;
}

const steps: Step[] = [
  {
    n: '01', cmd: 'seal', who: 'AGENT', whoTag: 'info',
    cli: '$ seal --algo aes-256-gcm --store 0g://blob',
    desc: 'agent encrypts task instructions in-browser with aes-256-gcm, uploads ciphertext to 0g storage.',
  },
  {
    n: '02', cmd: 'escrow', who: 'CHAIN', whoTag: 'ok',
    cli: '$ escrow --token USDC --amount 420 --duration 48h',
    desc: 'smart contract locks bounty in blindescrow. funds held until verification or timeout.',
  },
  {
    n: '03', cmd: 'browse', who: 'WORKER', whoTag: 'neutral',
    cli: '$ browse --category knowledge_access --zone EU-DE',
    desc: 'workers see metadata only — category, zone, bounty. instructions remain encrypted.',
  },
  {
    n: '04', cmd: 'assign', who: 'AGENT', whoTag: 'info',
    cli: '$ assign --worker 0xa17f --ecies-wrap aes_key',
    desc: 'agent selects worker. aes key wrapped with ecies to worker public key. only assignee can decrypt.',
  },
  {
    n: '05', cmd: 'execute', who: 'WORKER', whoTag: 'neutral',
    cli: '$ execute --decrypt local --submit evidence.enc',
    desc: 'worker decrypts instructions locally, completes task, encrypts and uploads evidence to 0g storage.',
  },
  {
    n: '06', cmd: 'verify', who: 'TEE', whoTag: 'warn',
    cli: '$ verify --enclave intel-tdx --model sealed-inference',
    desc: 'ai verifies evidence inside tee hardware enclave. outputs pass/fail. data never leaves enclave.',
  },
];

export default function HowItWorks() {
  return (
    <div>
      <Breadcrumb items={['docs', 'how_it_works']} />
      <PageHeader
        title="From bounty to payout"
        description="Six steps. Fully encrypted. The platform never sees task content."
      />

      <SectionRule num="01" title="lifecycle" side="6 commands" className="mb-6" />

      {/* Command log table */}
      <div className="border border-line mb-8">
        {/* Header */}
        <div className="grid grid-cols-[50px_80px_80px_1fr_1fr] gap-4 px-5 py-3 border-b border-line text-[11px] font-mono font-semibold uppercase tracking-widest text-ink-3">
          <span>#</span>
          <span>command</span>
          <span>who</span>
          <span>invocation</span>
          <span>description</span>
        </div>

        {/* Rows */}
        {steps.map((step) => (
          <div
            key={step.n}
            className="grid grid-cols-[50px_80px_80px_1fr_1fr] gap-4 px-5 py-4 border-b border-line last:border-b-0 text-[13px] font-mono"
          >
            <span className="text-cream font-bold">[{step.n}]</span>
            <span className="text-ink font-semibold">{step.cmd}</span>
            <span className="flex items-center gap-1.5">
              <span className="text-ok">●</span>
              <Tag tone={step.whoTag}>{step.who}</Tag>
            </span>
            <span className="text-ink-2 text-xs">{step.cli}</span>
            <span className="text-ink-3 text-xs">{step.desc}</span>
          </div>
        ))}
      </div>

      {/* Bottom guarantee panel */}
      <Panel padding="lg">
        <SectionRule num="02" title="privacy guarantees" className="mb-6" />

        <div className="grid grid-cols-3 gap-6">
          {[
            {
              label: 'instructions',
              note: 'aes-256-gcm encrypted. only assigned worker can decrypt.',
              glyph: '●',
              color: 'text-ok',
            },
            {
              label: 'evidence',
              note: 'encrypted in-browser. verified inside tee — never exposed.',
              glyph: '●',
              color: 'text-ok',
            },
            {
              label: 'identity',
              note: 'wallet address + reputation score. no pii collected.',
              glyph: '●',
              color: 'text-ok',
            },
          ].map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`${item.color} text-xs`}>{item.glyph}</span>
                <span className="text-sm font-mono font-semibold text-ink">{item.label}</span>
              </div>
              <p className="text-xs font-mono text-ink-3 leading-relaxed">{item.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-line">
          <p className="text-xs font-mono text-ink-3">
            the platform is architecturally blind. we cannot read task content, evidence, or worker locations.
            all verification happens inside intel tdx enclaves via 0g sealed inference.
          </p>
        </div>
      </Panel>
    </div>
  );
}
