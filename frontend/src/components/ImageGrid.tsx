import { useState } from 'react';
import { Download, X } from 'lucide-react';

interface ImageGridProps {
  images: { src: string; label: string }[];
  onImageClick?: (img: { src: string; label: string }) => void;
}

function downloadImage(src: string, label: string) {
  const filename = label.split('/').pop()?.split(' — ').pop() ?? 'image.png';
  const a = document.createElement('a');
  a.href = src;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ImageGrid({ images, onImageClick }: ImageGridProps) {
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);

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
            className="group bg-carbon-light rounded-lg overflow-hidden relative"
          >
            <img
              src={img.src}
              alt={img.label}
              className="w-full aspect-square object-cover cursor-pointer"
              loading="lazy"
              onClick={() => onImageClick ? onImageClick(img) : setLightbox(img)}
            />
            {/* Download button overlay */}
            <button
              onClick={(e) => { e.stopPropagation(); downloadImage(img.src, img.label); }}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              title="Descargar"
            >
              <Download size={14} />
            </button>
            <div className="px-3 py-2 text-xs text-gray-mid truncate">
              {img.label}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-gray-mid hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          <button
            className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-carbon-light text-white text-sm hover:bg-carbon transition-colors"
            onClick={(e) => { e.stopPropagation(); downloadImage(lightbox.src, lightbox.label); }}
          >
            <Download size={15} /> Descargar
          </button>
          <img
            src={lightbox.src}
            alt="Full size"
            className="max-w-[90%] max-h-[85%] object-contain cursor-pointer"
            onClick={() => setLightbox(null)}
          />
        </div>
      )}
    </>
  );
}
