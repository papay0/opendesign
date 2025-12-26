/**
 * Grid Layout Utilities for Prototype Canvas
 *
 * Converts grid positions [col, row] to pixel coordinates for canvas rendering.
 * The grid layout positions screens based on AI-assigned coordinates.
 */

import { PLATFORM_CONFIG, type Platform } from "@/lib/constants/platforms";

// Grid configuration per platform
const GRID_CONFIG = {
  mobile: {
    screenWidth: PLATFORM_CONFIG.mobile.width,   // 390
    screenHeight: PLATFORM_CONFIG.mobile.height, // 844
    gapX: 120,      // Horizontal gap between columns (space for arrows)
    gapY: 80,       // Vertical gap between rows
    frameWidth: 24, // Phone frame padding
    frameBorderRadius: 48, // Phone frame rounded corners
  },
  desktop: {
    screenWidth: PLATFORM_CONFIG.desktop.width,   // 1440
    screenHeight: PLATFORM_CONFIG.desktop.height, // 900
    gapX: 150,      // Horizontal gap between columns
    gapY: 100,      // Vertical gap between rows
    frameWidth: 0,  // Browser mockup handled separately
    frameBorderRadius: 12,
  },
} as const;

export interface GridConfig {
  screenWidth: number;
  screenHeight: number;
  gapX: number;
  gapY: number;
  frameWidth: number;
  frameBorderRadius: number;
}

/**
 * Get grid configuration for a platform
 */
export function getGridConfig(platform: Platform): GridConfig {
  return GRID_CONFIG[platform];
}

/**
 * Convert grid position [col, row] to pixel coordinates [x, y]
 *
 * @param gridCol - Grid column (0-indexed)
 * @param gridRow - Grid row (0-indexed)
 * @param platform - "mobile" or "desktop"
 * @returns Pixel position { x, y }
 */
export function gridToPixels(
  gridCol: number,
  gridRow: number,
  platform: Platform
): { x: number; y: number } {
  const config = GRID_CONFIG[platform];

  // Total cell size = screen + frame padding on both sides + gap
  const cellWidth = config.screenWidth + config.frameWidth * 2 + config.gapX;
  const cellHeight = config.screenHeight + config.frameWidth * 2 + config.gapY;

  return {
    x: gridCol * cellWidth,
    y: gridRow * cellHeight,
  };
}

/**
 * Calculate canvas bounds from all screen positions
 *
 * @param screens - Array of screens with gridCol and gridRow
 * @param platform - "mobile" or "desktop"
 * @returns Bounding box { minX, minY, maxX, maxY, width, height }
 */
export function calculateCanvasBounds(
  screens: Array<{ gridCol?: number; gridRow?: number }>,
  platform: Platform
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const config = GRID_CONFIG[platform];
  const screenTotalWidth = config.screenWidth + config.frameWidth * 2;
  const screenTotalHeight = config.screenHeight + config.frameWidth * 2;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const screen of screens) {
    const { x, y } = gridToPixels(screen.gridCol ?? 0, screen.gridRow ?? 0, platform);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + screenTotalWidth);
    maxY = Math.max(maxY, y + screenTotalHeight);
  }

  // Handle empty screens array
  if (screens.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Get the center point of a screen at a given grid position
 *
 * @param gridCol - Grid column
 * @param gridRow - Grid row
 * @param platform - "mobile" or "desktop"
 * @returns Center point { x, y }
 */
export function getScreenCenter(
  gridCol: number,
  gridRow: number,
  platform: Platform
): { x: number; y: number } {
  const config = GRID_CONFIG[platform];
  const { x, y } = gridToPixels(gridCol, gridRow, platform);

  return {
    x: x + (config.screenWidth + config.frameWidth * 2) / 2,
    y: y + (config.screenHeight + config.frameWidth * 2) / 2,
  };
}

/**
 * Get screen edge points for arrow connections
 *
 * @param gridCol - Grid column
 * @param gridRow - Grid row
 * @param platform - "mobile" or "desktop"
 * @returns Edge points { left, right, top, bottom }
 */
export function getScreenEdges(
  gridCol: number,
  gridRow: number,
  platform: Platform
): {
  left: { x: number; y: number };
  right: { x: number; y: number };
  top: { x: number; y: number };
  bottom: { x: number; y: number };
} {
  const config = GRID_CONFIG[platform];
  const { x, y } = gridToPixels(gridCol, gridRow, platform);
  const screenTotalWidth = config.screenWidth + config.frameWidth * 2;
  const screenTotalHeight = config.screenHeight + config.frameWidth * 2;
  const centerY = y + screenTotalHeight / 2;
  const centerX = x + screenTotalWidth / 2;

  return {
    left: { x, y: centerY },
    right: { x: x + screenTotalWidth, y: centerY },
    top: { x: centerX, y },
    bottom: { x: centerX, y: y + screenTotalHeight },
  };
}

/**
 * Convert a screen ID to screen name
 * "screen-home-settings" → "Home Settings"
 */
export function screenIdToName(screenId: string): string {
  return screenId
    .replace(/^screen-/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a screen name to screen ID
 * "Home Settings" → "screen-home-settings"
 */
export function screenNameToId(name: string): string {
  return 'screen-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
