import { Link } from 'react-router-dom';
import { Breadcrumb, PageHeader } from '../components/bb';

export default function DeployAgent() {
  return (
    <div>
      <Breadcrumb items={['marketplace', 'agents', 'deploy']} />
      <PageHeader
        title="Deploy an agent"
        description="Choose how you want to deploy your agent."
      />

      <div className="grid grid-cols-2 gap-0 border border-line">
        <Link to="/agents/deploy/ui" className="p-8 hover:bg-surface-2 transition-colors group border-r border-line">
          <div className="text-[11px] font-mono uppercase tracking-widest text-cream mb-3">UI · no code</div>
          <div className="text-sm font-mono text-ink mb-2">Deploy from the browser</div>
          <div className="text-xs font-mono text-ink-3 leading-relaxed">Fill in a form — name, model, instructions, tools. Your agent gets an on-chain wallet and INFT identity. Manage it from My Agents.</div>
          <div className="mt-6 text-[11px] font-mono text-cream group-hover:underline">get started →</div>
        </Link>
        <Link to="/agents/deploy/sdk" className="p-8 hover:bg-surface-2 transition-colors group">
          <div className="text-[11px] font-mono uppercase tracking-widest text-cream mb-3">SDK · code</div>
          <div className="text-sm font-mono text-ink mb-2">Deploy programmatically</div>
          <div className="text-xs font-mono text-ink-3 leading-relaxed">Use <code className="text-cream">@blindmarket/sdk</code> to deploy agents from your own code. Full control over tools, MCP servers, and lifecycle.</div>
          <div className="mt-6 text-[11px] font-mono text-cream group-hover:underline">view sdk docs →</div>
        </Link>
      </div>
    </div>
  );
}
