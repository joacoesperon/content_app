import { NavLink } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Lightbulb,
  FolderOpen,
  Palette,
  Users,
  Megaphone,
  Bot,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const TOOL_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon size={18} />,
  lightbulb: <Lightbulb size={18} />,
  palette: <Palette size={18} />,
  users: <Users size={18} />,
  megaphone: <Megaphone size={18} />,
  bot: <Bot size={18} />,
};

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
    isActive
      ? 'bg-muted text-accent'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
  );

export default function Sidebar() {
  const { tools } = useTools();

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Jess Trading
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Content App</p>
      </div>
      <Separator />

      <nav className="flex-1 p-4 space-y-1">
        <NavLink to="/" end className={navItemClass}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tools
          </p>
        </div>

        {tools.map((tool) => (
          <NavLink key={tool.id} to={`/tools/${tool.id}`} className={navItemClass}>
            {TOOL_ICONS[tool.icon] || <ImageIcon size={18} />}
            {tool.name}
            {!tool.health.ready && (
              <span
                className="ml-auto w-2 h-2 rounded-full bg-yellow-500"
                title="Not ready"
              />
            )}
          </NavLink>
        ))}

        <NavLink to="/gallery" className={navItemClass}>
          <FolderOpen size={18} />
          Gallery
        </NavLink>
      </nav>

      <Separator />
      <div className="p-4">
        <p className="text-xs text-muted-foreground">
          The future of trading is automated.
        </p>
      </div>
    </aside>
  );
}
