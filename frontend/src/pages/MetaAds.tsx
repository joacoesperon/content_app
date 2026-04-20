import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Plus,
  Rocket,
  Settings as SettingsIcon,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  createMetaAdSet,
  createMetaBatch,
  fetchMetaAdSets,
  fetchMetaBatch,
  fetchMetaCampaigns,
  fetchMetaSettings,
  launchMetaBatch,
  renameMetaCreative,
  updateMetaBatch,
  uploadMetaCreativeThumbnail,
  uploadMetaCreatives,
  type MetaAdSet,
  type MetaBatch,
  type MetaCampaign,
  type MetaCreative,
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CTA_OPTIONS: { value: string; label: string }[] = [
  { value: 'SHOP_NOW', label: 'Shop Now' },
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'SUBSCRIBE', label: 'Subscribe' },
  { value: 'DOWNLOAD', label: 'Download' },
  { value: 'GET_OFFER', label: 'Get Offer' },
  { value: 'GET_QUOTE', label: 'Get Quote' },
  { value: 'CONTACT_US', label: 'Contact Us' },
  { value: 'BOOK_TRAVEL', label: 'Book Now' },
  { value: 'APPLY_NOW', label: 'Apply Now' },
  { value: 'ORDER_NOW', label: 'Order Now' },
  { value: 'SEE_MORE', label: 'See More' },
  { value: 'WATCH_MORE', label: 'Watch More' },
  { value: 'LISTEN_NOW', label: 'Listen Now' },
  { value: 'INSTALL_MOBILE_APP', label: 'Install Now' },
  { value: 'NO_BUTTON', label: 'No Button' },
];

type Step = 1 | 2 | 3 | 'done';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function defaultBatchName() {
  const now = new Date();
  const d = now.toISOString().slice(0, 10);
  const t = now.toTimeString().slice(0, 5);
  return `Batch ${d} ${t}`;
}

