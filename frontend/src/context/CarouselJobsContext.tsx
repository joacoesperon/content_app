import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { GenerateSlideResponse } from '../lib/api';
import { generateCarouselSlide } from '../lib/api';

/**
 * Tracks in-flight slide generations keyed by `${filename}::${postSlug}::${slideNumber}`.
 * Each key has:
 *  - inFlight: true while the FAL call is pending
 *  - lastError / lastResult: result of the most recent call
 *  - subscribers: component callbacks to notify on completion
 *
 * This lives above the router so navigating away while generating doesn't
 * cancel the request; when the user returns, the context state is intact
 * and the UI can re-render from it.
 */

export interface GenerateArgs {
  filename: string;
  post_number: number;
  slide_number: number;
  prompt: string;
  apply_modifier: boolean;
  resolution: string;
  aspect_ratio: string;
  seed?: number | null;
  thinking_level?: 'minimal' | 'high' | null;
  post_slug: string;  // used only to key the job; not sent to backend
}

interface JobState {
  inFlight: boolean;
  lastResult?: GenerateSlideResponse;
  lastError?: string;
}

type JobMap = Record<string, JobState>;

type Listener = (result: GenerateSlideResponse) => void;

interface CtxValue {
  jobs: JobMap;
  startGenerate: (args: GenerateArgs, onDone?: Listener) => Promise<GenerateSlideResponse | null>;
  isGenerating: (key: string) => boolean;
  jobKey: (filename: string, postSlug: string, slideNumber: number) => string;
}

const Ctx = createContext<CtxValue | null>(null);

export function CarouselJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobMap>({});
  // track listeners without re-rendering
  const listenersRef = useRef<Record<string, Listener[]>>({});

  const jobKey = useCallback(
    (filename: string, postSlug: string, slideNumber: number) =>
      `${filename}::${postSlug}::${slideNumber}`,
    [],
  );

  const update = useCallback((key: string, patch: Partial<JobState>) => {
    setJobs((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { inFlight: false }), ...patch } }));
  }, []);

  const startGenerate = useCallback(
    async (args: GenerateArgs, onDone?: Listener): Promise<GenerateSlideResponse | null> => {
      const key = jobKey(args.filename, args.post_slug, args.slide_number);

      // de-dupe: if already in flight, just attach the listener
      if (jobs[key]?.inFlight) {
        if (onDone) {
          listenersRef.current[key] = listenersRef.current[key] ?? [];
          listenersRef.current[key].push(onDone);
        }
        return null;
      }

      if (onDone) {
        listenersRef.current[key] = listenersRef.current[key] ?? [];
        listenersRef.current[key].push(onDone);
      }

      update(key, { inFlight: true, lastError: undefined });

      try {
        const result = await generateCarouselSlide({
          filename: args.filename,
          post_number: args.post_number,
          slide_number: args.slide_number,
          prompt: args.prompt,
          apply_modifier: args.apply_modifier,
          resolution: args.resolution,
          aspect_ratio: args.aspect_ratio,
          seed: args.seed ?? null,
          thinking_level: args.thinking_level ?? null,
        });
        update(key, { inFlight: false, lastResult: result });
        const fns = listenersRef.current[key] ?? [];
        delete listenersRef.current[key];
        fns.forEach((f) => {
          try { f(result); } catch { /* swallow */ }
        });
        return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Generation failed';
        update(key, { inFlight: false, lastError: msg });
        delete listenersRef.current[key];
        return null;
      }
    },
    [jobs, jobKey, update],
  );

  const isGenerating = useCallback((key: string) => !!jobs[key]?.inFlight, [jobs]);

  return (
    <Ctx.Provider value={{ jobs, startGenerate, isGenerating, jobKey }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCarouselJobs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCarouselJobs must be used inside CarouselJobsProvider');
  return ctx;
}
