/**
 * Platform Configuration
 *
 * Defines the available platforms (Mobile, Desktop) with their
 * viewport dimensions and display metadata.
 */

export const PLATFORM_CONFIG = {
  mobile: {
    width: 390,
    height: 844,
    name: "Mobile",
    description: "iPhone-style mobile app",
  },
  desktop: {
    width: 1440,
    height: 900,
    name: "Desktop",
    description: "Desktop browser website",
  },
} as const;

export type Platform = keyof typeof PLATFORM_CONFIG;

// Helper to get config for a platform
export function getPlatformConfig(platform: Platform) {
  return PLATFORM_CONFIG[platform];
}
