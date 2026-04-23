import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Plus,
  Rocket,
  Settings as SettingsIcon,
  Trash2,
  Upload,
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
import { cn } from '@/lib/utils';

const CTA_OPTIONS: { value: string; label: string }[] = [
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'SHOP_NOW', label: 'Shop Now' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'SUBSCRIBE', label: 'Subscribe' },
  { value: 'GET_OFFER', label: 'Get Offer' },
  { value: 'ORDER_NOW', label: 'Order Now' },
  { value: 'BOOK_NOW', label: 'Book Now' },
  { value: 'CONTACT_US', label: 'Contact Us' },
  { value: 'DOWNLOAD', label: 'Download' },
  { value: 'GET_QUOTE', label: 'Get Quote' },
  { value: 'APPLY_NOW', label: 'Apply Now' },
  { value: 'BUY_NOW', label: 'Buy Now' },
  { value: 'WATCH_MORE', label: 'Watch More' },
  { value: 'SEE_MENU', label: 'See Menu' },
  { value: 'SEND_MESSAGE', label: 'Send Message' },
  { value: 'GET_STARTED', label: 'Get Started' },
];

const AD_SET_MODES = [
  {
    value: 'single' as const,
    label: 'Single ad set',
    desc: 'All ads in one ad set. Best for broad testing — Meta distributes spend across creatives.',
  },
  {
    value: 'per_creative' as const,
    label: 'Per creative',
    desc: 'One ad per creative. Each gets its own budget and supports multiple text variations that Meta rotates.',
  },
];

type Step = 1 | 2 | 3 | 'done';
type AdSetMode = 'single' | 'per_creative';

