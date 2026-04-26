import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Globe,
  Loader2,
  Play,
  Save,
} from 'lucide-react';
import { fetchDirectorHistory, runDirector } from '../lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Step {
  type: string;
  tool?: string;
  input?: Record<string, string>;
  preview?: string;
  message?: string;
}

interface Output {
  filename: string;
  content: string;
}

const TOOL_LABELS: Record<string, string> = {
  read_brand_file: 'Reading',
  web_search: 'Web search',
  reddit_search: 'Reddit',
  get_current_time: 'Getting date',
  write_output_file: 'Saving scripts',
  write_brand_file: 'Updating state',
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  read_brand_file: <FileText size={13} />,
  web_search: <Globe size={13} />,
  reddit_search: <Globe size={13} />,
  get_current_time: <Bot size={13} />,
  write_output_file: <Save size={13} />,
  write_brand_file: <Save size={13} />,
};

function StepRow({ step }: { step: Step }) {
  const [expanded, setExpanded] = useState(false);

  if (step.type === 'start') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Bot size={13} className="text-primary" />
        <span>{step.message}</span>
      </div>
    );
  }

  if (step.type === 'tool_call') {
    const label = TOOL_LABELS[step.tool ?? ''] ?? step.tool;
    const icon = TOOL_ICONS[step.tool ?? ''] ?? <Bot size={13} />;
    const detail =
      step.input?.query ?? step.input?.subreddit ?? step.input?.filename ?? step.input?.content?.slice(0, 60) ?? '';
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span>
          {label}
          {detail && (
            <span className="text-foreground/60 ml-1 font-mono text-xs">
              {detail.length > 60 ? detail.slice(0, 60) + '...' : detail}
            </span>
          )}
        </span>
      </div>
    );
  }

  if (step.type === 'tool_result') {
    return (
      <div className="ml-4">
        <button
          onClick={() => setExpanded((o) => !o)}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          show result
        </button>
        {expanded && step.preview && (
          <pre className="mt-1 text-xs text-muted-foreground/70 whitespace-pre-wrap bg-muted/30 rounded p-2 max-h-40 overflow-y-auto">
            {step.preview}
          </pre>
        )}
      </div>
    );
  }

  return null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

function HistoryItem({ item }: { item: Output }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="font-mono text-sm text-muted-foreground">{item.filename}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex justify-end mb-2">
            <CopyButton text={item.content} />
          </div>
          <pre className="text-xs text-foreground/80 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {item.content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function Director() {
  const [prompt, setPrompt] = useState('Generate this week\'s reel scripts following the standard process.');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [output, setOutput] = useState<{ output_file: string; content: string; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Output[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchDirectorHistory()
      .then(setHistory)
      .catch(() => {});
  }, []);

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  const handleRun = async () => {
    setRunning(true);
    setSteps([]);
    setOutput(null);
    setError(null);
    setElapsed(0);

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    try {
      await runDirector(prompt, (event) => {
        if (event.type === 'done') {
          const out = {
            output_file: event.output_file as string ?? '',
            content: event.content as string ?? '',
            summary: event.summary as string ?? '',
          };
          setOutput(out);
          setHistory((prev) => {
            if (!event.output_file) return prev;
            const filename = event.output_file as string;
            if (prev.some((h) => h.filename === filename)) return prev;
            return [{ filename, content: out.content }, ...prev];
          });
        } else if (event.type === 'error') {
          setError(event.message as string ?? 'Unknown error');
        } else {
          setSteps((prev) => [...prev, event as Step]);
        }
      });
    } catch (e) {
      setError(String(e));
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunning(false);
    }
  };

  const hasResult = output && output.content;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Director</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Generates Instagram Reel scripts featuring the JT mascot — research, plan, and per-scene briefs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run Director</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={running}
            className="text-sm resize-none"
            placeholder="Optional override — leave default to use weekly process"
          />
          <div className="flex items-center justify-between">
            {running && (
              <span className="text-xs text-muted-foreground font-mono">{elapsed}s</span>
            )}
            <Button onClick={handleRun} disabled={running || !prompt.trim()} className="ml-auto">
              {running ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Director working...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Run Director
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {(running || steps.length > 0) && !hasResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {running ? (
                <>
                  <Loader2 size={14} className="animate-spin text-primary" />
                  Progress
                </>
              ) : (
                'Progress'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-xs max-h-64 overflow-y-auto">
              {steps.map((step, i) => (
                <StepRow key={i} step={step} />
              ))}
              <div ref={stepsEndRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {hasResult && (
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle size={15} className="text-primary" />
                Reel scripts generated
              </CardTitle>
              <div className="flex items-center gap-2">
                {output.output_file && (
                  <span className="text-xs font-mono text-muted-foreground">{output.output_file}</span>
                )}
                <CopyButton text={output.content} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-foreground/90 whitespace-pre-wrap bg-muted/20 rounded-lg p-4 max-h-[600px] overflow-y-auto leading-relaxed">
              {output.content}
            </pre>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
            History
          </h3>
          {history.map((item) => (
            <HistoryItem key={item.filename} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
