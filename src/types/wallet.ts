export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Wallet {
  id: string;
  name: string;
  emoji: string;
  balance: number | null;
  connectionString: string | null;
  lightningAddress: string | null;
  status: WalletStatus;
  error?: string;
}

export const WALLET_PERSONAS: Record<string, { name: string; emoji: string }> = {
  alice: { name: 'Buyer', emoji: '🛒' },
  bob: { name: 'Platform', emoji: '⚡' },
  charlie: { name: 'Seller', emoji: '🏪' },
  david: { name: 'Affiliate', emoji: '🤝' },
};

export function createWallet(id: string): Wallet {
  const persona = WALLET_PERSONAS[id] || { name: id, emoji: '👤' };
  return {
    id,
    name: persona.name,
    emoji: persona.emoji,
    balance: null,
    connectionString: null,
    lightningAddress: null,
    status: 'disconnected',
  };
}
