import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, KeyRound, Save } from 'lucide-react';
import {
  fetchMetaSettings,
  saveMetaSettings,
  fetchMetaAccounts,
  fetchMetaPages,
  type MetaSettings,
  type MetaAdAccount,
  type MetaPage,
} from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MetaAdsSettings() {
  const [settings, setSettings] = useState<MetaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [token, setToken] = useState('');
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [fetchingMeta, setFetchingMeta] = useState(false);

  const [adAccountId, setAdAccountId] = useState('');
  const [pageId, setPageId] = useState('');

  useEffect(() => {
    fetchMetaSettings()
      .then((s) => {
        setSettings(s);
        setAdAccountId(s.ad_account_id);
        setPageId(s.page_id);
        if (s.configured) {
          void loadMetaOptions();
        }
      })
      .catch((e) => setError(e.message ?? String(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMetaOptions() {
    setFetchingMeta(true);
    setError(null);
    try {
      const [a, p] = await Promise.all([fetchMetaAccounts(), fetchMetaPages()]);
      setAccounts(a);
      setPages(p);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFetchingMeta(false);
    }
  }

  async function handleSaveToken() {
    if (!token.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const s = await saveMetaSettings({ access_token: token.trim() });
      setSettings(s);
      setToken('');
      await loadMetaOptions();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSelections() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const acc = accounts.find((a) => a.id === adAccountId);
      const page = pages.find((p) => p.id === pageId);
      const s = await saveMetaSettings({
        ad_account_id: adAccountId,
        ad_account_name: acc?.name ?? '',
        page_id: pageId,
        page_name: page?.name ?? '',
      });
      setSettings(s);
      setSuccess(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-16">
        <Loader2 size={16} className="animate-spin" /> Loading settings...
      </div>
    );
  }

  const hasToken = settings?.configured || !!settings?.access_token_masked;

  return (
    <div className="max-w-2xl space-y-6">

      {error && (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 size={16} />
          <AlertDescription>Settings saved successfully.</AlertDescription>
        </Alert>
      )}

      {/* Access Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound size={18} /> System User Access Token
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasToken && (
            <div className="text-sm text-muted-foreground">
              Current token: <span className="font-mono">{settings?.access_token_masked || '•••'}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="token">{hasToken ? 'Replace token' : 'Paste your access token'}</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="EAAxxxxx..."
            />
            <p className="text-xs text-muted-foreground">
              System User token with <code>ads_management, ads_read, business_management, pages_show_list</code>.
            </p>
          </div>
          <Button onClick={handleSaveToken} disabled={!token.trim() || saving}>
            {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Save token
          </Button>
        </CardContent>
      </Card>

      {/* Ad Account + Page */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Account & Facebook Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasToken ? (
            <p className="text-sm text-muted-foreground">
              Save a token first to load accounts and pages.
            </p>
          ) : fetchingMeta ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading accounts and pages from Meta...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Ad Account</Label>
                <Select value={adAccountId} onValueChange={setAdAccountId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an ad account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} {a.currency ? `(${a.currency})` : ''} — {a.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Facebook Page</Label>
                <Select value={pageId} onValueChange={setPageId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSelections} disabled={saving || !adAccountId || !pageId}>
                  {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                  Save selections
                </Button>
                <Button variant="outline" onClick={loadMetaOptions} disabled={fetchingMeta}>
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
