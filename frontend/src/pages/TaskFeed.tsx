import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOpenTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { SkeletonTaskCard } from '../components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function TaskFeed() {
  const [page, setPage] = useState(0);
  const limit = 12;
  const { data: tasks, isLoading, error } = useOpenTasks(page * limit, limit);

  return (
    <div>
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-10">
        <h1 className="heading-display text-3xl sm:text-4xl mb-2">Task Feed</h1>
        <p className="text-sm text-neutral-500">Open encrypted tasks available for workers</p>
      </motion.div>

      {error && (
        <div className="card-dark p-4 mb-6 border-red-900/50">
          <p className="text-sm text-red-400">Failed to load tasks. Is the backend running?</p>
        </div>
      )}

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonTaskCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && tasks && tasks.length === 0 && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center py-24">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-display text-white mb-2">No tasks yet</h3>
          <p className="text-sm text-neutral-500">Be the first to create an encrypted task.</p>
        </motion.div>
      )}

      {!isLoading && tasks && tasks.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tasks.map((task, i) => (
              <motion.div
                key={task.taskId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              className="px-5 py-2 rounded-lg border border-neutral-800 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-all disabled:opacity-30 disabled:hover:text-neutral-400 disabled:hover:border-neutral-800"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span className="px-4 py-2 rounded-lg bg-surface border border-neutral-800 text-sm font-medium text-white">
              {page + 1}
            </span>
            <button
              className="px-5 py-2 rounded-lg border border-neutral-800 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-all disabled:opacity-30 disabled:hover:text-neutral-400 disabled:hover:border-neutral-800"
              disabled={tasks.length < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
