import { create } from "zustand";
import type { Store, VendorAdmin } from "~/lib/api.server";

type VendorState = {
  vendorAdmin: VendorAdmin | null;
  setVendorAdmin: (vendorAdmin: VendorAdmin | null) => void;
  setStore: (store: Store) => void;
};

export const useVendorStore = create<VendorState>((set) => ({
  vendorAdmin: null,
  setVendorAdmin: (vendorAdmin) => set({ vendorAdmin }),
  setStore: (store) =>
    set((state) =>
      state.vendorAdmin
        ? { vendorAdmin: { ...state.vendorAdmin, vendor: store } }
        : state,
    ),
}));
