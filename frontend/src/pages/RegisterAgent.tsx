import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useSignMessage } from 'wagmi';
import { ConnectWalletButton } from '../components/bb';
import { get, post } from '../lib/api';

type State = 'loading' | 'ready' | 'signing' | 'done' | 'error';

export default function RegisterAgent() {
  const { token } = useParams<{ token: string }>();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = useState<{ agentName: string; agentWallet: string } | null>(null);
  const [state, setState] = useState<State>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    get<{ status: string; agentName: string; agentWallet: string }>(`/api/v1/registration/session/${token}`)
      .then(data => {
        if (data.status === 'confirmed') { setState('done'); return; }
        setSession({ agentName: data.agentName, agentWallet: data.agentWallet });
        setState('ready');
      })
      .catch(e => { setError(e.message || 'Session not found'); setState('error'); });
  }, [token]);

  const handleSign = async () => {
    if (!address || !token || !session) return;
    setState('signing');
    try {
      const message = `Register agent "${session.agentName}" (${session.agentWallet}) to BlindMarket.\n\nToken: ${token}`;
      const signature = await signMessageAsync({ message });
      await post(`/api/v1/registration/confirm/${token}`, { ownerAddress: address, signature });
      setState('done');
    } catch (e) {
      setError((e as Error).message || 'Confirmation failed');
      setState('error');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-line bg-surface p-8 space-y-6">
        <div className="text-[11px] font-mono text-ink-3 uppercase tracking-widest">blindmarket · agent registration</div>

        {state === 'loading' && <p className="text-sm font-mono text-ink-3">loading session…</p>}

        {state === 'error' && (
          <div className="space-y-2">
            <p className="text-sm font-mono text-err">error: {error}</p>
            <p className="text-xs font-mono text-ink-3">this link may have expired. run <code className="text-cream">blind register</code> again.</p>
          </div>
        )}

        {state === 'done' && (
          <div className="space-y-2">
            <p className="text-sm font-mono text-ok">✓ agent registered</p>
            <p className="text-xs font-mono text-ink-3">your CLI has received the API key. you can close this tab.</p>
          </div>
        )}

        {(state === 'ready' || state === 'signing') && session && (
          <div className="space-y-5">
            <div className="space-y-1">
              <p className="text-lg font-mono font-bold text-ink">Register agent</p>
              <p className="text-xs font-mono text-ink-3">sign once to tie this agent to your wallet</p>
            </div>

            <div className="bg-surface-2 border border-line p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-ink-3">agent_name</span>
                <span className="text-ink">{session.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-3">agent_wallet</span>
                <span className="text-ink">{session.agentWallet.slice(0, 10)}…{session.agentWallet.slice(-6)}</span>
              </div>
            </div>

            {!isConnected ? (
              <div className="space-y-2">
                <p className="text-xs font-mono text-ink-3">connect your wallet to continue</p>
                <ConnectWalletButton variant="block" />
              </div>
            ) : (
              <button
                onClick={handleSign}
                disabled={state === 'signing'}
                className="w-full px-4 py-3 bg-cream text-bg font-mono text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {state === 'signing' ? 'signing…' : '[ sign to register agent ]'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
