import { useState, useRef, useCallback } from 'react';

export function useTypingTracker() {
  const [text, setText] = useState('');
  
  const startTimeRef = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const pauseCountRef = useRef<number>(0);
  const totalPauseDurationRef = useRef<number>(0);
  const backspaceCountRef = useRef<number>(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const now = Date.now();

    if (!startTimeRef.current) {
      startTimeRef.current = now;
    }

    if (lastKeyTimeRef.current) {
      const timeSinceLastKey = now - lastKeyTimeRef.current;
      // Consider a pause any gap > 1000ms
      if (timeSinceLastKey > 1000) {
        pauseCountRef.current += 1;
        totalPauseDurationRef.current += (timeSinceLastKey / 1000);
      }
    }
    
    lastKeyTimeRef.current = now;

    if (e.key === 'Backspace' || e.key === 'Delete') {
      backspaceCountRef.current += 1;
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setText(e.target.value);
  }, []);

  const reset = useCallback(() => {
    setText('');
    startTimeRef.current = null;
    lastKeyTimeRef.current = null;
    pauseCountRef.current = 0;
    totalPauseDurationRef.current = 0;
    backspaceCountRef.current = 0;
  }, []);

  const getMetrics = useCallback(() => {
    const now = Date.now();
    const elapsedSeconds = startTimeRef.current ? (now - startTimeRef.current) / 1000 : 0;
    
    const typing_speed = elapsedSeconds > 0 ? Number((text.length / elapsedSeconds).toFixed(2)) : 0;
    const pause_time = pauseCountRef.current > 0 ? Number((totalPauseDurationRef.current / pauseCountRef.current).toFixed(2)) : 0;
    
    return {
      message: text,
      typing_speed,
      pause_time,
      backspace_count: backspaceCountRef.current
    };
  }, [text]);

  return {
    text,
    setText,
    handleKeyDown,
    handleChange,
    reset,
    getMetrics
  };
}
