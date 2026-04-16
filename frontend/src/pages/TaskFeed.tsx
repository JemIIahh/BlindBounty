import { useState } from 'react';
import { useOpenTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { SkeletonTaskCard } from '../components/ui';
import { Button } from '../components/ui';

export default function TaskFeed() {
  const [page, setPage] = useState(0);
  const limit = 12;
  const { data: tasks, isLoading, error } = useOpenTasks(page * limit, limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-950">Task Feed</h1>
          <p className="text-sm text-neutral-400 mt-1">Open encrypted tasks available for workers</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 mb-6">
          <p className="text-sm text-neutral-500">Failed to load tasks. Is the backend running?</p>
        </div>
      )}

      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonTaskCard key={i} />
          ))}
        </div>
      )}

      {!isLoading && tasks && tasks.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-950 mb-2">No tasks yet</h3>
          <p className="text-sm text-neutral-400">Be the first to create an encrypted task.</p>
        </div>
      )}

      {!isLoading && tasks && tasks.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.taskId} task={task} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-neutral-500">Page {page + 1}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={tasks.length < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
