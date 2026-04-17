import { type ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { ogTestnet } from './config/chains';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import Landing from './pages/Landing';
import TaskFeed from './pages/TaskFeed';
import TaskDetail from './pages/TaskDetail';
import AgentDashboard from './pages/AgentDashboard';
import WorkerView from './pages/WorkerView';
import VerificationStatus from './pages/VerificationStatus';
import HowItWorks from './pages/HowItWorks';
import A2ADashboard from './pages/A2ADashboard';
import NotFound from './pages/NotFound';

const privyAppId = import.meta.env.VITE_PRIVY_APP_ID;
const isValidPrivyId = privyAppId && privyAppId.startsWith('c') && privyAppId.length > 10;

function MaybePrivy({ children }: { children: ReactNode }) {
  if (!isValidPrivyId) return <>{children}</>;
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        defaultChain: ogTestnet,
        supportedChains: [ogTestnet],
        appearance: { theme: 'dark' },
        loginMethods: ['wallet', 'email', 'google', 'twitter'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export default function App() {
  return (
    <MaybePrivy>
      <WalletProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AppLayout />}>
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/tasks" element={<TaskFeed />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/agent" element={<AgentDashboard />} />
              <Route path="/worker" element={<WorkerView />} />
              <Route path="/verification" element={<VerificationStatus />} />
              <Route path="/a2a" element={<A2ADashboard />} />
            </Route>
            <Route path="*" element={<AppLayout />}>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </WalletProvider>
    </MaybePrivy>
  );
}
