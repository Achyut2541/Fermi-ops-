import { useState, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui';

const ROLE_LABEL = {
  admin: 'Admin',
  am: 'Account Manager',
  leadership: 'Leadership',
  team_member: 'Team Member',
};

// Login replacement: type your name to open your workspace. No password, no accounts.
export default function NamePicker() {
  const { activeMembers, getUserRole } = useData();
  const { selectProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const listRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...activeMembers].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter(m =>
      m.name.toLowerCase().includes(q) || (m.role || '').toLowerCase().includes(q)
    );
  }, [activeMembers, query]);

  const choose = (member) => member && selectProfile(member.email);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[highlight]); }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-[8px] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-sm font-black tracking-tight">F</span>
          </div>
          <h1 className="text-2xl font-light text-stone-900 font-serif tracking-tight">Fermi</h1>
          <p className="text-sm text-stone-400 mt-1 font-mono">Type your name to continue</p>
        </div>

        <div className="bg-stone-100 border border-stone-200 rounded-[8px] p-3">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setHighlight(0); }}
              onKeyDown={onKeyDown}
              placeholder="Start typing your name…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-stone-200 rounded-[5px] focus:border-indigo-500 focus:outline-none placeholder-stone-400"
            />
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto space-y-0.5">
            {results.length === 0 ? (
              <div className="text-center text-xs text-stone-400 font-mono py-6">No one matches “{query}”</div>
            ) : (
              results.map((member, i) => (
                <button
                  key={member.id}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => choose(member)}
                  className={`w-full flex items-center gap-3 p-2 rounded-[5px] text-left transition-colors ${
                    i === highlight ? 'bg-indigo-50' : 'hover:bg-stone-200/60'
                  }`}
                >
                  <Avatar name={member.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-stone-900 truncate">{member.name}</div>
                    <div className="text-xs text-stone-400 font-mono truncate">
                      {member.role} · {ROLE_LABEL[getUserRole(member.name)] || 'Team Member'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <p className="text-center text-xs text-stone-300 font-mono mt-6">Fermi Operations · Internal use only</p>
      </div>
    </div>
  );
}
