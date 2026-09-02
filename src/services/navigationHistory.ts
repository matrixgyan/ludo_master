/**
 * Production-Ready Navigation History & Mobile Back-Button Management System
 * 
 * Provides seamless step-by-step back navigation for mobile devices:
 * - Hardware back button / Android gesture / Browser back arrow
 * - LIFO (Last-In-First-Out) stack for nested modals, drawers, and tabs
 * - Prevents abrupt app closing or game cuts
 * - Active match leave confirmation protection
 * - Root-level double-back exit prevention with toast feedback
 */

export type BackHandler = () => boolean | void;

export interface StackEntry {
  id: string;
  onBack: BackHandler;
  title?: string;
}

class NavigationHistoryService {
  private stack: StackEntry[] = [];
  private isInitialized = false;
  private isProgrammaticBack = false;
  private lastBackPressTime = 0;
  private toastCallback: ((msg: string) => void) | null = null;
  private confirmationCallback: ((options: {
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }) => void) | null = null;

  /**
   * Initialize browser history listeners on app startup
   */
  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Set initial baseline root state
    try {
      if (!window.history.state || !window.history.state.__appNav) {
        window.history.replaceState({ __appNav: 'root', depth: 0 }, '');
        // Push the interactive lobby state so back button is always captured
        window.history.pushState({ __appNav: 'main', depth: 1 }, '');
      }
    } catch (e) {
      console.warn('NavigationHistory init state warning:', e);
    }

    window.addEventListener('popstate', this.handlePopState);
  }

  /**
   * Set callback for user-facing exit warning toasts
   */
  public setToastCallback(cb: ((msg: string) => void) | null) {
    this.toastCallback = cb;
  }

  /**
   * Set callback for in-game exit confirmation dialogs
   */
  public setConfirmationCallback(
    cb: ((options: {
      title: string;
      message: string;
      confirmText: string;
      cancelText: string;
      onConfirm: () => void;
    }) => void) | null
  ) {
    this.confirmationCallback = cb;
  }

  /**
   * Register a new sub-view or modal onto the navigation stack
   */
  public push(id: string, onBack: BackHandler, title?: string) {
    if (typeof window === 'undefined') return;

    // Check if handler already registered with same id
    const existingIndex = this.stack.findIndex((s) => s.id === id);
    if (existingIndex !== -1) {
      this.stack[existingIndex].onBack = onBack;
      return;
    }

    // Push into internal stack
    this.stack.push({ id, onBack, title });

    // Push into browser history
    try {
      const nextDepth = this.stack.length + 1;
      window.history.pushState({ __appNav: id, depth: nextDepth }, '');
    } catch (e) {
      console.warn('NavigationHistory pushState warning:', e);
    }
  }

  /**
   * Remove a handler from the stack (e.g. when user clicks on-screen Close/X button)
   * Pops browser history so history stays in sync without triggering duplicate onBack calls.
   */
  public dismiss(id: string) {
    if (typeof window === 'undefined') return;

    const index = this.stack.findIndex((s) => s.id === id);
    if (index === -1) return;

    // Remove from stack
    this.stack.splice(index, 1);

    // Synchronize browser history by calling back programmatically
    this.isProgrammaticBack = true;
    try {
      window.history.back();
    } catch (e) {
      // fallback
    }

    // Reset flag after microtask
    setTimeout(() => {
      this.isProgrammaticBack = false;
    }, 100);
  }

  /**
   * Update existing handler without pushing new history entry
   */
  public update(id: string, onBack: BackHandler) {
    const entry = this.stack.find((s) => s.id === id);
    if (entry) {
      entry.onBack = onBack;
    }
  }

  /**
   * Remove without calling history.back() (used during unmounts if already popped)
   */
  public unregister(id: string) {
    const index = this.stack.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.stack.splice(index, 1);
    }
  }

  /**
   * Check if any modal or subview is currently registered on top
   */
  public hasActiveViews(): boolean {
    return this.stack.length > 0;
  }

  /**
   * Get top active view id
   */
  public getTopId(): string | null {
    if (this.stack.length === 0) return null;
    return this.stack[this.stack.length - 1].id;
  }

  /**
   * Handle browser / mobile device popstate event
   */
  private handlePopState = (_event: PopStateEvent) => {
    // If popstate was triggered by our programmatic dismiss, skip
    if (this.isProgrammaticBack) {
      this.isProgrammaticBack = false;
      return;
    }

    // If we have items in our stack, pop and execute the topmost handler
    if (this.stack.length > 0) {
      const topEntry = this.stack.pop();
      if (topEntry) {
        try {
          const handled = topEntry.onBack();
          if (handled === false) {
            // Handler refused dismissal, put back onto stack
            this.stack.push(topEntry);
            try {
              window.history.pushState({ __appNav: topEntry.id, depth: this.stack.length + 1 }, '');
            } catch {}
          }
        } catch (err) {
          console.error(`Error in back handler for ${topEntry.id}:`, err);
        }
      }
      return;
    }

    // Root level: Stack is empty (User is in main lobby)
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      // User pressed back twice within 2 seconds -> Allow exiting app/page
      return;
    }

    // First back press at root -> Intercept and warn politely
    this.lastBackPressTime = now;

    // Maintain the buffer state so next back can exit or stay
    try {
      window.history.pushState({ __appNav: 'main', depth: 1 }, '');
    } catch {}

    if (this.toastCallback) {
      this.toastCallback('Press back again to exit game');
    }
  };

  /**
   * Helper to prompt confirmation when leaving an active game
   */
  public requestMatchLeaveConfirmation(onConfirmLeave: () => void) {
    if (this.confirmationCallback) {
      this.confirmationCallback({
        title: 'Leave Active Match?',
        message: 'Leaving now will forfeit your current match and any entry fees. Are you sure you want to return to lobby?',
        confirmText: 'Leave Match',
        cancelText: 'Stay in Game',
        onConfirm: onConfirmLeave,
      });
    } else {
      if (window.confirm('Are you sure you want to leave the active match?')) {
        onConfirmLeave();
      }
    }
  }
}

export const navigationHistory = new NavigationHistoryService();
