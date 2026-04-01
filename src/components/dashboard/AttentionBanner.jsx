import { AlertCircle } from 'lucide-react';

export default function AttentionBanner({ overdueTasks, overloadedMembers, projects, capacityPct, onReassign, onSnooze }) {
  if (overdueTasks.length === 0 && overloadedMembers.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-[6px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-bold text-amber-900">Needs Attention</span>
      </div>
      <div className="space-y-2">
        {overdueTasks.map(task => {
          const proj = projects.find(p => p.id === task.projectId);
          return (
            <div key={task.id} className="flex items-center justify-between text-sm group">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                <span className="font-medium text-stone-900 truncate">{task.title}</span>
                {proj && <span className="text-stone-400 flex-shrink-0">— {proj.name}</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-stone-400 font-mono group-hover:hidden">
                  {Array.isArray(task.assignedTo) ? task.assignedTo.join(', ') : task.assignedTo}
                </span>
                <div className="hidden group-hover:flex items-center gap-2">
                  {onReassign && (
                    <button
                      onClick={() => onReassign(task)}
                      className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Reassign
                    </button>
                  )}
                  {onSnooze && (
                    <button
                      onClick={() => onSnooze(task)}
                      className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      Delay
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {overloadedMembers.map(m => (
          <div key={m.name} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
            <span className="font-medium text-stone-900">{m.name}</span>
            <span className="text-stone-400 font-mono">overloaded — {m.activeTasks} tasks ({capacityPct(m)}% capacity)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
