import { useEffect, useState } from 'react';
import { fetchOutputs, fetchConceptOutputs, getImageUrl, getConceptImageUrl } from '../lib/api';
import ImageGrid from '../components/ImageGrid';
import { Loader2 } from 'lucide-react';

type Tab = 'all' | 'static' | 'concept';

interface StaticFolder {
  folder: string;
  template_number: number;
  template_name: string;
  images: string[];
}

interface ConceptFolder {
  folder: string;
  images: string[];
  meta: {
    hook?: string;
    format_name?: string;
    format_id?: string;
    avatar_name?: string;
    avatar_id?: string;
    type?: string;
    resolution?: string;
  };
}

interface GalleryImage {
  src: string;
  label: string;
}

interface Section {
  key: string;
  title: string;
  subtitle?: string;
  images: GalleryImage[];
  tool: 'static' | 'concept';
}

export default function Gallery() {
  const [staticFolders, setStaticFolders] = useState<StaticFolder[]>([]);
  const [conceptFolders, setConceptFolders] = useState<ConceptFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    Promise.all([
      fetchOutputs().catch(() => []),
      fetchConceptOutputs().catch(() => []),
    ]).then(([s, c]) => {
      setStaticFolders(s);
      setConceptFolders([...c].reverse());
    }).finally(() => setLoading(false));
  }, []);

  const staticSections: Section[] = staticFolders.map((f) => ({
    key: `static-${f.folder}`,
    title: `#${f.template_number} — ${f.template_name.replace(/-/g, ' ')}`,
    images: f.images.map((filename) => ({
      src: getImageUrl(f.folder, filename),
      label: filename,
    })),
    tool: 'static',
  }));

  const conceptSections: Section[] = conceptFolders.map((f) => {
    const isRemix = f.meta.type === 'remix';
    const title = f.meta.hook ? f.meta.hook.slice(0, 70) : f.folder;
    const subtitle = isRemix
      ? 'Remix Mode'
      : [f.meta.format_name ?? f.meta.format_id, f.meta.avatar_name ?? f.meta.avatar_id]
          .filter(Boolean).join(' × ');
    return {
      key: `concept-${f.folder}`,
      title,
      subtitle,
      images: f.images.map((filename) => ({
        src: getConceptImageUrl(f.folder, filename),
        label: filename,
      })),
      tool: 'concept',
    };
  });

  const allSections: Section[] = [...staticSections, ...conceptSections];
  const visibleSections =
    tab === 'static' ? staticSections :
    tab === 'concept' ? conceptSections :
    allSections;

  const totalImages = visibleSections.reduce((acc, s) => acc + s.images.length, 0);

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold text-white mb-2">Gallery</h1>
      <p className="text-gray-mid mb-6">All generated images across tools.</p>

      {/* Tabs */}
      <div className="flex gap-1 bg-carbon-light rounded-xl p-1 mb-8 w-fit">
        {([
          { id: 'all', label: 'All' },
          { id: 'static', label: 'Static Ads' },
          { id: 'concept', label: 'Concept Ads' },
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-carbon text-white' : 'text-gray-mid hover:text-gray-light'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-mid text-sm py-16">
          <Loader2 size={16} className="animate-spin" /> Cargando...
        </div>
      ) : visibleSections.length === 0 ? (
        <div className="text-center py-20 text-gray-mid">
          <p className="text-lg mb-2">No hay imágenes todavía</p>
          <p className="text-sm">Generá imágenes en Static Ads o Concept Ads para verlas aquí.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {visibleSections.map((section) => (
            <div key={section.key}>
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    section.tool === 'static'
                      ? 'border-electric/30 text-electric'
                      : 'border-neon/30 text-neon'
                  }`}>
                    {section.tool === 'static' ? 'Static' : 'Concept'}
                  </span>
                  {section.subtitle && (
                    <span className="text-xs text-gray-mid">{section.subtitle}</span>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-white mt-1 line-clamp-1">{section.title}</h2>
              </div>
              <ImageGrid images={section.images} />
            </div>
          ))}

          <div className="border-t border-carbon-light pt-6">
            <p className="text-sm text-gray-mid">
              {totalImages} imágenes · {visibleSections.length} secciones
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
