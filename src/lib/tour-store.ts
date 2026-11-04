import { create } from "zustand";

/** Slug program visit terpilih (dari database program). Kosong = belum dipilih. */
export type TourType = string;

type TourStore = {
  tourType: TourType;
  setTourType: (t: TourType) => void;
};

export const useTourStore = create<TourStore>((set) => ({
  tourType: "",
  setTourType: (tourType) => set({ tourType }),
}));
