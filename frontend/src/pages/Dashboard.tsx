import { Link } from 'react-router-dom';
import { useTools } from '../hooks/useTools';
import { Image as ImageIcon, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const TOOL_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon size={24} />,
};

export default function Dashboard() {
  const { tools, loading } = useTools();

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Content App</h1>
      <p className="text-muted-foreground mb-8">
        Create and manage content for Jess Trading.
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading tools...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link key={tool.id} to={`/tools/${tool.id}`} className="group">
              <Card className="hover:border-accent/40 transition-colors h-full">
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-accent">
                      {TOOL_ICONS[tool.icon] || <ImageIcon size={24} />}
                    </div>
                    {tool.health.ready ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle size={12} /> Ready
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-yellow-500 border-yellow-500/40">
                        <AlertCircle size={12} /> Setup needed
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                  <div className="flex items-center gap-1 text-sm text-primary group-hover:text-accent transition-colors">
                    Open tool <ArrowRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          <Card className="border-dashed flex items-center justify-center">
            <p className="text-sm text-muted-foreground">More tools coming soon</p>
          </Card>
        </div>
      )}
    </div>
  );
}
