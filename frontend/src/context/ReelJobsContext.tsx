import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { ReelSceneResult } from '../lib/api';
import { animateReelScene, generateReelSceneImage } from '../lib/api';

/**
 * Tracks in-flight reel scene jobs (image OR video) keyed by
 *   `${filename}::${reelSlug}::${sceneNumber}::${kind}` where kind is 'image' | 'video'
 * Lives above the router so navigating away mid-generation doesn't lose state.
 */

export interface GenerateImageArgs {
  filename: string;
  reel_number: number;
  scene_number: number;
  setting: string;
  expression: string;
  aspect_ratio: string;
  extra_image_prompt?: string;
  ref_filename?: string | null;
  prompt_override?: string | null;
  reel_slug: string;  // for keying
}

export interface AnimateArgs {
  filename: string;
  reel_number: number;
  scene_number: number;
  version: number;
  dialogue: string;
  animation_hint: string;
  tone_id: string;
  aspect_ratio: string;
  prompt_override?: string | null;
  auto_fix?: boolean;
  reel_slug: string;  // for keying
}

type Kind = 'image' | 'video';

interface JobState {
  inFlight: boolean;
  kind?: Kind;
  lastResult?: ReelSceneResult;
  lastError?: string;
}

type JobMap = Record<string, JobState>;

type Listener = (result: ReelSceneResult) => void;

interface CtxValue {
  jobs: JobMap;
  startGenerateImage: (args: GenerateImageArgs, onDone?: Listener) => Promise<ReelSceneResult | null>;
  startAnimate: (args: AnimateArgs, onDone?: Listener) => Promise<ReelSceneResult | null>;
  isGenerating: (key: string) => boolean;
  jobKey: (filename: string, reelSlug: string, sceneNumber: number, kind: Kind) => string;
}

const Ctx = createContext<CtxValue | null>(null);

export function ReelJobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobMap>({});
  const listenersRef = useRef<Record<string, Listener[]>>({});

  const jobKey = useCallback(
    (filename: string, reelSlug: string, sceneNumber: number, kind: Kind) =>
      `${filename}::${reelSlug}::${sceneNumber}::${kind}`,
    [],
  );

  const update = useCallback((key: string, patch: Partial<JobState>) => {
    setJobs((prev) => ({ ...prev, [key]: { ...(prev[key] ?? { inFlight: false }), ...patch } }));
  }, []);

  const isGenerating = useCallback((key: string) => !!jobs[key]?.inFlight, [jobs]);

  const runJob = async (
    key: string,
    kind: Kind,
    fn: () => Promise<ReelSceneResult>,
    onDone?: Listener,
  ): Promise<ReelSceneResult | null> => {
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
    update(key, { inFlight: true, kind, lastError: undefined });
    try {
      const result = await fn();
      update(key, { inFlight: false, lastResult: result });
      const fns = listenersRef.current[key] ?? [];
      delete listenersRef.current[key];
      fns.forEach((f) => { try { f(result); } catch { /* swallow */ } });
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Job failed';
      update(key, { inFlight: false, lastError: msg });
      delete listenersRef.current[key];
      return null;
    }
  };

  const startGenerateImage = useCallback(
    (args: GenerateImageArgs, onDone?: Listener) => {
      const key = jobKey(args.filename, args.reel_slug, args.scene_number, 'image');
      return runJob(key, 'image', () => generateReelSceneImage({
        filename: args.filename,
        reel_number: args.reel_number,
        scene_number: args.scene_number,
        setting: args.setting,
        expression: args.expression,
        aspect_ratio: args.aspect_ratio,
        extra_image_prompt: args.extra_image_prompt,
        ref_filename: args.ref_filename ?? null,
        prompt_override: args.prompt_override ?? null,
      }), onDone);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobs, jobKey],
  );

  const startAnimate = useCallback(
    (args: AnimateArgs, onDone?: Listener) => {
      const key = jobKey(args.filename, args.reel_slug, args.scene_number, 'video');
      return runJob(key, 'video', () => animateReelScene({
        filename: args.filename,
        reel_number: args.reel_number,
        scene_number: args.scene_number,
        version: args.version,
        dialogue: args.dialogue,
        animation_hint: args.animation_hint,
        tone_id: args.tone_id,
        aspect_ratio: args.aspect_ratio,
        prompt_override: args.prompt_override ?? null,
        auto_fix: args.auto_fix ?? true,
      }), onDone);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobs, jobKey],
  );

  return (
    <Ctx.Provider value={{ jobs, startGenerateImage, startAnimate, isGenerating, jobKey }}>
      {children}
    </Ctx.Provider>
  );
}

export function useReelJobs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useReelJobs must be used inside ReelJobsProvider');
  return ctx;
}
