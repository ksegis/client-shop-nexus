
/**
 * Audio playback utility to prevent AbortErrors when play() is interrupted.
 * This safely manages audio element playback with proper cleanup and error handling.
 */

// Store active audio elements to prevent conflicts
const activeAudioElements: Set<HTMLAudioElement> = new Set();

/**
 * Safely play an audio element with proper error handling
 */
export const safePlayAudio = async (audioElement: HTMLAudioElement): Promise<boolean> => {
  try {
    // Clean up any existing audio elements to prevent conflicts
    cleanupActiveAudio();
    
    // Add to tracking set
    activeAudioElements.add(audioElement);
    
    // Use await to properly catch any play() errors
    await audioElement.play();
    return true;
  } catch (error) {
    console.error('Audio playback error:', error);
    
    // Remove from active set if play failed
    activeAudioElements.delete(audioElement);
    return false;
  }
};

/**
 * Safely stop all active audio elements
 */
export const cleanupActiveAudio = () => {
  activeAudioElements.forEach(audio => {
    try {
      audio.pause();
      audio.currentTime = 0;
      activeAudioElements.delete(audio);
    } catch (e) {
      console.error('Error cleaning up audio:', e);
    }
  });
};

/**
 * Clean up audio when navigating between pages
 */
export const setupAudioCleanupOnNavigation = () => {
  window.addEventListener('beforeunload', cleanupActiveAudio);
  
  // Clean up event listener when component unmounts
  return () => {
    window.removeEventListener('beforeunload', cleanupActiveAudio);
    cleanupActiveAudio();
  };
};
