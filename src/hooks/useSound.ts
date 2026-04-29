import { useState, useEffect, useCallback } from 'react';

const SOUNDS = {
  success: 'https://assets.mixkit.co/active_storage/sfx/2843/2843-preview.mp3',
};

export const useSound = (enabled: boolean = true) => {
  const play = useCallback((soundName: string) => {
    // All sound effects disabled as per user request
    return;
  }, []);

  return { play };
};
