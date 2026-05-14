export const colors = {
  background: "#F5F6F1",
  surface: "#FFFFFF",
  surfaceMuted: "#F5F5F5",
  border: "#E7E2D8",
  /** Hairlines and separators where border needs a bit more contrast */
  borderStrong: "#CAC2B4",
  textPrimary: "#1B2A22",
  textSupporting: "#303F36",
  textSecondary: "#5B6A61",
  textMuted: "#87928B",
  primary: "#389157",
  primaryDark: "#2A6B44",
  primarySoft: "#E0F2EA",
  chipNeutral: "#EEF2EE",
  chipText: "#24322A",
  /** Destructive actions (sign out, delete) */
  danger: "#DC2626",
  /** Default fill for outline danger controls (e.g. Sign out) */
  dangerSurface: "rgba(220, 38, 38, 0.08)",
  /** Filled background on press for outline danger controls */
  dangerPressedSurface: "rgba(220, 38, 38, 0.18)",
  warningSoft: "#F8E7BA",
  warningText: "#7A5A12",
  breeds: {
    aussie: { bg: "#B9EBD9", ring: "#49B88A", text: "#114D35" },
    dachshund: { bg: "#F0CFB2", ring: "#C98952", text: "#4B2B12" },
    german: { bg: "#E0D2BF", ring: "#B58A5A", text: "#4A2E16" },
    husky: { bg: "#BFDFFF", ring: "#5AA5F5", text: "#103A63" },
    goldendoodle: { bg: "#F8D9A8", ring: "#E6A14A", text: "#5C3509" },
    golden: { bg: "#FFD68A", ring: "#F2B645", text: "#6B4308" },
    mixed: { bg: "#D7D7D7", ring: "#8A8A8A", text: "#2E2E2E" },
    pug: { bg: "#E7D2BE", ring: "#B78659", text: "#4D2F1A" },
    frenchie: { bg: "#E3D4FF", ring: "#9B7FEA", text: "#442978" },
    pitbull: { bg: "#FFC2C2", ring: "#F08C8C", text: "#6E2626" },
    lab: { bg: "#CFF1C9", ring: "#72C96B", text: "#255123" },
    labradoodle: { bg: "#F2D8B6", ring: "#D79A57", text: "#5A3715" }
  }
} as const;

export type BreedColorKey = keyof typeof colors.breeds;
