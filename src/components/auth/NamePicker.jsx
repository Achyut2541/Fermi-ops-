import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui';

// Login replacement: pick who you are. No password, no accounts.
const ROLE_LABEL = {
  admin: 'Admin',
  am: 'Account Manager',
  leadership: 'Leadership',
  team_member: 'Team Member',
};

export default function NamePicker() {
  const { activeMembers, getUserRole } = useData();
  const { selectProfile } = useAuth();

  const groups = [
    { label: 'Account & Leadership', match: (m) => ['admin', 'am', 'leadership'].includes(getUserRole(m.name)) },
    { label: 'Team', match: (m) => getUserRole(m.name) === 'team_member' },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-[8px] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-sm font-black tracking-tight">F</span>
          </div>
          <h1 className="text-2xl font-light text-stone-900 font-serif tracking-tight">Who are you?</h1>
          <p className="text-sm text-stone-400 mt-1 font-mono">Pick your name to open your workspace</p>
        </div>

        <div className="space-y-6">
          {groups.map(({ label, match }) => {
            const members = activeMembers.filter(match);
            if (members.length === 0) return null;
            return (
              <div key={label}>
                <div className="text-xs font-mono uppercase tracking-wide text-stone-400 mb-2 px-1">{label}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map(member => (
                    <button
                      key={member.id}
                      onClick={() => selectProfile(member.email)}
                      className="flex items-center gap-3 p-3 bg-stone-100 border border-stone-200 rounded-[6px] text-left hover:border-indigo-300 hover:-translate-y-px transition-all"
                    >
                      <Avatar name={member.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-stone-900 truncate">{member.name}</div>
                        <div className="text-xs text-stone-400 font-mono truncate">
                          {member.role} · {ROLE_LABEL[getUserRole(member.name)] || 'Team Member'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-stone-300 font-mono mt-8">Fermi Operations · Internal use only</p>
      </div>
    </div>
  );
}
