"use client";

import { useEffect, useState } from "react";
import type { ProgramDTO, SiteSettings } from "@/lib/site-config";

export interface SiteConfig {
  settings: SiteSettings;
  programs: ProgramDTO[];
}

let cache: SiteConfig | null = null;
let inflight: Promise<SiteConfig> | null = null;

async function fetchConfig(): Promise<SiteConfig> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/settings", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data) => {
        cache = { settings: data.settings, programs: data.programs };
        return cache;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Ambil pengaturan + program aktif dari server (dengan cache modul sederhana). */
export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(cache);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchConfig()
      .then((c) => alive && setConfig(c))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  return { config, error, refresh: fetchConfig };
}
