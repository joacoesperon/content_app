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
import { fetchScoutHistory, runScout } from '../lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ScoutStep {
  type: string;
  tool?: string;
  input?: Record<string, string>;
  preview?: string;
  message?: string;
}

interface ScoutOutput {
  filename: string;
  content: string;
}

const TOOL_LABELS: Record<string, string> = {
  read_brand_file: 'Leyendo',
  web_search: 'Buscando',
  write_output_file: 'Guardando contenido',
  write_brand_file: 'Actualizando estado',
};

const TOOL_ICONS: Record<string, React.ReactNode> = {
  read_brand_file: <FileText size={13} />,
  web_search: <Globe size={13} />,
  write_output_file: <Save size={13} />,
  write_brand_file: <Save size={13} />,
};

function StepRow({ step }: { step: ScoutStep }) {
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
      step.input?.query ?? step.input?.filename ?? step.input?.content?.slice(0, 60) ?? '';
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
          ver resultado
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
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  );
}

function HistoryItem({ item }: { item: ScoutOutput }) {
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

export default function Scout() {
  const [prompt, setPrompt] = useState('Generá contenido orgánico para Instagram esta semana');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ScoutStep[]>([]);
  const [output, setOutput] = useState<{ output_file: string; content: string; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ScoutOutput[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchScoutHistory()
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
      await runScout(prompt, (event) => {
        if (event.type === 'done') {
          setOutput({
            output_file: event.output_file as string ?? '',
            content: event.content as string ?? '',
            summary: event.summary as string ?? '',
          });
          setHistory((prev) => {
            if (!event.output_file) return prev;
            const filename = (event.output_file as string).replace('scout-output/', '');
            if (prev.some((h) => h.filename === filename)) return prev;
            return [{ filename, content: event.content as string ?? '' }, ...prev];
          });
        } else if (event.type === 'error') {
          setError(event.message as string ?? 'Error desconocido');
        } else {
          setSteps((prev) => [...prev, event as ScoutStep]);
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
        <h2 className="text-xl font-bold text-foreground">Scout</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Investiga el nicho, elige el avatar correcto, y genera 5 briefs de posts para Instagram.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ejecutar Scout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={running}
            className="text-sm resize-none"
            placeholder="Descripción del batch de contenido..."
          />
          <div className="flex items-center justify-between">
            {running && (
              <span className="text-xs text-muted-foreground font-mono">{elapsed}s</span>
            )}
            <Button onClick={handleRun} disabled={running || !prompt.trim()} className="ml-auto">
              {running ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Scout trabajando...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Ejecutar Scout
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
                  Progreso
                </>
              ) : (
                'Progreso'
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
                Contenido generado
              </CardTitle>
              <div className="flex items-center gap-2">
                {output.output_file && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {output.output_file}
                  </span>
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
            Historial
          </h3>
          {history.map((item) => (
            <HistoryItem key={item.filename} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
