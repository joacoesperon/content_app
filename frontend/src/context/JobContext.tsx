import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

interface JobState {
  jobId: string | null;
  messages: WsMessage[];
  generating: boolean;
  generatedImages: { src: string; label: string }[];
}

interface JobContextValue extends JobState {
  setJobId: (id: string | null) => void;
  addMessage: (msg: WsMessage) => void;
  addImages: (imgs: { src: string; label: string }[]) => void;
  setGenerating: (v: boolean) => void;
  reset: () => void;
}

const JobContext = createContext<JobContextValue | null>(null);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ src: string; label: string }[]>([]);

  const addMessage = useCallback((msg: WsMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addImages = useCallback((imgs: { src: string; label: string }[]) => {
    setGeneratedImages((prev) => [...prev, ...imgs]);
  }, []);

  const reset = useCallback(() => {
    setJobId(null);
    setMessages([]);
    setGenerating(false);
    setGeneratedImages([]);
  }, []);

  return (
    <JobContext.Provider value={{
      jobId, messages, generating, generatedImages,
      setJobId, addMessage, addImages, setGenerating, reset,
    }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJob() {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error('useJob must be used inside JobProvider');
  return ctx;
}
