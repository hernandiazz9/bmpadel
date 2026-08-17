/**
 * Every user-facing string in the app. Interface language is English.
 *
 * CONTEXT.md rule 5: no hardcoded copy in JSX, ever — if a component needs a
 * word on screen, it comes from here.
 */

export const strings = {
  app: {
    name: "BMPadel",
    shortName: "BMPadel",
    description: "Padel classes and the club wall, in one place.",
  },

  nav: {
    wall: "Wall",
    classes: "Classes",
    me: "Me",
  },

  login: {
    tagline: "Book the court. Follow the club.",
    signInWithGoogle: "Continue with Google",
    signingIn: "Opening Google…",
    failed: "Could not sign in. Try again.",
    notConfiguredTitle: "Supabase is not connected yet",
    notConfiguredBody:
      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then reload.",
  },

  onboarding: {
    title: "What's your level?",
    body: "Set it once so classes can show whether they match you. You can pick anything between 1.0 and 7.0.",
    hint: "Not sure? Pick the closest — nothing is locked to it.",
    confirm: "Save and continue",
    saving: "Saving…",
  },

  /** Descriptive label for each 0.5 step of the level scale (ADR-010). */
  levelLabels: {
    "1": "Brand new to padel",
    "1.5": "Learning the basics",
    "2": "Rallies with a coach",
    "2.5": "Steady from the back",
    "3": "Plays the glass on purpose",
    "3.5": "Controls the point",
    "4": "Confident at the net",
    "4.5": "Builds and finishes points",
    "5": "Strong club competitor",
    "5.5": "Regional tournament level",
    "6": "National tournament level",
    "6.5": "Semi-professional",
    "7": "Professional",
  } as const,

  session: {
    errorTitle: "Could not load your profile",
    errorBody:
      "The app reached Supabase but could not read your account. Check the keys in .env.local and try again.",
  },

  common: {
    loading: "Loading…",
    signOut: "Sign out",
    retry: "Try again",
    coach: "Coach",
    player: "Player",
    level: "Level",
  },

  placeholder: {
    wall: "The wall lands in slice 4.",
    classes: "The day strip lands in slice 2.",
    me: "Your bookings land in slice 5.",
  },
} as const;

export type LevelLabelKey = keyof typeof strings.levelLabels;
