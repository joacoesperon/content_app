import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/tools/meta_ads', label: 'Upload Ads', end: true },
  { to: '/tools/meta_ads/history', label: 'History', end: false },
  { to: '/tools/meta_ads/settings', label: 'Settings', end: false },
];

export default function MetaAdsLayout() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-1">Meta Ads</h1>
      <p className="text-muted-foreground text-sm">Bulk upload and launch Meta ads.</p>

      <div className="flex border-b border-border mt-4 mb-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-accent text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
