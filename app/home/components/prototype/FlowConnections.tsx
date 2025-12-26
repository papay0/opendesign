"use client";

/**
 * FlowConnections Component
 *
 * Renders SVG arrows between screens on the prototype canvas.
 * Arrows connect from elements with data-flow attributes to their target screens.
 *
 * Features:
 * - Bezier curves for smooth connections
 * - Respects canvas zoom/pan transform
 * - Progressive reveal as screens complete
 * - Hover states with highlighting
 */

import { useMemo, useState, useCallback } from "react";
import type { Platform } from "@/lib/constants/platforms";
import {
  gridToPixels,
  getScreenEdges,
  getGridConfig,
  screenNameToId,
} from "@/lib/prototype/grid";
import type { ParsedScreen } from "../StreamingScreenPreview";

interface FlowConnection {
  id: string;
  fromScreen: string;
  toScreen: string;
  fromGridCol: number;
  fromGridRow: number;
  toGridCol: number;
  toGridRow: number;
}

// Position override for a dragged screen
interface PositionOverride {
  deltaX: number;
  deltaY: number;
}

type PositionOverrides = Record<string, PositionOverride>;

interface FlowConnectionsProps {
  screens: ParsedScreen[];
  platform: Platform;
  showFlows: boolean;
  transform: { x: number; y: number; scale: number };
  positionOverrides?: PositionOverrides;
}

/**
 * Extract flow connections from screens by parsing data-flow attributes
 * Deduplicates bidirectional connections (A→B and B→A become one line)
 */
function extractFlowConnections(screens: ParsedScreen[]): FlowConnection[] {
  const connections: FlowConnection[] = [];
  const screenMap = new Map<string, ParsedScreen>();
  const seenPairs = new Set<string>(); // Track A-B pairs regardless of direction

  // Build a map of screen IDs to screens
  for (const screen of screens) {
    const screenId = screenNameToId(screen.name);
    screenMap.set(screenId, screen);
  }

  // Extract data-flow attributes from each screen's HTML
  for (const screen of screens) {
    const regex = /data-flow="([^"]+)"/g;
    let match;
    const seenTargets = new Set<string>();
    const fromScreenId = screenNameToId(screen.name);

    while ((match = regex.exec(screen.html)) !== null) {
      const targetScreenId = match[1];

      // Avoid duplicate connections from same screen
      if (seenTargets.has(targetScreenId)) continue;
      seenTargets.add(targetScreenId);

      // Find the target screen
      const targetScreen = screenMap.get(targetScreenId);
      if (!targetScreen) continue;

      // Create a normalized pair key (alphabetically sorted) to detect bidirectional
      const pairKey = [fromScreenId, targetScreenId].sort().join('|');

      // Skip if we already have this connection (in either direction)
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      connections.push({
        id: `${fromScreenId}->${targetScreenId}`,
        fromScreen: screen.name,
        toScreen: targetScreen.name,
        fromGridCol: screen.gridCol ?? 0,
        fromGridRow: screen.gridRow ?? 0,
        toGridCol: targetScreen.gridCol ?? 0,
        toGridRow: targetScreen.gridRow ?? 0,
      });
    }
  }

  return connections;
}

/**
 * Calculate bezier path between two screen edges
 */
function calculateArrowPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  curveOffset: number = 60
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Control points for bezier curve
  // Curve out from the source, then curve into the target
  const cp1x = from.x + Math.min(Math.abs(dx) * 0.3, curveOffset) * Math.sign(dx);
  const cp1y = from.y;
  const cp2x = to.x - Math.min(Math.abs(dx) * 0.3, curveOffset) * Math.sign(dx);
  const cp2y = to.y;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

/**
 * Arrow marker definition for SVG
 */
function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  );
}

