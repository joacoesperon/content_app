import { NavLink } from 'react-router-dom';
import { useTools, type Tool } from '../hooks/useTools';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Lightbulb,
  FolderOpen,
  Palette,
  Users,
  Megaphone,
  Bot,
  Layers,
  Clapperboard,
  Film,
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
  layers: <Layers size={18} />,
  clapperboard: <Clapperboard size={18} />,
  film: <Film size={18} />,
};

interface NavItem {
  id: string;
  label: string;
  to: string;
}

interface NavGroup {
  title: string;
  items?: NavItem[];
  subgroups?: { title: string; items: NavItem[] }[];
}

// Sidebar structure. Order and grouping live here (frontend); routes are unchanged.
const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Brand',
    items: [
      { id: 'brand', label: 'Brand', to: '/tools/brand' },
      { id: 'avatars', label: 'Avatars', to: '/tools/avatars' },
    ],
  },
  {
    title: 'Content',
    subgroups: [
      {
        title: 'Posts',
        items: [
          { id: 'scout', label: 'Scout', to: '/tools/scout' },
          { id: 'carousels', label: 'Carousels', to: '/tools/carousels' },
        ],
      },
      {
        title: 'Video',
        items: [
          { id: 'director', label: 'Director', to: '/tools/director' },
          { id: 'reels', label: 'Reels', to: '/tools/reels' },
        ],
      },
    ],
  },
  {
    title: 'Ads',
    items: [
      { id: 'concept_ads', label: 'Concept Ads', to: '/tools/concept_ads' },
      { id: 'static_ads', label: 'Static Ads Generator', to: '/tools/static_ads' },
      { id: 'meta_ads', label: 'Upload Ads', to: '/tools/meta_ads' },
    ],
  },
];

const INDENT = ['pl-3', 'pl-6', 'pl-9'] as const;

const itemClass =
  (level: number) =>
  ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 py-2 pr-3 rounded-md text-sm transition-colors',
      INDENT[level],
      isActive
        ? 'bg-muted text-accent'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    );

const groupHeaderClass =
  'px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider';
const subHeaderClass =
  'pl-6 pr-3 pt-2 pb-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider';

function ToolLink({
  item,
  tool,
  level,
}: {
  item: NavItem;
  tool?: Tool;
  level: number;
}) {
  return (
    <NavLink to={item.to} className={itemClass(level)}>
      {(tool && TOOL_ICONS[tool.icon]) || <ImageIcon size={18} />}
      {item.label}
      {tool && !tool.health.ready && (
        <span
          className="ml-auto w-2 h-2 rounded-full bg-yellow-500"
          title="Not ready"
        />
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { tools } = useTools();
  const toolById: Record<string, Tool> = Object.fromEntries(
    tools.map((t) => [t.id, t]),
  );

  return (
    <aside className="w-64 bg-[#0a0a0a] border-r border-border flex flex-col">
      <div className="p-6">
        <h1 className="text-lg font-bold text-foreground tracking-tight">
          Jess Trading
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Content App</p>
      </div>
      <Separator />

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLink to="/" end className={itemClass(0)}>
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className={groupHeaderClass}>{group.title}</p>
            {group.items?.map((item) => (
              <ToolLink
                key={item.id}
                item={item}
                tool={toolById[item.id]}
                level={1}
              />
            ))}
            {group.subgroups?.map((sub) => (
              <div key={sub.title}>
                <p className={subHeaderClass}>{sub.title}</p>
                {sub.items.map((item) => (
                  <ToolLink
                    key={item.id}
                    item={item}
                    tool={toolById[item.id]}
                    level={2}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}

        <NavLink to="/gallery" className={itemClass(0)}>
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
