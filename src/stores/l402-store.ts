import { create } from "zustand";

export type L402State = "idle" | "requested" | "invoice_received" | "paid" | "verified" | "delivered";

interface L402Store {
  state: L402State;
  endpoint: string;
  price: number;
  invoice: string | null;
  preimage: string | null;
  responseData: string | null;
  totalSpent: number;
  setState: (state: L402State) => void;
  setEndpoint: (endpoint: string) => void;
  setPrice: (price: number) => void;
  setInvoice: (invoice: string | null) => void;
  setPreimage: (preimage: string | null) => void;
  setResponseData: (data: string | null) => void;
  addSpent: (amount: number) => void;
  reset: () => void;
}

export const useL402Store = create<L402Store>((set) => ({
  state: "idle",
  endpoint: "/api/mcp/products",
  price: 5,
  invoice: null,
  preimage: null,
  responseData: null,
  totalSpent: 0,
  setState: (state) => set({ state }),
  setEndpoint: (endpoint) => set({ endpoint }),
  setPrice: (price) => set({ price }),
  setInvoice: (invoice) => set({ invoice }),
  setPreimage: (preimage) => set({ preimage }),
  setResponseData: (data) => set({ responseData: data }),
  addSpent: (amount) => set((s) => ({ totalSpent: s.totalSpent + amount })),
  reset: () => set({
    state: "idle",
    endpoint: "/api/mcp/products",
    price: 5,
    invoice: null,
    preimage: null,
    responseData: null,
    totalSpent: 0,
  }),
}));
