import { create } from "zustand";

/** Slug program visit terpilih (dari database program). Kosong = belum dipilih. */
export type TourType = string;

type TourStore = {
  tourType: TourType;
  /**
   * true = pengguna menekan tombol reservasi di kartu program tertentu,
   * jadi formulir hanya menampilkan program itu (tanpa pilihan 3 jenis tur).
   */
  locked: boolean;
  /** Dipanggil kartu program: memilih program dan mengunci formulir ke program itu. */
  setTourType: (t: TourType) => void;
  /** Pilihan awal otomatis (program pertama). Tidak mengunci. */
  setDefaultTourType: (t: TourType) => void;
  /** Kembali menampilkan semua pilihan program. */
  unlock: () => void;
};

export const useTourStore = create<TourStore>((set) => ({
  tourType: "",
  locked: false,
  setTourType: (tourType) => set({ tourType, locked: true }),
  setDefaultTourType: (tourType) => set({ tourType }),
  unlock: () => set({ locked: false }),
}));
