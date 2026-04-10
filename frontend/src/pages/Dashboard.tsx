import { Link } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { Image, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

const TOOL_ICONS: Record<string, React.ReactNode> = {
  image: <Image size={24} />,
};

export default function Dashboard() {
  const { tools, loading } = useTools();

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-2">Content App</h1>
      <p className="text-gray-mid mb-8">
        Create and manage content for Jess Trading.
      </p>

      {loading ? (
        <div className="text-gray-mid">Loading tools...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              to={`/tools/${tool.id}`}
              className="group bg-carbon-light border border-carbon-light hover:border-neon/30 rounded-xl p-6 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-carbon flex items-center justify-center text-neon">
                  {TOOL_ICONS[tool.icon] || <Image size={24} />}
                </div>
                {tool.health.ready ? (
                  <span className="flex items-center gap-1 text-xs text-neon-dark">
                    <CheckCircle size={14} /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertCircle size={14} /> Setup needed
                  </span>
                )}
              </div>
              <h3 className="text-white font-semibold mb-1">{tool.name}</h3>
              <p className="text-sm text-gray-mid mb-4">{tool.description}</p>
              <div className="flex items-center gap-1 text-sm text-electric group-hover:text-neon transition-colors">
                Open tool <ArrowRight size={14} />
              </div>
            </Link>
          ))}

          {/* Placeholder for future tools */}
          <div className="border border-dashed border-carbon-light rounded-xl p-6 flex items-center justify-center">
            <p className="text-sm text-gray-mid">More tools coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
