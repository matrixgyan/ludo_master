import { useEffect, useRef } from 'react';
import { navigationHistory, BackHandler } from '../services/navigationHistory';

/**
 * Production-ready React hook for seamless mobile hardware back button support.
 * 
 * @param isOpen Whether the modal, sub-screen, or drawer is currently active/open
 * @param onBack Callback function invoked when the mobile back button or browser back is pressed
 * @param id Unique identifier for this view/modal in the navigation history stack
 * @param title Optional descriptive title
 */
export function useBackHandler(
  isOpen: boolean,
  onBack: BackHandler,
  id: string,
  title?: string
) {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!isOpen) {
      navigationHistory.dismiss(id);
      return;
    }

    // Register into navigation stack
    navigationHistory.push(id, () => {
      if (onBackRef.current) {
        return onBackRef.current();
      }
    }, title);

    return () => {
      navigationHistory.unregister(id);
    };
  }, [isOpen, id, title]);
}
