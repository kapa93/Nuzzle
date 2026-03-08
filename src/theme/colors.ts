export const colors = {
  background: "#F5F6F1",
  surface: "#FFFFFF",
  surfaceMuted: "#F2EFE8",
  border: "#E7E2D8",
  textPrimary: "#1B2A22",
  textSecondary: "#5B6A61",
  textMuted: "#87928B",
  primary: "#2E8B57",
  primaryDark: "#1F6B4A",
  primarySoft: "#DDF3E6",
  chipNeutral: "#EEF2EE",
  chipText: "#24322A",
  warningSoft: "#F8E7BA",
  warningText: "#7A5A12",
  breeds: {
    aussie: { bg: "#B9EBD9", ring: "#49B88A", text: "#114D35" },
    husky: { bg: "#BFDFFF", ring: "#5AA5F5", text: "#103A63" },
    golden: { bg: "#FFD68A", ring: "#F2B645", text: "#6B4308" },
    frenchie: { bg: "#E3D4FF", ring: "#9B7FEA", text: "#442978" },
    pitbull: { bg: "#FFC2C2", ring: "#F08C8C", text: "#6E2626" },
    lab: { bg: "#CFF1C9", ring: "#72C96B", text: "#255123" }
  }
} as const;

export type BreedColorKey = keyof typeof colors.breeds;
