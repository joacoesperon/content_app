import { useEffect, useState } from 'react';
import { fetchOutputs, getImageUrl } from '../lib/api';
import ImageGrid from '../components/ImageGrid';

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
      <h1 className="text-3xl font-bold text-white mb-2">Gallery</h1>
      <p className="text-gray-mid mb-8">
        Browse all generated ad images.
      </p>

      {loading ? (
        <div className="text-gray-mid">Loading...</div>
      ) : outputs.length === 0 ? (
        <div className="text-center py-16 text-gray-mid">
          <p className="text-lg mb-2">No images generated yet</p>
          <p className="text-sm">Go to Static Ad Generator to create your first ads.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {outputs.map((o) => (
            <div key={o.folder}>
              <h2 className="text-lg font-semibold text-neon mb-3">
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

          <div className="border-t border-carbon-light pt-6">
            <p className="text-sm text-gray-mid">
              Total: {allImages.length} images across {outputs.length} templates
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
