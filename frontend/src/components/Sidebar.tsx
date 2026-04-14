import { NavLink } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { LayoutDashboard, Image, Lightbulb, FolderOpen, Palette, Users } from 'lucide-react';

const TOOL_ICONS: Record<string, React.ReactNode> = {
  image: <Image size={18} />,
  lightbulb: <Lightbulb size={18} />,
  palette: <Palette size={18} />,
  users: <Users size={18} />,
};

export default function Sidebar() {
  const { tools } = useTools();

  return (
    <aside className="w-64 bg-carbon-dark border-r border-carbon-light flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b border-carbon-light">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Jess Trading
        </h1>
        <p className="text-xs text-gray-mid mt-1">Content App</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-carbon-light text-neon'
                : 'text-gray-mid hover:text-gray-light hover:bg-carbon-light'
            }`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        <div className="pt-4 pb-2">
          <p className="px-3 text-xs font-medium text-gray-mid uppercase tracking-wider">
            Tools
          </p>
        </div>

        {tools.map((tool) => (
          <NavLink
            key={tool.id}
            to={`/tools/${tool.id}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-carbon-light text-neon'
                  : 'text-gray-mid hover:text-gray-light hover:bg-carbon-light'
              }`
            }
          >
            {TOOL_ICONS[tool.icon] || <Image size={18} />}
            {tool.name}
            {!tool.health.ready && (
              <span className="ml-auto w-2 h-2 rounded-full bg-yellow-500" title="Not ready" />
            )}
          </NavLink>
        ))}

        <NavLink
          to="/gallery"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-carbon-light text-neon'
                : 'text-gray-mid hover:text-gray-light hover:bg-carbon-light'
            }`
          }
        >
          <FolderOpen size={18} />
          Gallery
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-carbon-light">
        <p className="text-xs text-gray-mid">
          The future of trading is automated.
        </p>
      </div>
    </aside>
  );
}
