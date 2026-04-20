import { useEffect, useState } from 'react';
import { fetchOutputs, getImageUrl } from '../lib/api';
import ImageGrid from '../components/ImageGrid';
import { Separator } from '@/components/ui/separator';

interface OutputFolder {
  folder: string;
  template_number: number;
  template_name: string;
  images: string[];
}

export default function Gallery() {
  const [outputs, setOutputs] = useState<OutputFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutputs()
      .then(setOutputs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allImages = outputs.flatMap((o) =>
    o.images.map((filename) => ({
      src: getImageUrl(o.folder, filename),
      label: `#${o.template_number} ${o.template_name} — ${filename}`,
    }))
  );

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Gallery</h1>
      <p className="text-muted-foreground mb-8">Browse all generated ad images.</p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : outputs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No images generated yet</p>
          <p className="text-sm">Go to Static Ad Generator to create your first ads.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {outputs.map((o) => (
            <div key={o.folder}>
              <h2 className="text-lg font-semibold text-accent mb-3">
                #{o.template_number} — {o.template_name.replace(/-/g, ' ')}
              </h2>
              <ImageGrid
                images={o.images.map((filename) => ({
                  src: getImageUrl(o.folder, filename),
                  label: filename,
                }))}
              />
            </div>
          ))}

          <Separator />
          <p className="text-sm text-muted-foreground">
            Total: {allImages.length} images across {outputs.length} templates
          </p>
        </div>
      )}
    </div>
  );
}
