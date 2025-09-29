// src/constants/menuItems.tsx
import React from "react";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// Tipo de cada item de menú
export type MenuItem = {
  label: string;
  href: string;             // ✅ string flexible
  icon: React.ReactNode;
};

export const MENU_ITEMS = [
  { label: "My Profile",        href: "/menu/profile",        icon: <Ionicons name="person-outline" size={20} /> },
  { label: "Security Settings", href: "/menu/settings",       icon: <Feather name="shield" size={20} /> },
  { label: "Wallet Settings",   href: "/menu/wallet",         icon: <Ionicons name="wallet-outline" size={20} /> },
  { label: "Privacy",           href: "/menu/privacy",        icon: <Feather name="lock" size={20} /> },
  { label: "Help & Support",    href: "/menu/support",        icon: <MaterialCommunityIcons name="lifebuoy" size={20} /> },
  { label: "Legal",             href: "/menu/legal",          icon: <Feather name="file-text" size={20} /> },
  { label: "About",             href: "/menu/about",          icon: <Feather name="info" size={20} /> },

  { label: "Verify Account",    href: "/menu/account-verify", icon: <Feather name="user-check" size={20} /> },
  { label: "Backup & Recovery", href: "/menu/backup",         icon: <Feather name="key" size={20} /> },
  { label: "Sessions & Devices",href: "/menu/sessions",       icon: <Feather name="smartphone" size={20} /> },

  { label: "Appearance",        href: "/menu/appearance",     icon: <Feather name="moon" size={20} /> },
  { label: "Language & Region", href: "/menu/language",       icon: <Feather name="globe" size={20} /> },

  { label: "Referral",          href: "/menu/referral",       icon: <Feather name="gift" size={20} /> },
  { label: "Limits & Fees",     href: "/menu/limits",         icon: <Feather name="activity" size={20} /> },

  { label: "Address Book",      href: "/menu/address-book",   icon: <Feather name="book" size={20} /> },
  { label: "Connections",       href: "/menu/connections",    icon: <Feather name="link" size={20} /> },
  { label: "Developer Options", href: "/menu/debug",          icon: <Feather name="tool" size={20} /> },
] as const;