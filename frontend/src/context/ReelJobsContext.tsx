import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { SceneVersion } from '../lib/api';
import { generateReelScene } from '../lib/api';

/**
 * Tracks in-flight reel scene generations keyed by `${filename}::${reelSlug}::${sceneNumber}`.
 * Lives above the router so navigating away while a Veo call is pending doesn't lose state.
 */

export interface GenerateArgs {
  filename: string;
  reel_number: number;
  scene_number: number;
  setting: string;
  expression: string;
  tone_id: string;
  dialogue: string;
  animation_hint: string;
  aspect_ratio: string;
  extra_image_prompt?: string;
  reel_slug: string;  // for keying only
}

interface JobResult {
  scene_number: number;
  new_version: SceneVersion;
  all_versions: SceneVersion[];
  favorite_version: number | null;
}

interface JobState {
  inFlight: boolean;
  lastResult?: JobResult;
  lastError?: string;
}

type JobMap = Record<string, JobState>;

type Listener = (result: JobResult) => void;

interface CtxValue {
  jobs: JobMap;
  startGenerate: (args: GenerateArgs, onDone?: Listener) => Promise<JobResult | null>;
  isGenerating: (key: string) => boolean;
  jobKey: (filename: string, reelSlug: string, sceneNumber: number) => string;
}

const Ctx = createContext<CtxValue | null>(null);

export function ReelJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobMap>({});
  const listenersRef = useRef<Record<string, Listener[]>>({});

  const jobKey = useCallback(
    (filename: string, reelSlug: string, sceneNumber: number) =>
      `${filename}::${reelSlug}::${sceneNumber}`,
    [],
  );

  const update = useCallback((key: string, patch: Partial<JobState>) => {
    setJobs((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { inFlight: false }), ...patch } }));
  }, []);

  const startGenerate = useCallback(
    async (args: GenerateArgs, onDone?: Listener): Promise<JobResult | null> => {
      const key = jobKey(args.filename, args.reel_slug, args.scene_number);

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
        const result = await generateReelScene({
          filename: args.filename,
          reel_number: args.reel_number,
          scene_number: args.scene_number,
          setting: args.setting,
          expression: args.expression,
          tone_id: args.tone_id,
          dialogue: args.dialogue,
          animation_hint: args.animation_hint,
          aspect_ratio: args.aspect_ratio,
          extra_image_prompt: args.extra_image_prompt,
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

export function useReelJobs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReelJobs must be used inside ReelJobsProvider');
  return ctx;
}