function formatBytes(bytes: number): string {
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
  const [fetchingCampaigns, setFetchingCampaigns] = useState(false);
  const [adSets, setAdSets] = useState<MetaAdSet[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [adSetId, setAdSetId] = useState('');
  const [adSetMode, setAdSetMode] = useState<AdSetMode>('single');
  const [useExistingAdSet, setUseExistingAdSet] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState('');
  const [cloneName, setCloneName] = useState('');
  const [cloning, setCloning] = useState(false);
  const [launchAsPaused, setLaunchAsPaused] = useState(true);
  const [enhancementsEnabled, setEnhancementsEnabled] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{
    status: string;
    ads_created: number;
    ads_errored: number;
    error_log: string[];
  } | null>(null);

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
    setFetchingCampaigns(true);
    fetchMetaCampaigns()
      .then(setCampaigns)
      .catch((e) => setError((e as Error).message))
      .finally(() => setFetchingCampaigns(false));
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

  // ─── Step 3: inline ad set create ───────────────────────────────────────────
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
      setUseExistingAdSet(true);
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
    setAdSetMode('single');
    setUseExistingAdSet(false);
    setCloneSourceId('');
    setCloneName('');
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
        <Alert className="mt-2">
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
      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { n: 1, label: 'Upload Creatives' },
          { n: 2, label: 'Ad Copy & URL' },
          { n: 3, label: 'Campaign & Launch' },
        ].map((s, i) => {
          const current = step === 'done' ? 4 : step;
          const completed = current > s.n;
          const active = current === s.n;
          return (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  completed
                    ? 'bg-green-500 text-white'
                    : active
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {completed ? <CheckCircle2 size={14} /> : s.n}
              </div>
              <span className={completed || active ? 'text-foreground' : 'text-muted-foreground'}>
                {s.label}
              </span>
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

            <div className="space-y-1">
              <Label>Creatives</Label>
              <Dropzone onFiles={addFiles} />
            </div>

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
                      {c.thumbnail_path ? '✓ Thumb' : '+ Thumb'}
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
              <CardTitle>Destination & CTA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Destination URL (Website URL)</Label>
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
                <ComboInput
                  value={ctaType}
                  onChange={setCtaType}
                  options={CTA_OPTIONS}
                  placeholder="LEARN_MORE"
                />
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
          {/* Campaign */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <NativeSelect
                value={campaignId}
                onChange={(v) => { setCampaignId(v); setAdSetId(''); setUseExistingAdSet(false); }}
                placeholder={fetchingCampaigns ? 'Loading campaigns…' : 'Select a campaign'}
                options={campaigns.map((c) => ({ id: c.id, name: `${c.name} (${c.status})` }))}
              />
              {!fetchingCampaigns && campaigns.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No campaigns found. Verify the ad account configured in{' '}
                  <Link to="/tools/meta_ads/settings" className="underline hover:text-foreground">
                    Settings
                  </Link>{' '}
                  matches the account where you created the campaign.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ad Set Mode */}
          <Card>
            <CardHeader>
              <CardTitle>Ad Set Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {AD_SET_MODES.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => setAdSetMode(opt.value)}
                    className={cn(
                      'rounded-lg border-2 p-4 cursor-pointer transition-colors',
                      adSetMode === opt.value
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/30',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                          adSetMode === opt.value ? 'border-accent' : 'border-muted-foreground',
                        )}
                      >
                        {adSetMode === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-accent" />
                        )}
                      </div>
                      <span className="font-medium text-sm">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ad Set */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ad Set</CardTitle>
                {campaignId && adSets.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUseExistingAdSet(!useExistingAdSet);
                      if (!useExistingAdSet) {
                        setCloneSourceId('');
                        setCloneName('');
                      }
                    }}
                  >
                    {useExistingAdSet ? (
                      <><Plus size={14} className="mr-1" /> Create new ad set</>
                    ) : (
                      'Use existing ad set'
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!campaignId ? (
                <p className="text-sm text-muted-foreground">Pick a campaign first.</p>
              ) : useExistingAdSet ? (
                <div className="space-y-2">
                  <NativeSelect
                    value={adSetId}
                    onChange={setAdSetId}
                    placeholder="Select an ad set"
                    options={adSets.map((a) => ({ id: a.id, name: `${a.name} (${a.status})` }))}
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Create a new ad set by copying targeting &amp; budget from an existing one.
                  </p>
                  <div className="space-y-2">
                    <Label>Copy settings from</Label>
                    <NativeSelect
                      value={cloneSourceId}
                      onChange={setCloneSourceId}
                      placeholder={adSets.length === 0 ? 'No ad sets found' : 'Select an ad set'}
                      options={adSets.map((a) => ({ id: a.id, name: a.name }))}
                      disabled={adSets.length === 0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New ad set name</Label>
                    <Input
                      value={cloneName}
                      onChange={(e) => setCloneName(e.target.value)}
                      placeholder={`${batchName} — ad set`}
                    />
                  </div>
                  <Button
                    onClick={handleCloneAdSet}
                    disabled={!cloneSourceId || !cloneName.trim() || cloning}
                    size="sm"
                  >
                    {cloning && <Loader2 size={14} className="animate-spin mr-1.5" />}
                    Create Ad Set
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Launch Options */}
          <Card>
            <CardHeader>
              <CardTitle>Launch Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="paused"
                  checked={launchAsPaused}
                  onCheckedChange={(c: boolean | 'indeterminate') => setLaunchAsPaused(c === true)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="paused" className="cursor-pointer font-medium">
                    Launch as paused
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review in Ads Manager before activating
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="enh"
                  checked={enhancementsEnabled}
                  onCheckedChange={(c: boolean | 'indeterminate') => setEnhancementsEnabled(c === true)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="enh" className="cursor-pointer font-medium">
                    Enable creative enhancements
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Meta AI auto-adjusts your creative
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <div>
                <span className="text-muted-foreground">Ad set mode:</span>{' '}
                {AD_SET_MODES.find((m) => m.value === adSetMode)?.label}
              </div>
              <div>
                <span className="text-muted-foreground">Creatives:</span> {creatives.length}
              </div>
              <div>
                <span className="text-muted-foreground">Text variations:</span>{' '}
                {primaryTexts.filter((t) => t.trim()).length} primary ·{' '}
                {headlines.filter((t) => t.trim()).length} headlines ·{' '}
                {descriptions.filter((t) => t.trim()).length} descriptions
              </div>
              <div>
                <span className="text-muted-foreground">CTA:</span> {ctaType}
              </div>
              <div>
                <span className="text-muted-foreground">URL:</span> {url}
              </div>
              <div>
                <span className="text-muted-foreground">Enhancements:</span>{' '}
                {enhancementsEnabled ? 'Enabled' : 'Disabled'}
              </div>
              <div>
                <span className="text-muted-foreground">Launch Status:</span>{' '}
                {launchAsPaused ? 'Paused' : 'Active'}
              </div>
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
              {(launchResult.status === 'complete' || launchResult.status === 'completed') &&
              launchResult.ads_errored === 0 ? (
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
    </div>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function X({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

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

function ComboInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = open
    ? options.filter(
        (o) =>
          !filter ||
          o.label.toLowerCase().includes(filter.toLowerCase()) ||
          o.value.toLowerCase().includes(filter.toLowerCase()),
      )
    : [];

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => { onChange(e.target.value); setFilter(e.target.value); }}
        onFocus={() => { setFilter(''); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Custom value will be used as-is.</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                className="w-full flex items-center justify-between gap-4 px-3 py-2 text-sm text-left hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.value);
                  setFilter('');
                  setOpen(false);
                }}
              >
                <span>{o.label}</span>
                <span className="text-xs text-muted-foreground shrink-0">{o.value}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-10 rounded-md border border-input bg-background px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-3 text-muted-foreground pointer-events-none" />
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
