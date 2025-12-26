/**
 * Prototype Builder
 *
 * Combines multiple screens into a single navigable HTML file using CSS :target
 * for pure HTML/CSS navigation without JavaScript.
 */

interface ScreenData {
  name: string;
  html: string;
  isRoot?: boolean;
}

interface PrototypeOptions {
  screens: ScreenData[];
  platform: 'mobile' | 'desktop';
  projectName: string;
}

/**
 * Convert screen name to a valid screen ID for use in URLs
 * "Home Screen" → "screen-home-screen"
 * "User Profile" → "screen-user-profile"
 */
export function toScreenId(name: string): string {
  return 'screen-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Build a complete prototype HTML document from screens
 */
export function buildPrototype(options: PrototypeOptions): string {
  const { screens, platform, projectName } = options;

  if (screens.length === 0) {
    return buildEmptyPrototype(projectName);
  }

  // Find the root screen (default entry point)
  const rootScreen = screens.find(s => s.isRoot) || screens[0];
  const rootScreenId = toScreenId(rootScreen.name);

  // Platform-specific viewport settings
  const viewport = platform === 'mobile'
    ? { width: 390, height: 844 }
    : { width: 1440, height: 900 };

  // Build screen sections
  const screenSections = screens.map(screen => {
    const screenId = toScreenId(screen.name);
    const isDefault = screenId === rootScreenId;
    const classes = isDefault ? 'screen screen--default' : 'screen';

    return `  <section id="${screenId}" class="${classes}">
${indentHtml(screen.html, 4)}
  </section>`;
  }).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${viewport.width}, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(projectName)} - Prototype</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Reset and base styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${viewport.width}px;
      min-height: ${viewport.height}px;
      overflow-x: hidden;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* All screens hidden by default, JS manages visibility */
    .screen {
      display: none;
      min-height: ${viewport.height}px;
      width: 100%;
    }
    .screen.active { display: block; }

    /* Ensure interactive elements work */
    a { cursor: pointer; text-decoration: none; color: inherit; }
    a:hover { opacity: 0.9; }
    button { cursor: pointer; }
    input, textarea, select {
      pointer-events: auto;
      -webkit-appearance: none;
    }

    /* Highlight clickable navigation elements */
    [data-flow] {
      cursor: pointer;
      transition: box-shadow 0.2s ease, transform 0.15s ease;
    }
    [data-flow]:hover {
      box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.5), 0 0 12px rgba(147, 51, 234, 0.3);
      transform: scale(1.01);
    }
    [data-flow]:active {
      transform: scale(0.99);
    }

    /* Always-on hotspot indicators when body.show-hotspots is set */
    body.show-hotspots [data-flow] {
      box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.4), 0 0 8px rgba(147, 51, 234, 0.2);
      position: relative;
    }
    body.show-hotspots [data-flow]::after {
      content: '';
      position: absolute;
      inset: -2px;
      border: 2px dashed rgba(147, 51, 234, 0.5);
      border-radius: inherit;
      pointer-events: none;
      animation: hotspotPulse 2s ease-in-out infinite;
    }
    @keyframes hotspotPulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    /* Scrollable content support */
    .overflow-y-auto { overflow-y: auto; }
    .overflow-y-scroll { overflow-y: scroll; }

    /* Smooth transitions between screens */
    .screen {
      animation: fadeIn 0.15s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0.8; }
      to { opacity: 1; }
    }
  </style>
</head>
<body>
${screenSections}
<script>
  // Navigation handler - keeps navigation within iframe
  (function() {
    var defaultScreenId = '${rootScreenId}';

    // Listen for messages from parent (hotspot toggle)
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'toggleHotspots') {
        if (e.data.show) {
          document.body.classList.add('show-hotspots');
        } else {
          document.body.classList.remove('show-hotspots');
        }
      }
    });

    // Enable hotspots by default
    document.body.classList.add('show-hotspots');

    function showScreen(screenId) {
      // Hide all screens
      document.querySelectorAll('.screen').forEach(function(s) {
        s.classList.remove('active');
      });
      // Show target screen
      var target = document.getElementById(screenId);
      if (target) {
        target.classList.add('active');
        // Scroll to top of screen
        window.scrollTo(0, 0);
      }
    }

    // Show default screen on load
    showScreen(defaultScreenId);

    // Intercept all clicks on hash links
    document.addEventListener('click', function(e) {
      var target = e.target;
      // Find closest anchor or element with data-flow
      while (target && target !== document.body) {
        // Check for data-flow attribute
        if (target.hasAttribute && target.hasAttribute('data-flow')) {
          e.preventDefault();
          e.stopPropagation();
          showScreen(target.getAttribute('data-flow'));
          return;
        }
        // Check for anchor with hash href
        if (target.tagName === 'A' && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
          e.preventDefault();
          e.stopPropagation();
          var screenId = target.getAttribute('href').substring(1);
          showScreen(screenId);
          return;
        }
        target = target.parentElement;
      }
    }, true);
  })();
</script>
</body>
</html>`;
}

/**
 * Build an empty prototype placeholder
 */
function buildEmptyPrototype(projectName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=390, initial-scale=1.0">
  <title>${escapeHtml(projectName)} - Prototype</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-gray-100 flex items-center justify-center">
  <div class="text-center text-gray-500">
    <p class="text-lg">No screens yet</p>
    <p class="text-sm mt-2">Generate some screens to preview your prototype</p>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * Indent HTML content for readability
 */
function indentHtml(html: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return html
    .split('\n')
    .map(line => indent + line)
    .join('\n');
}

/**
 * Extract navigation flows from HTML by finding data-flow attributes
 */
export function extractFlowsFromHtml(screenName: string, html: string): Array<{
  from_screen: string;
  to_screen: string;
}> {
  const flows: Array<{ from_screen: string; to_screen: string }> = [];

  // Match all data-flow="screen-xxx" attributes
  const regex = /data-flow="([^"]+)"/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    flows.push({
      from_screen: toScreenId(screenName),
      to_screen: match[1], // e.g., "screen-settings"
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  return flows.filter(flow => {
    const key = `${flow.from_screen}:${flow.to_screen}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
