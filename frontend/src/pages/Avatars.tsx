import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  fetchAvatars,
  createAvatar,
  updateAvatar,
  deleteAvatar,
  buildAvatarPrompt,
  parseAvatars,
} from '../lib/api';

interface Avatar {
  id: string;
  name: string;
  description: string;
  pain_points: string[];
  motivations: string[];
  objections: string[];
  language_sample: string;
}

const EMPTY_AVATAR: Omit<Avatar, 'id'> = {
  name: '',
  description: '',
  pain_points: [],
  motivations: [],
  objections: [],
  language_sample: '',
};

// ─── Tag list editor ──────────────────────────────────────────────────────────

function TagList({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-carbon-light text-xs text-gray-light">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-gray-mid hover:text-white">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Agregar y Enter"
          className="flex-1 bg-carbon border border-carbon-light rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-mid focus:outline-none focus:border-electric"
        />
        <button onClick={add} className="px-2.5 py-1.5 bg-carbon-light rounded text-gray-light hover:text-white text-xs">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors"
    >
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}

// ─── Avatar form (create / edit) ──────────────────────────────────────────────

function AvatarForm({
  initial,
  onSave,
  onCancel,
  saving,
  isNew,
}: {
  initial: Avatar;
  onSave: (a: Avatar) => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}) {
  const [form, setForm] = useState<Avatar>(initial);
  const set = (field: keyof Avatar, value: unknown) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-3 bg-carbon rounded-xl p-4 border border-carbon-light">
      {isNew && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">ID (sin espacios)</label>
          <input
            value={form.id}
            onChange={(e) => set('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="ej: trader_agotado"
            className="w-full bg-carbon-dark border border-carbon-light rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-mid focus:outline-none focus:border-electric font-mono"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">Nombre</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Trader Agotado"
            className="w-full bg-carbon-dark border border-carbon-light rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-mid focus:outline-none focus:border-electric"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">Descripción</label>
          <input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Breve descripción"
            className="w-full bg-carbon-dark border border-carbon-light rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-mid focus:outline-none focus:border-electric"
          />
        </div>
      </div>
      <TagList label="Pain Points" values={form.pain_points} onChange={(v) => set('pain_points', v)} />
      <TagList label="Motivaciones" values={form.motivations} onChange={(v) => set('motivations', v)} />
      <TagList label="Objeciones" values={form.objections} onChange={(v) => set('objections', v)} />
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-mid uppercase tracking-wider">Frase representativa</label>
        <textarea
          value={form.language_sample}
          onChange={(e) => set('language_sample', e.target.value)}
          rows={2}
          placeholder="En sus propias palabras..."
          className="w-full bg-carbon-dark border border-carbon-light rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-mid focus:outline-none focus:border-electric resize-none"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name || (isNew && !form.id)}
          className="flex-1 py-2 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-carbon-light text-gray-mid text-xs hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Avatar card ──────────────────────────────────────────────────────────────

function AvatarCard({
  avatar,
  onUpdated,
  onDeleted,
}: {
  avatar: Avatar;
  onUpdated: (a: Avatar) => void;
  onDeleted: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async (updated: Avatar) => {
    setSaving(true);
    try {
      const result = await updateAvatar(avatar.id, {
        name: updated.name,
        description: updated.description,
        pain_points: updated.pain_points,
        motivations: updated.motivations,
        objections: updated.objections,
        language_sample: updated.language_sample,
      });
      onUpdated(result);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteAvatar(avatar.id);
    onDeleted(avatar.id);
  };

  return (
    <div className="bg-carbon-dark border border-carbon-light rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">{avatar.name}</span>
            <span className="text-xs font-mono text-gray-mid">#{avatar.id}</span>
          </div>
          <p className="text-xs text-gray-mid mt-0.5 line-clamp-1">{avatar.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { setEditing(!editing); setExpanded(false); }}
            className="px-2.5 py-1 rounded text-xs text-gray-mid hover:text-electric transition-colors"
          >
            Editar
          </button>
          {confirmDelete ? (
            <>
              <button onClick={handleDelete} className="px-2.5 py-1 rounded text-xs text-red-400 hover:text-red-300 transition-colors">
                Confirmar
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-gray-mid hover:text-white">
                <X size={13} />
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-gray-mid hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => { setExpanded(!expanded); setEditing(false); }}
            className="p-1.5 text-gray-mid hover:text-white transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="px-4 pb-4">
          <AvatarForm
            initial={avatar}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saving={saving}
            isNew={false}
          />
        </div>
      )}

      {/* Expanded details */}
      {expanded && !editing && (
        <div className="px-4 pb-4 border-t border-carbon-light pt-3 space-y-3">
          {avatar.pain_points.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1.5">Pain Points</p>
              <div className="flex flex-wrap gap-1.5">
                {avatar.pain_points.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-red-900/20 border border-red-800/30 text-xs text-red-300">{p}</span>
                ))}
              </div>
            </div>
          )}
          {avatar.motivations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1.5">Motivaciones</p>
              <div className="flex flex-wrap gap-1.5">
                {avatar.motivations.map((m) => (
                  <span key={m} className="px-2 py-0.5 rounded-full bg-neon/10 border border-neon/20 text-xs text-neon">{m}</span>
                ))}
              </div>
            </div>
          )}
          {avatar.objections.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1.5">Objeciones</p>
              <div className="flex flex-wrap gap-1.5">
                {avatar.objections.map((o) => (
                  <span key={o} className="px-2 py-0.5 rounded-full bg-yellow-900/20 border border-yellow-700/30 text-xs text-yellow-300">{o}</span>
                ))}
              </div>
            </div>
          )}
          {avatar.language_sample && (
            <div>
              <p className="text-xs font-medium text-gray-mid uppercase tracking-wider mb-1">Frase representativa</p>
              <p className="text-xs text-gray-light italic">"{avatar.language_sample}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Assist section ────────────────────────────────────────────────────────

function AiAssist({ onSaved }: { onSaved: (avatars: Avatar[]) => void }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [pasteRaw, setPasteRaw] = useState('');
  const [parsed, setParsed] = useState<Avatar[]>([]);
  const [error, setError] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingParse, setLoadingParse] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleBuild = async () => {
    setLoadingPrompt(true);
    setError('');
    try {
      const res = await buildAvatarPrompt({});
      setPrompt(res.prompt);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingPrompt(false);
    }
  };

  const handleParse = async () => {
    setLoadingParse(true);
    setError('');
    try {
      const res = await parseAvatars(pasteRaw);
      setParsed(res.avatars);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingParse(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const saved: Avatar[] = [];
    for (const a of parsed) {
      try {
        const result = await createAvatar(a as unknown as Record<string, unknown>);
        saved.push(result);
      } catch {
        // skip duplicates silently
      }
    }
    onSaved(saved);
    setParsed([]);
    setPasteRaw('');
    setPrompt('');
    setOpen(false);
    setSaving(false);
  };

  const reset = () => { setPrompt(''); setPasteRaw(''); setParsed([]); setError(''); setOpen(false); };

  return (
    <div className="bg-carbon-dark border border-electric/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-carbon-light/20 transition-colors"
      >
        <Sparkles size={15} className="text-electric" />
        <span className="text-sm font-medium text-electric">Generar avatares con IA</span>
        <span className="ml-auto text-xs text-gray-mid">Claude + copiar/pegar</span>
        {open ? <ChevronUp size={14} className="text-gray-mid" /> : <ChevronDown size={14} className="text-gray-mid" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-electric/10 pt-4 space-y-3">
          <p className="text-xs text-gray-mid">
            Generá perfiles de cliente con Claude. Copiá el prompt → pegalo en{' '}
            <span className="text-electric">claude.ai</span> → pegá el JSON abajo.
          </p>

          {!prompt ? (
            <button
              onClick={handleBuild}
              disabled={loadingPrompt}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors disabled:opacity-50"
            >
              {loadingPrompt ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Construir prompt de investigación
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-mid">Prompt listo — copialo a claude.ai</span>
                <CopyButton text={prompt} />
              </div>
              <textarea
                readOnly
                value={prompt}
                rows={4}
                className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-xs text-gray-mid font-mono resize-none"
              />
              <textarea
                value={pasteRaw}
                onChange={(e) => setPasteRaw(e.target.value)}
                placeholder="Pegá aquí el JSON que devolvió Claude..."
                rows={4}
                className="w-full bg-carbon border border-carbon-light rounded-lg px-3 py-2 text-xs text-gray-mid font-mono resize-none focus:outline-none focus:border-electric/50"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}

              {parsed.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-neon">{parsed.length} avatares parseados</p>
                  {parsed.map((a) => (
                    <div key={a.id} className="bg-carbon rounded-lg px-3 py-2 text-xs">
                      <span className="font-medium text-white">{a.name}</span>
                      <span className="text-gray-mid ml-2 font-mono">#{a.id}</span>
                      <p className="text-gray-mid mt-0.5">{a.description}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-2 rounded-lg bg-neon/20 hover:bg-neon/30 text-neon text-xs transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar todos'}
                    </button>
                    <button onClick={reset} className="px-3 py-2 rounded-lg bg-carbon-light text-gray-mid text-xs hover:text-white">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleParse}
                  disabled={loadingParse || !pasteRaw.trim()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-electric/20 hover:bg-electric/30 text-electric text-xs transition-colors disabled:opacity-50"
                >
                  {loadingParse ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Parsear respuesta de Claude
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Avatars() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [newAvatar, setNewAvatar] = useState<Avatar>({ id: '', ...EMPTY_AVATAR });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvatars()
      .then(setAvatars)
      .catch(() => setError('Error cargando avatares'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (form: Avatar) => {
    setSavingNew(true);
    setError('');
    try {
      const saved = await createAvatar(form as unknown as Record<string, unknown>);
      setAvatars((prev) => [...prev, saved]);
      setShowNewForm(false);
      setNewAvatar({ id: '', ...EMPTY_AVATAR });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes('409') ? `Ya existe un avatar con ese ID` : msg);
    } finally {
      setSavingNew(false);
    }
  };

  const handleUpdated = (updated: Avatar) => {
    setAvatars((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleted = (id: string) => {
    setAvatars((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAiSaved = (saved: Avatar[]) => {
    setAvatars((prev) => {
      const existing = new Set(prev.map((a) => a.id));
      return [...prev, ...saved.filter((a) => !existing.has(a.id))];
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-mid text-sm">
        <Loader2 size={18} className="animate-spin mr-2" /> Cargando avatares...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Avatares</h2>
          <p className="text-sm text-gray-mid mt-1">
            Perfiles de cliente de la marca. Se usan en Concept Ads para generar creativos dirigidos.
          </p>
        </div>
        <button
          onClick={() => { setShowNewForm((o) => !o); setError(''); }}
          className="flex items-center gap-2 px-3 py-2 bg-carbon-light rounded-lg text-sm text-gray-light hover:text-white transition-colors"
        >
          <Plus size={15} />
          Nuevo avatar
        </button>
      </div>

      {/* AI Assist */}
      <AiAssist onSaved={handleAiSaved} />

      {/* New avatar form */}
      {showNewForm && (
        <AvatarForm
          initial={newAvatar}
          onSave={handleCreate}
          onCancel={() => { setShowNewForm(false); setError(''); }}
          saving={savingNew}
          isNew
        />
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Avatar list */}
      {avatars.length === 0 ? (
        <div className="text-center py-16 text-gray-mid">
          <p className="text-sm">No hay avatares todavía.</p>
          <p className="text-xs mt-1">Creá uno manualmente o generá con IA.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-mid">{avatars.length} avatar{avatars.length !== 1 ? 'es' : ''}</p>
          {avatars.map((a) => (
            <AvatarCard
              key={a.id}
              avatar={a}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