export function FlowConnections({
  screens,
  platform,
  showFlows,
  transform,
  positionOverrides = {},
}: FlowConnectionsProps) {
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);

  const connections = useMemo(() => extractFlowConnections(screens), [screens]);
  const config = getGridConfig(platform);

  // Helper to get screen edges with position overrides applied
  // NOTE: Not memoized - must always use latest positionOverrides for instant drag updates
  const getAdjustedScreenEdges = (screenName: string, gridCol: number, gridRow: number) => {
    const baseEdges = getScreenEdges(gridCol, gridRow, platform);
    const override = positionOverrides[screenName];

    if (!override) return baseEdges;

    // Apply the position offset to all edges
    return {
      left: { x: baseEdges.left.x + override.deltaX, y: baseEdges.left.y + override.deltaY },
      right: { x: baseEdges.right.x + override.deltaX, y: baseEdges.right.y + override.deltaY },
      top: { x: baseEdges.top.x + override.deltaX, y: baseEdges.top.y + override.deltaY },
      bottom: { x: baseEdges.bottom.x + override.deltaX, y: baseEdges.bottom.y + override.deltaY },
    };
  };

  const handleMouseEnter = useCallback((id: string) => {
    setHoveredConnection(id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredConnection(null);
  }, []);

  if (!showFlows || connections.length === 0) {
    return null;
  }

  // Calculate SVG viewBox bounds
  const padding = 100;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const screen of screens) {
    const { x, y } = gridToPixels(screen.gridCol ?? 0, screen.gridRow ?? 0, platform);
    const screenWidth = config.screenWidth + config.frameWidth * 2;
    const screenHeight = config.screenHeight + config.frameWidth * 2;
    minX = Math.min(minX, x - padding);
    minY = Math.min(minY, y - padding);
    maxX = Math.max(maxX, x + screenWidth + padding);
    maxY = Math.max(maxY, y + screenHeight + padding);
  }

  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{
        width: "100%",
        height: "100%",
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transformOrigin: "top left",
      }}
    >
      <defs>
        <ArrowMarker id="arrowhead" color="rgba(147, 51, 234, 0.6)" />
        <ArrowMarker id="arrowhead-hover" color="rgba(147, 51, 234, 1)" />
      </defs>

      {connections.map((conn) => {
        // Determine which edges to connect based on relative positions (with overrides)
        const fromEdges = getAdjustedScreenEdges(conn.fromScreen, conn.fromGridCol, conn.fromGridRow);
        const toEdges = getAdjustedScreenEdges(conn.toScreen, conn.toGridCol, conn.toGridRow);

        // Calculate effective positions for determining connection direction
        const fromCenter = {
          x: (fromEdges.left.x + fromEdges.right.x) / 2,
          y: (fromEdges.top.y + fromEdges.bottom.y) / 2,
        };
        const toCenter = {
          x: (toEdges.left.x + toEdges.right.x) / 2,
          y: (toEdges.top.y + toEdges.bottom.y) / 2,
        };

        // Decide connection points based on relative position
        let from: { x: number; y: number };
        let to: { x: number; y: number };

        // Use actual screen positions (including overrides) to determine connection direction
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;

        if (Math.abs(dx) >= Math.abs(dy)) {
          // Horizontal connection
          if (dx >= 0) {
            from = fromEdges.right;
            to = toEdges.left;
          } else {
            from = fromEdges.left;
            to = toEdges.right;
          }
        } else {
          // Vertical connection
          if (dy >= 0) {
            from = fromEdges.bottom;
            to = toEdges.top;
          } else {
            from = fromEdges.top;
            to = toEdges.bottom;
          }
        }

        const isHovered = hoveredConnection === conn.id;
        const path = calculateArrowPath(from, to);

        return (
          <g key={conn.id}>
            {/* Invisible wider path for easier hover detection */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => handleMouseEnter(conn.id)}
              onMouseLeave={handleMouseLeave}
            />
            {/* Visible arrow path */}
            <path
              d={path}
              fill="none"
              stroke={isHovered ? "rgba(147, 51, 234, 1)" : "rgba(147, 51, 234, 0.6)"}
              strokeWidth={isHovered ? 3 : 2}
              markerEnd={`url(#${isHovered ? "arrowhead-hover" : "arrowhead"})`}
              style={{
                filter: isHovered ? "drop-shadow(0 0 4px rgba(147, 51, 234, 0.5))" : "none",
              }}
            />
            {/* Connection label on hover */}
            {isHovered && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 10}
                textAnchor="middle"
                className="fill-purple-700 text-xs font-medium"
                style={{ fontSize: "12px" }}
              >
                {conn.fromScreen} → {conn.toScreen}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
