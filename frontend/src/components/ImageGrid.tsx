import { useState } from 'react';
import { X } from 'lucide-react';

interface ImageGridProps {
  images: { src: string; label: string }[];
}

export default function ImageGrid({ images }: ImageGridProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-gray-mid">
        No images yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <div
            key={i}
            className="bg-carbon-light rounded-lg overflow-hidden cursor-pointer hover:ring-1 hover:ring-neon/30 transition-all"
            onClick={() => setLightbox(img.src)}
          >
            <img
              src={img.src}
              alt={img.label}
              className="w-full aspect-square object-cover"
              loading="lazy"
            />
            <div className="px-3 py-2 text-xs text-gray-mid truncate">
              {img.label}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-gray-mid hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightbox}
            alt="Full size"
            className="max-w-[90%] max-h-[90%] object-contain"
          />
        </div>
      )}
    </>
  );
}
