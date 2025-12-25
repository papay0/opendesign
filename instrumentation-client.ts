import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
  // Session replay - explicitly enabled
  disable_session_recording: false,
  session_recording: {
    maskAllInputs: false,
    maskInputOptions: {
      password: true,
    },
    // Mask elements with data-ph-mask attribute (e.g., API keys)
    maskTextSelector: '[data-ph-mask]',
  },
})
