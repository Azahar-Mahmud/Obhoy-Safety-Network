import { useState } from 'react';

export function useSosSimulation(onComplete?: () => void) {
  const [stage, setStage] = useState<'idle' | 'simulating' | 'done'>('idle');

  const trigger = () => {
    setStage('simulating');
    setTimeout(() => {
      setStage('done');
      onComplete?.();
    }, 2500);
  };

  return { stage, trigger };
}