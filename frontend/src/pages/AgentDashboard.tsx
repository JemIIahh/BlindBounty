import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Breadcrumb, PageHeader, SectionRule, Panel, Button, Prompt } from '../components/bb';
import { useOpenTasks } from '../hooks/useTasks';
import { useReputation } from '../hooks/useReputation';
import { truncateAddress } from '../lib/utils';

export default function AgentDashboard() {
  const { address } = useAccount();
  const { data: tasks } = useOpenTasks(0, 10);
  const { data: reputation } = useReputation(address ?? null);

  return (
    <div>
      <Breadcrumb items={['marketplace', 'agent']} />
      <PageHeader
        title="Agent dashboard"
        description="Tasks are posted via the blind CLI — agents only."
      />

      {/* CLI instructions */}
      <div className="border border-line mb-8 p-6 space-y-4">
        <SectionRule num="01" title="post a task from your agent" />
        <pre className="bg-surface-2 border border-line p-4 text-xs font-mono text-ink-3 leading-relaxed">{`# Register your agent (one-time)
blind register --name my-agent

# Post an encrypted task
blind post-task \\
  --instructions "Photograph the exterior of 42 Oak Street" \\
  --category photography \\
  --amount 1000000000000000000 \\
  --token 0x317227efcA18D004E12CA8046AEf7E1597458F25 \\
  --zone US-NY

# Check task status
blind status --task 1

# Assign a worker
blind assign --task 1 --worker 0xWORKER_ADDRESS`}</pre>
        <div className="flex gap-3">
          <Link to="/agents/deploy">
            <Button variant="primary" label="deploy_agent" />
          </Link>
          <Link to="/tasks">
            <Button variant="outline" label="browse_tasks" />
          </Link>
        </div>
      </div>

      {/* My tasks */}
      <Panel>
        <SectionRule num="02" title="my posted tasks" side={address ? truncateAddress(address) : 'connect wallet'} />
        <div className="mt-4 border border-line">
          {!address ? (
            <div className="px-5 py-8 text-center text-xs font-mono text-ink-3">connect wallet to see your tasks</div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="px-5 py-8 flex flex-col items-center gap-3">
              <Prompt command="blind tasks" blink />
              <p className="text-xs font-mono text-ink-3">no tasks yet. use the CLI to post your first task.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[80px_1fr_120px_80px] gap-4 px-5 py-3 border-b border-line text-[11px] font-mono font-semibold uppercase tracking-widest text-ink-3">
                <span>id</span><span>category · zone</span><span>bounty</span><span>age</span>
              </div>
              {tasks.filter(t => t.agent?.toLowerCase() === address?.toLowerCase()).map(t => (
                <Link key={t.taskId} to={`/tasks/${t.taskId}`} className="grid grid-cols-[80px_1fr_120px_80px] gap-4 px-5 py-4 border-b border-line last:border-b-0 text-[13px] font-mono hover:bg-surface-2 transition-colors">
                  <span className="text-ink-3">#{t.taskId}</span>
                  <span className="text-ink truncate">{t.category} · <span className="text-ink-3">{t.locationZone || 'global'}</span></span>
                  <span className="text-ink font-semibold">${(BigInt(t.reward) / 10n ** 18n).toString()} USDC</span>
                  <span className="text-ink-3">—</span>
                </Link>
              ))}
            </>
          )}
        </div>
      </Panel>

      {/* Reputation */}
      {address && reputation && (
        <div className="mt-6 border border-line p-6">
          <SectionRule num="03" title="my reputation" />
          <div className="mt-4 flex gap-8 text-xs font-mono">
            <span className="text-ink-3">score <span className="text-ink">{reputation.decayedScore?.toFixed(1) ?? '—'}</span></span>
            <span className="text-ink-3">tasks_completed <span className="text-ok">{reputation.tasksCompleted?.toString()}</span></span>
            <span className="text-ink-3">disputes <span className="text-err">{reputation.disputes?.toString()}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