export default function MetaAds() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [batchName, setBatchName] = useState(defaultBatchName());
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Persistent batch state
  const [batch, setBatch] = useState<MetaBatch | null>(null);
  const [creatives, setCreatives] = useState<MetaCreative[]>([]);

  // Step 2 local state
  const [primaryTexts, setPrimaryTexts] = useState<string[]>(['']);
  const [headlines, setHeadlines] = useState<string[]>(['']);
  const [descriptions, setDescriptions] = useState<string[]>(['']);
  const [ctaType, setCtaType] = useState('SHOP_NOW');
  const [url, setUrl] = useState('');
  const [displayLink, setDisplayLink] = useState('');

  // Step 3 local state
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [adSets, setAdSets] = useState<MetaAdSet[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [adSetId, setAdSetId] = useState('');
  const [launchAsPaused, setLaunchAsPaused] = useState(true);
  const [enhancementsEnabled, setEnhancementsEnabled] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{
    status: string;
    ads_created: number;
    ads_errored: number;
    error_log: string[];
  } | null>(null);

  // Clone ad set modal
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState('');
  const [cloneName, setCloneName] = useState('');
  const [cloning, setCloning] = useState(false);

  // Thumbnail upload
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const [thumbCreativeId, setThumbCreativeId] = useState<string | null>(null);

  useEffect(() => {
    fetchMetaSettings()
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false));
  }, []);

  // Fetch campaigns when entering Step 3
  useEffect(() => {
    if (step !== 3) return;
    fetchMetaCampaigns()
      .then(setCampaigns)
      .catch((e) => setError((e as Error).message));
  }, [step]);

  useEffect(() => {
    if (!campaignId) {
      setAdSets([]);
      return;
    }
    fetchMetaAdSets(campaignId)
      .then(setAdSets)
      .catch((e) => setError((e as Error).message));
  }, [campaignId]);

  const addFiles = (newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── Step 1 → 2: create batch + upload ──────────────────────────────────────
  async function handleUpload() {
    if (!batchName.trim() || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const newBatch = await createMetaBatch(batchName.trim());
      const { creatives: created } = await uploadMetaCreatives(newBatch.id, files);
      setBatch(newBatch);
      setCreatives(created);
      setStep(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  // ─── Step 2 helpers ─────────────────────────────────────────────────────────
  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
    val: string,
  ) => setter((prev) => prev.map((v, i) => (i === idx ? val : v)));

  const addListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    list: string[],
  ) => {
    if (list.length >= 5) return;
    setter([...list, '']);
  };

  const removeListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    idx: number,
  ) => setter((prev) => prev.filter((_, i) => i !== idx));

  async function handleRenameCreative(creativeId: string, name: string) {
    setCreatives((prev) =>
      prev.map((c) => (c.id === creativeId ? { ...c, ad_name: name } : c)),
    );
    try {
      await renameMetaCreative(creativeId, name);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function handleClickThumb(creativeId: string) {
    setThumbCreativeId(creativeId);
    thumbInputRef.current?.click();
  }

  async function handleThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !thumbCreativeId) return;
    try {
      const updated = await uploadMetaCreativeThumbnail(thumbCreativeId, file);
      setCreatives((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setThumbCreativeId(null);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  }

  // ─── Step 2 → 3: save copy ──────────────────────────────────────────────────
  const step2Valid = useMemo(() => {
    const hasPrimary = primaryTexts.some((t) => t.trim());
    const hasHeadline = headlines.some((t) => t.trim());
    const hasUrl = url.trim().length > 0;
    return hasPrimary && hasHeadline && hasUrl;
  }, [primaryTexts, headlines, url]);

  async function handleSaveCopy() {
    if (!batch || !step2Valid) return;
    setError(null);
    try {
      const updated = await updateMetaBatch(batch.id, {
        primary_texts: primaryTexts.filter((t) => t.trim()),
        headlines: headlines.filter((t) => t.trim()),
        descriptions: descriptions.filter((t) => t.trim()),
        cta_type: ctaType,
        url: url.trim(),
        display_link: displayLink.trim(),
      });
      setBatch(updated);
      setStep(3);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // ─── Step 3: ad set clone ───────────────────────────────────────────────────
  async function handleCloneAdSet() {
    if (!cloneSourceId || !cloneName.trim() || !campaignId) return;
    setCloning(true);
    setError(null);
    try {
      const created = await createMetaAdSet({
        campaign_id: campaignId,
        source_ad_set_id: cloneSourceId,
        name: cloneName.trim(),
      });
      const refreshed = await fetchMetaAdSets(campaignId);
      setAdSets(refreshed);
      setAdSetId(created.id);
      setShowCloneModal(false);
      setCloneSourceId('');
      setCloneName('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCloning(false);
    }
  }

  // ─── Launch ─────────────────────────────────────────────────────────────────
  async function handleLaunch() {
    if (!batch || !campaignId || !adSetId) return;
    setLaunching(true);
    setError(null);
    try {
      const selectedCampaign = campaigns.find((c) => c.id === campaignId);
      const selectedAdSet = adSets.find((a) => a.id === adSetId);
      await updateMetaBatch(batch.id, {
        campaign_id: campaignId,
        campaign_name: selectedCampaign?.name ?? '',
        ad_set_id: adSetId,
        ad_set_name: selectedAdSet?.name ?? '',
        launch_as_paused: launchAsPaused,
        enhancements_enabled: enhancementsEnabled,
      });
      const result = await launchMetaBatch(batch.id);
      setLaunchResult(result);
      const fresh = await fetchMetaBatch(batch.id);
      setBatch(fresh.batch);
      setCreatives(fresh.creatives);
      setStep('done');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLaunching(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setError(null);
    setBatch(null);
    setCreatives([]);
    setFiles([]);
    setBatchName(defaultBatchName());
    setPrimaryTexts(['']);
    setHeadlines(['']);
    setDescriptions(['']);
    setCtaType('SHOP_NOW');
    setUrl('');
    setDisplayLink('');
    setCampaignId('');
    setAdSetId('');
    setLaunchAsPaused(true);
    setEnhancementsEnabled(false);
    setLaunchResult(null);
  }

  // ─── Guards ──────────────────────────────────────────────────────────────────
  if (configured === null) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-16">
        <Loader2 size={16} className="animate-spin" /> Loading...
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Meta Ads</h1>
        <Alert className="mt-6">
          <SettingsIcon size={16} />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Setup required. Configure your Meta API credentials to continue.</span>
            <Button asChild size="sm">
              <Link to="/tools/meta_ads/settings">Go to Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Meta Ads</h1>
          <p className="text-muted-foreground text-sm">Bulk upload and launch Meta ads.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/tools/meta_ads/history">History</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/tools/meta_ads/settings">
              <SettingsIcon size={14} /> Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { n: 1, label: 'Upload' },
          { n: 2, label: 'Ad Copy' },
          { n: 3, label: 'Launch' },
        ].map((s, i) => {
          const current = step === 'done' ? 4 : step;
          const active = current >= s.n;
          return (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {s.n}
              </div>
              <span className={active ? 'text-foreground' : 'text-muted-foreground'}>{s.label}</span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ─── Step 1: Upload ─── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Upload creatives</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-name">Batch name</Label>
              <Input
                id="batch-name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
              />
            </div>

            <Dropzone onFiles={addFiles} />

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{files.length} file(s) selected</p>
                <ul className="space-y-1 max-h-64 overflow-y-auto">
                  {files.map((f, idx) => {
                    const isVideo = f.type.startsWith('video/');
                    return (
                      <li
                        key={`${f.name}-${idx}`}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md border border-border text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isVideo ? <FileVideo size={14} /> : <ImageIcon size={14} />}
                          <span className="truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
                        </div>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!batchName.trim() || files.length === 0 || uploading}
              >
                {uploading ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Upload size={16} className="mr-2" />
                )}
                Upload & continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Step 2: Ad Copy ─── */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Creatives</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {creatives.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-border"
                >
                  {c.file_type === 'video' ? (
                    <FileVideo size={16} className="text-muted-foreground" />
                  ) : (
                    <ImageIcon size={16} className="text-muted-foreground" />
                  )}
                  <Input
                    value={c.ad_name}
                    onChange={(e) => handleRenameCreative(c.id, e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">{c.filename}</span>
                  {c.file_type === 'video' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClickThumb(c.id)}
                    >
                      {c.thumbnail_path ? 'Replace thumb' : '+ Thumb'}
                    </Button>
                  )}
                </div>
              ))}
              <input
                ref={thumbInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleThumbChange}
              />
            </CardContent>
          </Card>

          <VariationSection
            title="Primary Text"
            hint="The body copy shown above the media (up to 5 variations)."
            values={primaryTexts}
            onChange={(i, v) => updateListItem(setPrimaryTexts, i, v)}
            onAdd={() => addListItem(setPrimaryTexts, primaryTexts)}
            onRemove={(i) => removeListItem(setPrimaryTexts, i)}
            multiline
          />

          <VariationSection
            title="Headlines"
            hint="Short bold text below the media (up to 5 variations)."
            values={headlines}
            onChange={(i, v) => updateListItem(setHeadlines, i, v)}
            onAdd={() => addListItem(setHeadlines, headlines)}
            onRemove={(i) => removeListItem(setHeadlines, i)}
          />

          <VariationSection
            title="Descriptions"
            hint="Optional small text under the headline (up to 5 variations)."
            values={descriptions}
            onChange={(i, v) => updateListItem(setDescriptions, i, v)}
            onAdd={() => addListItem(setDescriptions, descriptions)}
            onRemove={(i) => removeListItem(setDescriptions, i)}
          />

          <Card>
            <CardHeader>
              <CardTitle>Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Destination URL</Label>
                <Input
                  placeholder="https://example.com/landing"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Display link (optional)</Label>
                <Input
                  placeholder="example.com"
                  value={displayLink}
                  onChange={(e) => setDisplayLink(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Call to Action</Label>
                <Select value={ctaType} onValueChange={setCtaType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CTA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleSaveCopy} disabled={!step2Valid}>
              Continue to launch
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Campaign & Launch ─── */}
      {step === 3 && batch && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign & Ad Set</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign</Label>
                <Select
                  value={campaignId}
                  onValueChange={(v: string) => {
                    setCampaignId(v);
                    setAdSetId('');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} <span className="text-muted-foreground ml-2">({c.status})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ad Set</Label>
                  {campaignId && adSets.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCloneName(`${batchName} — ad set`);
                        setShowCloneModal(true);
                      }}
                    >
                      <Plus size={14} className="mr-1" /> Create new (clone)
                    </Button>
                  )}
                </div>
                <Select
                  value={adSetId}
                  onValueChange={setAdSetId}
                  disabled={!campaignId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={campaignId ? 'Select an ad set' : 'Pick a campaign first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {adSets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} <span className="text-muted-foreground ml-2">({a.status})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="paused"
                  checked={launchAsPaused}
                  onCheckedChange={(c: boolean | 'indeterminate') => setLaunchAsPaused(c === true)}
                />
                <Label htmlFor="paused" className="cursor-pointer">
                  Launch as paused (recommended)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enh"
                  checked={enhancementsEnabled}
                  onCheckedChange={(c: boolean | 'indeterminate') => setEnhancementsEnabled(c === true)}
                />
                <Label htmlFor="enh" className="cursor-pointer">
                  Enable standard creative enhancements
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div><span className="text-muted-foreground">Batch:</span> {batch.name}</div>
              <div><span className="text-muted-foreground">Ads to create:</span> {creatives.length}</div>
              <div>
                <span className="text-muted-foreground">Copy variations:</span>{' '}
                {primaryTexts.filter((t) => t.trim()).length} primary ·{' '}
                {headlines.filter((t) => t.trim()).length} headlines ·{' '}
                {descriptions.filter((t) => t.trim()).length} descriptions
              </div>
              <div><span className="text-muted-foreground">URL:</span> {url}</div>
              <div><span className="text-muted-foreground">CTA:</span> {ctaType}</div>
              <div><span className="text-muted-foreground">Status at launch:</span> {launchAsPaused ? 'Paused' : 'Active'}</div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} disabled={launching}>
              Back
            </Button>
            <Button
              onClick={handleLaunch}
              disabled={!campaignId || !adSetId || launching}
            >
              {launching ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Rocket size={16} className="mr-2" />
              )}
              Launch {creatives.length} ad{creatives.length === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Done ─── */}
      {step === 'done' && launchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {launchResult.status === 'completed' && launchResult.ads_errored === 0 ? (
                <>
                  <CheckCircle2 size={18} className="text-green-500" /> All ads launched
                </>
              ) : launchResult.ads_created > 0 ? (
                <>
                  <AlertCircle size={18} className="text-yellow-500" /> Partial success
                </>
              ) : (
                <>
                  <AlertCircle size={18} className="text-destructive" /> Launch failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Badge variant="secondary" className="gap-1 text-green-500">
                {launchResult.ads_created} created
              </Badge>
              {launchResult.ads_errored > 0 && (
                <Badge variant="destructive">{launchResult.ads_errored} errored</Badge>
              )}
            </div>
            {launchResult.error_log.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Errors:</p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  {launchResult.error_log.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={resetWizard}>Upload another batch</Button>
              <Button variant="outline" asChild>
                <Link to="/tools/meta_ads/history">Go to history</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clone Ad Set Modal */}
      <Dialog open={showCloneModal} onOpenChange={(o: boolean) => setShowCloneModal(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new ad set</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clones budget, targeting, and optimization settings from an existing ad set. The new ad set is created paused.
            </p>
            <div className="space-y-2">
              <Label>Source ad set</Label>
              <Select value={cloneSourceId} onValueChange={setCloneSourceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick an ad set to clone from" />
                </SelectTrigger>
                <SelectContent>
                  {adSets.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>New ad set name</Label>
              <Input value={cloneName} onChange={(e) => setCloneName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloneModal(false)} disabled={cloning}>
              Cancel
            </Button>
            <Button
              onClick={handleCloneAdSet}
              disabled={!cloneSourceId || !cloneName.trim() || cloning}
            >
              {cloning && <Loader2 size={16} className="animate-spin mr-2" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function Dropzone({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.length) {
          onFiles(e.dataTransfer.files);
        }
      }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
        dragActive
          ? 'border-accent bg-accent/5'
          : 'border-border hover:border-accent/50 hover:bg-muted/30'
      }`}
    >
      <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">Drag files or click to upload</p>
      <p className="text-xs text-muted-foreground mt-1">Images and videos supported</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function VariationSection({
  title,
  hint,
  values,
  onChange,
  onAdd,
  onRemove,
  multiline = false,
}: {
  title: string;
  hint?: string;
  values: string[];
  onChange: (idx: number, val: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  multiline?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">{values.length}/5</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              {multiline ? (
                <Textarea value={v} onChange={(e) => onChange(i, e.target.value)} rows={3} />
              ) : (
                <Input value={v} onChange={(e) => onChange(i, e.target.value)} />
              )}
            </div>
            {values.length > 1 && (
              <Button variant="ghost" size="icon" onClick={() => onRemove(i)}>
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
        {values.length < 5 && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus size={14} className="mr-1" /> Add variation
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
