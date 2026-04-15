import { create } from "zustand";

export type FrostrState =
  | "idle"
  | "keyset_created"
  | "shares_distributed"
  | "signing"
  | "signed"
  | "share_revoked"
  | "recovered";

export interface Keyset {
  threshold: number;
  total: number;
  groupId: string;
}

export interface Share {
  id: string;
  holder: string;
  status: "active" | "revoked";
}

export interface SignRequest {
  message: string;
  partialSigs: number;
  required: number;
}

interface FrostrStore {
  state: FrostrState;
  keyset: Keyset | null;
  shares: Share[];
  signRequest: SignRequest | null;

  setState: (state: FrostrState) => void;
  setKeyset: (keyset: Keyset | null) => void;
  setShares: (shares: Share[]) => void;
  updateShare: (id: string, status: "active" | "revoked") => void;
  setSignRequest: (request: SignRequest | null) => void;
  incrementPartialSigs: () => void;
  reset: () => void;
}

export const useFrostrStore = create<FrostrStore>((set) => ({
  state: "idle",
  keyset: null,
  shares: [],
  signRequest: null,

  setState: (state) => set({ state }),
  setKeyset: (keyset) => set({ keyset }),
  setShares: (shares) => set({ shares }),
  updateShare: (id, status) =>
    set((s) => ({
      shares: s.shares.map((sh) => (sh.id === id ? { ...sh, status } : sh)),
    })),
  setSignRequest: (request) => set({ signRequest: request }),
  incrementPartialSigs: () =>
    set((s) => ({
      signRequest: s.signRequest
        ? { ...s.signRequest, partialSigs: s.signRequest.partialSigs + 1 }
        : null,
    })),
  reset: () =>
    set({
      state: "idle",
      keyset: null,
      shares: [],
      signRequest: null,
    }),
}));
