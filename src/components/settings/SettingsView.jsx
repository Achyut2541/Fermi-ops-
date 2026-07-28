export default function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-light text-stone-900 font-serif tracking-tight">Settings</h2>
        <p className="text-stone-400 mt-1 text-sm">Workspace information</p>
      </div>

      {/* App Info */}
      <div className="bg-stone-100 border border-stone-200 rounded-[6px] p-5">
        <div className="gravity-label mb-3">About</div>
        <div className="space-y-2 text-sm text-stone-500 font-mono">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="text-stone-900 font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Stack</span>
            <span className="text-stone-900 font-medium">React 19 + Vite + Tailwind 4</span>
          </div>
          <div className="flex justify-between">
            <span>Design System</span>
            <span className="text-stone-900 font-medium">Gravity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
