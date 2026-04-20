import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

interface ToolJob {
  jobId: string | null;
  messages: WsMessage[];
  generating: boolean;
  generatedImages: { src: string; label: string }[];
}

const emptyJob = (): ToolJob => ({
  jobId: null,
  messages: [],
  generating: false,
  generatedImages: [],
});

export type JobTool = 'static_ads' | 'concept_ads';

interface JobContextValue {
  getJob: (tool: JobTool) => ToolJob;
  setJobId: (tool: JobTool, id: string | null) => void;
  addMessage: (tool: JobTool, msg: WsMessage) => void;
  addImages: (tool: JobTool, imgs: { src: string; label: string }[]) => void;
  setGenerating: (tool: JobTool, v: boolean) => void;
  reset: (tool: JobTool) => void;
}

const JobContext = createContext<JobContextValue | null>(null);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Record<JobTool, ToolJob>>({
    static_ads: emptyJob(),
    concept_ads: emptyJob(),
  });

  const update = useCallback((tool: JobTool, patch: Partial<ToolJob>) => {
    setJobs((prev) => ({ ...prev, [tool]: { ...prev[tool], ...patch } }));
  }, []);

  const getJob = useCallback((tool: JobTool) => jobs[tool], [jobs]);

  const setJobId = useCallback((tool: JobTool, id: string | null) => {
    update(tool, { jobId: id });
  }, [update]);

  const addMessage = useCallback((tool: JobTool, msg: WsMessage) => {
    setJobs((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], messages: [...prev[tool].messages, msg] },
    }));
  }, []);

  const addImages = useCallback((tool: JobTool, imgs: { src: string; label: string }[]) => {
    setJobs((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], generatedImages: [...prev[tool].generatedImages, ...imgs] },
    }));
  }, []);

  const setGenerating = useCallback((tool: JobTool, v: boolean) => {
    update(tool, { generating: v });
  }, [update]);

  const reset = useCallback((tool: JobTool) => {
    update(tool, emptyJob());
  }, [update]);

  return (
    <JobContext.Provider value={{ getJob, setJobId, addMessage, addImages, setGenerating, reset }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJob(tool: JobTool) {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error('useJob must be used inside JobProvider');
  const job = ctx.getJob(tool);
  return {
    ...job,
    setJobId: (id: string | null) => ctx.setJobId(tool, id),
    addMessage: (msg: WsMessage) => ctx.addMessage(tool, msg),
    addImages: (imgs: { src: string; label: string }[]) => ctx.addImages(tool, imgs),
    setGenerating: (v: boolean) => ctx.setGenerating(tool, v),
    reset: () => ctx.reset(tool),
  };
}
