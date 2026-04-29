import { useState, useEffect, useCallback } from 'react';

const SOUNDS = {};

export const useSound = (enabled: boolean = true) => {
  const play = useCallback((soundName: string) => {
    // All sound effects disabled as per user request
    return;
  }, []);

  return { play };
};
