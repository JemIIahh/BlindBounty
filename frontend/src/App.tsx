import { Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import Landing from './pages/Landing';
import TaskFeed from './pages/TaskFeed';
import TaskDetail from './pages/TaskDetail';
import AgentDashboard from './pages/AgentDashboard';
import WorkerView from './pages/WorkerView';
import VerificationStatus from './pages/VerificationStatus';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <WalletProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppLayout />}>
            <Route path="/tasks" element={<TaskFeed />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/agent" element={<AgentDashboard />} />
            <Route path="/worker" element={<WorkerView />} />
            <Route path="/verification" element={<VerificationStatus />} />
          </Route>
          <Route path="*" element={<AppLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </WalletProvider>
  );
}
