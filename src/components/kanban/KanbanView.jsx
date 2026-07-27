import { useState, useMemo } from 'react';
import { Trello, GripVertical, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar, StatusBadge, PriorityBadge } from '../ui';
import { fmtShort } from '../../lib/utils';

// Per-person Kanban board. One column per active team member.
// Managers (canEditProjects) can drag a card to another column to reassign it.
export default function KanbanView() {
  const {
    activeMembers, tasksWithStatus, projects,
    canEditProjects, canViewAllProjects, capacityPct, getWorkload,
    updateTask,
  } = useData();
  const { currentUser } = useAuth();

  const canReassign = canEditProjects(currentUser);
  const isManager = canViewAllProjects(currentUser);

  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const projectName = (id) => projects.find(p => p.id === id)?.name || 'No project';

  // Only show active, non-completed tasks on the board.
  const boardTasks = useMemo(
    () => tasksWithStatus.filter(t => t.status !== 'completed'),
    [tasksWithStatus]
  );

  const UNASSIGNED = '__unassigned__';

  // Columns = every active member (team members only see their own column).
  const columns = useMemo(() => {
    const members = isManager
      ? activeMembers
      : activeMembers.filter(m => m.name === currentUser);
    return members.map(m => {
      const tasks = boardTasks.filter(t => {
        const a = Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo];
        return a.includes(m.name);
      });
      return { member: m, tasks };
    });
  }, [activeMembers, boardTasks, isManager, currentUser]);

  // Tasks with no active assignee (e.g. owner was deactivated) surface in an Unassigned column.
  const unassignedTasks = useMemo(() => {
    const activeNames = new Set(activeMembers.map(m => m.name));
    return boardTasks.filter(t => {
      const a = (Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo]).filter(Boolean);
      return a.length === 0 || !a.some(n => activeNames.has(n));
    });
  }, [boardTasks, activeMembers]);

  const workload = getWorkload();
  const memberCapacity = (name) => {
    const m = workload.find(w => w.name === name);
    return m ? capacityPct(m) : 0;
  };

  const handleDrop = (targetName) => {
    setDragOverCol(null);
    const id = draggingId;
    setDraggingId(null);
    if (!id || !canReassign) return;
    const task = boardTasks.find(t => t.id === id);
    if (!task) return;
    const current = (Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]).filter(Boolean);
    if (targetName === UNASSIGNED) {
      if (current.length === 0) return;
      updateTask(id, { assignedTo: [] });
      return;
    }
    if (current.length === 1 && current[0] === targetName) return; // dropped on same person
    updateTask(id, { assignedTo: [targetName] });
  };

  const renderCard = (task) => (
    <div
      key={task.id}
      draggable={canReassign}
      onDragStart={() => setDraggingId(task.id)}
      onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
      className={`group bg-white border rounded-[6px] p-2.5 transition-all ${
        draggingId === task.id ? 'opacity-40' : 'hover:-translate-y-px'
      } ${task.status === 'delayed' ? 'border-red-200' : 'border-stone-200'} ${
        canReassign ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        {canReassign && (
          <GripVertical className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-400 flex-shrink-0 mt-0.5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-stone-900 leading-snug">{task.title}</div>
          <div className="text-xs text-stone-400 font-mono mt-0.5 truncate">{projectName(task.projectId)}</div>
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-stone-400 font-mono">
            <span className={task.status === 'delayed' ? 'text-red-600 font-medium flex items-center gap-1' : ''}>
              {task.status === 'delayed' && <AlertTriangle className="w-3 h-3" />}
              Due {fmtShort(task.dueDate)}
            </span>
            {task.estimatedHours ? <span>{task.estimatedHours}h</span> : null}
          </div>
        </div>
      </div>
    </div>
  );

  const cardsBody = (tasks, isOver, emptyLabel) => (
    <div className="p-2 space-y-2 flex-1 min-h-[120px]">
      {tasks.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-stone-300 font-mono py-8">
          {isOver ? 'Drop here' : emptyLabel}
        </div>
      ) : tasks.map(renderCard)}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-light text-stone-900 font-serif tracking-tight flex items-center gap-2">
            <Trello className="w-6 h-6 text-indigo-600" /> Board
          </h2>
          <p className="text-sm text-stone-400 mt-0.5 font-mono">
            {canReassign ? 'Drag a card onto another person to reassign it' : 'Tasks grouped by owner'}
          </p>
        </div>
        <div className="text-xs text-stone-400 font-mono">
          {boardTasks.length} active {boardTasks.length === 1 ? 'task' : 'tasks'} · {columns.length} {columns.length === 1 ? 'person' : 'people'}
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {/* Unassigned column — surfaces tasks whose owner was deactivated (managers only) */}
        {isManager && unassignedTasks.length > 0 && (() => {
          const isOver = dragOverCol === UNASSIGNED;
          return (
            <div
              key="unassigned"
              onDragOver={(e) => { if (canReassign) { e.preventDefault(); setDragOverCol(UNASSIGNED); } }}
              onDragLeave={() => setDragOverCol(prev => (prev === UNASSIGNED ? null : prev))}
              onDrop={() => handleDrop(UNASSIGNED)}
              className={`w-72 flex-shrink-0 flex flex-col rounded-[6px] border border-dashed transition-colors ${
                isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-amber-300 bg-amber-50/40'
              }`}
            >
              <div className="px-3 pt-3 pb-2.5 border-b border-amber-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-stone-900 truncate">Unassigned</div>
                    <div className="text-xs text-amber-600 font-mono truncate">Needs an owner</div>
                  </div>
                  <span className="text-xs font-mono font-medium text-stone-500 tabular-nums flex-shrink-0">
                    {unassignedTasks.length}
                  </span>
                </div>
              </div>
              {cardsBody(unassignedTasks, isOver, 'All assigned')}
            </div>
          );
        })()}

        {columns.map(({ member, tasks }) => {
          const cap = memberCapacity(member.name);
          const isOver = dragOverCol === member.name;
          const capColor = cap >= 100 ? 'bg-red-500' : cap >= 80 ? 'bg-orange-400' : 'bg-indigo-600';
          return (
            <div
              key={member.id}
              onDragOver={(e) => { if (canReassign) { e.preventDefault(); setDragOverCol(member.name); } }}
              onDragLeave={() => setDragOverCol(prev => (prev === member.name ? null : prev))}
              onDrop={() => handleDrop(member.name)}
              className={`w-72 flex-shrink-0 flex flex-col rounded-[6px] border transition-colors ${
                isOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-stone-200 bg-stone-100'
              }`}
            >
              {/* Column header */}
              <div className="px-3 pt-3 pb-2.5 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <Avatar name={member.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-stone-900 truncate">{member.name}</div>
                    <div className="text-xs text-stone-400 font-mono truncate">{member.role}</div>
                  </div>
                  <span className="text-xs font-mono font-medium text-stone-500 tabular-nums flex-shrink-0">
                    {tasks.length}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${capColor}`} style={{ width: `${Math.min(cap, 100)}%` }} />
                  </div>
                  <span className={`text-[0.65rem] font-mono tabular-nums flex-shrink-0 ${cap >= 80 ? 'text-orange-600' : 'text-stone-400'}`}>
                    {cap}%
                  </span>
                </div>
              </div>

              {cardsBody(tasks, isOver, 'No active tasks')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
