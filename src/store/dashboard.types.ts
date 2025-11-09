// src/store/dashboard.types.ts
// Tipos compartidos para el Dashboard

export type BannerItem = {
  id: string;
  title: string;
  body: string;
  cta?: { label: string; href?: any };
  until?: string;
  tint?: string;
};

