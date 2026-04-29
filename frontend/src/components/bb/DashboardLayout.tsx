import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChainBanner } from '../ChainBanner';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function DashboardLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const dist = reduceMotion ? 0 : 8;

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className="ml-[240px] flex flex-col min-h-screen">
        <TopBar />
        <ChainBanner />
        <main className="flex-1 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: dist }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -dist }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
