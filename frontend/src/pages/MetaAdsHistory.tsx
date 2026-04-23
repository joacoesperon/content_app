import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchMetaBatches, type MetaBatch } from '../lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'complete' || status === 'completed') return 'default';
  if (status === 'error' || status === 'failed') return 'destructive';
  if (status === 'uploading' || status === 'launching') return 'secondary';
  return 'outline';
}

function statusLabel(status: string): string {
  if (status === 'complete' || status === 'completed') return 'Complete';
  if (status === 'error' || status === 'failed') return 'Error';
  if (status === 'uploading' || status === 'launching') return 'Uploading…';
  return 'Draft';
}

export default function MetaAdsHistory() {
  const [batches, setBatches] = useState<MetaBatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetaBatches()
      .then((data) =>
        setBatches(
          [...data]
            .reverse()
            .filter((b) => b.status !== 'draft'),
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-16">
        <Loader2 size={16} className="animate-spin" /> Loading history...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">

      {batches.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-sm">No batches yet.</p>
          <p className="text-xs mt-1">
            <Link to="/tools/meta_ads" className="text-primary hover:underline">
              Upload your first batch
            </Link>{' '}
            to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">{b.name}</span>
                    <Badge variant={statusVariant(b.status)}>{statusLabel(b.status)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-x-2">
                    {b.campaign_name && (
                      <span>
                        {b.campaign_name}
                        {b.ad_set_name && <> → {b.ad_set_name}</>}
                      </span>
                    )}
                    {b.created_at && (
                      <span>· {new Date(b.created_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-sm">
                  {b.ads_created > 0 && (
                    <span className="text-green-500 font-medium">{b.ads_created} created</span>
                  )}
                  {b.ads_errored > 0 && (
                    <span className="text-destructive font-medium">{b.ads_errored} errored</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
