import { useEffect, useState } from 'react';
import { fetchTools } from '../lib/api';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  health: {
    ready: boolean;
    [key: string]: unknown;
  };
}

export function useTools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTools()
      .then(setTools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { tools, loading };
}
