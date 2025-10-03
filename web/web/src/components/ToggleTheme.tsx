import * as React from 'react';
import * as Switch from '@radix-ui/react-switch';

export function ToggleTheme() {
  const [dark, setDark] = React.useState(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  React.useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) setDark(saved === 'dark');
  }, []);

  return (
    <label className="flex items-center gap-2 text-sm">
      <span>Dark mode</span>
      <Switch.Root
        checked={dark}
        onCheckedChange={setDark}
        className="w-10 h-6 bg-gray-300 dark:bg-gray-700 rounded-full relative transition-colors"
      >
        <Switch.Thumb className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${dark ? 'translate-x-4' : ''}`} />
      </Switch.Root>
    </label>
  );
}
