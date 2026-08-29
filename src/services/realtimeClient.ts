import { saveLocalPlatformMode } from '../hooks/usePlatformMode';

class RealtimeClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private isInitialized = false;

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this.connect();

    // Re-verify freshness when tab regains focus or visibility
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.verifyFreshness();
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.connect();
        }
      }
    });

    window.addEventListener('focus', () => {
      this.verifyFreshness();
    });
  }

  private connect(): void {
    if (typeof window === 'undefined') return;

    try {
      if (this.ws) {
        try {
          this.ws.close();
        } catch {
          // ignore
        }
        this.ws = null;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send initial client ping/auth
        try {
          this.ws?.send(JSON.stringify({ type: 'SUBSCRIBE_GLOBAL' }));
        } catch {
          // ignore
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch {
          // ignore
        }
      };

      this.ws.onclose = () => {
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        try {
          this.ws?.close();
        } catch {
          // ignore
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  private handleMessage(data: any): void {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'PLATFORM_MODE_UPDATED': {
        const isCrypto = Boolean(data.cryptoWalletEnabled);
        const updated = saveLocalPlatformMode({
          cryptoWalletEnabled: isCrypto,
          paymentMode: data.paymentMode || (isCrypto ? 'CRYPTO' : 'MANUAL'),
          platformCurrency: data.platformCurrency || 'INR',
          currencySymbol: data.currencySymbol || '₹',
          currencyName: data.currencyName || 'Indian Rupee',
          exchangeRateToUsdt: data.exchangeRateToUsdt || 89.5,
        });
        window.dispatchEvent(new CustomEvent('ludo_platform_mode_changed', { detail: updated }));
        break;
      }

      case 'PAYMENT_GATEWAYS_UPDATED': {
        window.dispatchEvent(new CustomEvent('ludo_gateways_updated', { detail: data }));
        break;
      }

      case 'THEME_CONFIG_UPDATED': {
        window.dispatchEvent(new CustomEvent('ludo_theme_updated', { detail: data }));
        break;
      }

      case 'WALLET_BALANCE_UPDATED': {
        window.dispatchEvent(new CustomEvent('ludo_balance_updated', { detail: data }));
        break;
      }

      case 'REFERRAL_REWARD_CREDITED':
      case 'REFERRAL_LINKED': {
        window.dispatchEvent(new CustomEvent('ludo_referral_updated', { detail: data }));
        break;
      }
    }
  }

  public async verifyFreshness(): Promise<void> {
    try {
      // 1. Refresh platform mode & currency
      const res = await fetch(`/api/platform/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          const isCrypto = Boolean(data.settings.cryptoWalletEnabled);
          const updated = saveLocalPlatformMode({
            cryptoWalletEnabled: isCrypto,
            paymentMode: data.settings.paymentMode || (isCrypto ? 'CRYPTO' : 'MANUAL'),
            platformCurrency: data.settings.platformCurrency || 'INR',
            currencySymbol: data.settings.currencySymbol || '₹',
            currencyName: data.settings.currencyName || 'Indian Rupee',
            exchangeRateToUsdt: data.settings.exchangeRateToUsdt || 89.5,
          });
          window.dispatchEvent(new CustomEvent('ludo_platform_mode_changed', { detail: updated }));
        }
      }

      // 2. Trigger gateway refresh
      window.dispatchEvent(new CustomEvent('ludo_gateways_updated'));
    } catch {
      // ignore
    }
  }
}

export const realtimeClient = new RealtimeClient();
