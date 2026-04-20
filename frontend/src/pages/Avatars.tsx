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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Avatar {
  id: string;
  name: string;
  description: string;
  pain_points: string[];
  desires: string[];
  motivations: string[];
  objections: string[];
  language_sample: string;
  ad_angles: string[];
}

const EMPTY_AVATAR: Omit<Avatar, 'id'> = {
  name: '',
  description: '',
  pain_points: [],
  desires: [],
  motivations: [],
  objections: [],
  language_sample: '',
  ad_angles: [],
};

function TagList({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1 pr-1">
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))} className="text-muted-foreground hover:text-foreground">
                <X size={10} />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Agregar y Enter"
          className="h-8 text-xs"
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} className="h-8 px-2">
          <Plus size={12} />
        </Button>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy} className="h-7 text-xs">
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? 'Copiado!' : 'Copiar'}
    </Button>
  );
}

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
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      {isNew && (
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">ID (sin espacios)</Label>
          <Input
            value={form.id}
            onChange={(e) => set('id', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            placeholder="ej: trader_agotado"
            className="h-8 font-mono text-xs"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nombre</Label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Trader Agotado"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descripción</Label>
          <Input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Breve descripción"
            className="h-8 text-xs"
          />
        </div>
      </div>
      <TagList label="Pain Points" values={form.pain_points} onChange={(v) => set('pain_points', v)} />
      <TagList label="Deseos" values={form.desires ?? []} onChange={(v) => set('desires', v)} />
      <TagList label="Motivaciones" values={form.motivations} onChange={(v) => set('motivations', v)} />
      <TagList label="Objeciones" values={form.objections} onChange={(v) => set('objections', v)} />
      <TagList label="Ángulos de Ad" values={form.ad_angles ?? []} onChange={(v) => set('ad_angles', v)} />
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Frase representativa</Label>
        <Textarea
          value={form.language_sample}
          onChange={(e) => set('language_sample', e.target.value)}
          rows={2}
          placeholder="En sus propias palabras..."
          className="text-xs"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          onClick={() => onSave(form)}
          disabled={saving || !form.name || (isNew && !form.id)}
          className="flex-1"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

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
        desires: updated.desires,
        motivations: updated.motivations,
        objections: updated.objections,
        language_sample: updated.language_sample,
        ad_angles: updated.ad_angles,
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
    <Card className="overflow-hidden py-0">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">{avatar.name}</span>
            <span className="text-xs font-mono text-muted-foreground">#{avatar.id}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{avatar.description}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setEditing(!editing); setExpanded(false); }}
            className="h-7 text-xs"
          >
            Editar
          </Button>
          {confirmDelete ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                Confirmar
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(false)} className="h-7 w-7">
                <X size={13} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirmDelete(true)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setExpanded(!expanded); setEditing(false); }}
            className="h-7 w-7"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </Button>
        </div>
      </div>

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

      {expanded && !editing && (
        <>
          <Separator />
          <div className="px-4 py-4 space-y-3">
            {avatar.pain_points.length > 0 && (
              <AttrRow label="Pain Points" items={avatar.pain_points} tone="destructive" />
            )}
            {(avatar.desires ?? []).length > 0 && (
              <AttrRow label="Deseos" items={avatar.desires} tone="desires" />
            )}
            {avatar.motivations.length > 0 && (
              <AttrRow label="Motivaciones" items={avatar.motivations} tone="accent" />
            )}
            {avatar.objections.length > 0 && (
              <AttrRow label="Objeciones" items={avatar.objections} tone="warning" />
            )}
            {avatar.language_sample && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Frase representativa</p>
                <p className="text-xs text-foreground italic">"{avatar.language_sample}"</p>
              </div>
            )}
            {(avatar.ad_angles ?? []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Ángulos de Ad</p>
                <div className="space-y-1.5">
                  {(avatar.ad_angles ?? []).map((a, i) => (
                    <p key={i} className="text-xs text-primary bg-primary/5 border border-primary/15 rounded px-2.5 py-1.5">{a}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function AttrRow({ label, items, tone }: { label: string; items: string[]; tone: 'destructive' | 'desires' | 'accent' | 'warning' }) {
  const toneClass = {
    destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
    desires: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
    accent: 'bg-accent/10 border-accent/30 text-accent',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
  }[tone];

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((v) => (
          <span key={v} className={cn('px-2 py-0.5 rounded-full border text-xs', toneClass)}>{v}</span>
        ))}
      </div>
    </div>
  );
}

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
    <Card className="overflow-hidden border-primary/30 py-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
      >
        <Sparkles size={15} className="text-primary" />
        <span className="text-sm font-medium text-primary">Generar avatares con IA</span>
        <span className="ml-auto text-xs text-muted-foreground">Claude + copiar/pegar</span>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <>
          <Separator />
          <CardContent className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              Generá perfiles de cliente con Claude. Copiá el prompt → pegalo en{' '}
              <span className="text-primary">claude.ai</span> → pegá el JSON abajo.
            </p>

            {!prompt ? (
              <Button onClick={handleBuild} disabled={loadingPrompt} size="sm">
                {loadingPrompt ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Construir prompt de investigación
              </Button>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Prompt listo — copialo a claude.ai</span>
                  <CopyButton text={prompt} />
                </div>
                <Textarea readOnly value={prompt} rows={4} className="font-mono text-xs" />
                <Textarea
                  value={pasteRaw}
                  onChange={(e) => setPasteRaw(e.target.value)}
                  placeholder="Pegá aquí el JSON que devolvió Claude..."
                  rows={4}
                  className="font-mono text-xs"
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {parsed.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-accent">{parsed.length} avatares parseados</p>
                    {parsed.map((a) => (
                      <div key={a.id} className="bg-muted/40 rounded-lg px-3 py-2 text-xs">
                        <span className="font-medium text-foreground">{a.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono">#{a.id}</span>
                        <p className="text-muted-foreground mt-0.5">{a.description}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving} size="sm" className="flex-1">
                        {saving ? 'Guardando...' : 'Guardar todos'}
                      </Button>
                      <Button onClick={reset} variant="ghost" size="sm">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleParse} disabled={loadingParse || !pasteRaw.trim()} size="sm">
                    {loadingParse ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    Parsear respuesta de Claude
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}

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
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        <Loader2 size={18} className="animate-spin mr-2" /> Cargando avatares...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Avatares</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Perfiles de cliente de la marca. Se usan en Concept Ads para generar creativos dirigidos.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => { setShowNewForm((o) => !o); setError(''); }}
        >
          <Plus size={15} />
          Nuevo avatar
        </Button>
      </div>

      <AiAssist onSaved={handleAiSaved} />

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
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {avatars.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No hay avatares todavía.</p>
          <p className="text-xs mt-1">Creá uno manualmente o generá con IA.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{avatars.length} avatar{avatars.length !== 1 ? 'es' : ''}</p>
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
