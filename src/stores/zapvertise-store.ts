import { create } from "zustand";

export type ZapvertiseState =
  | "idle"
  | "listing_selected"
  | "boost_configured"
  | "zap_sent"
  | "zap_confirmed"
  | "receipt_verified";

export interface Listing {
  id: string;
  title: string;
  author: string;
  currentZaps: number;
}

export interface ZapRequest {
  invoice: string;
  paymentHash: string;
}

export interface ZapReceipt {
  preimage: string;
  amount: number;
  verified: boolean;
}

interface ZapvertiseStore {
  state: ZapvertiseState;
  selectedListing: Listing | null;
  boostAmount: number;
  zapRequest: ZapRequest | null;
  zapReceipt: ZapReceipt | null;

  setState: (state: ZapvertiseState) => void;
  setSelectedListing: (listing: Listing | null) => void;
  setBoostAmount: (amount: number) => void;
  setZapRequest: (request: ZapRequest | null) => void;
  setZapReceipt: (receipt: ZapReceipt | null) => void;
  reset: () => void;
}

export const useZapvertiseStore = create<ZapvertiseStore>((set) => ({
  state: "idle",
  selectedListing: null,
  boostAmount: 500,
  zapRequest: null,
  zapReceipt: null,

  setState: (state) => set({ state }),
  setSelectedListing: (listing) => set({ selectedListing: listing }),
  setBoostAmount: (amount) => set({ boostAmount: amount }),
  setZapRequest: (request) => set({ zapRequest: request }),
  setZapReceipt: (receipt) => set({ zapReceipt: receipt }),

  reset: () =>
    set({
      state: "idle",
      selectedListing: null,
      boostAmount: 500,
      zapRequest: null,
      zapReceipt: null,
    }),
}));
