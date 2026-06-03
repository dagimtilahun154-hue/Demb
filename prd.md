# DEMB Product Requirements

```json
{
  "product": {
    "name": "DEMB",
    "type": "React Native Mobile App",
    "category": "Personal Balance & Digital Wellness",
    "tagline": "Protect your time, energy, and focus.",
    "coreIdea": "DEMB helps users control screen dependency, prevent burnout, and build healthier daily balance through simple insights, recovery missions, and focus protection."
  },
  "designDirection": {
    "style": "clean, calm, minimal, modern",
    "textRule": "Use very short text. No long paragraphs inside the app.",
    "tone": "supportive, friendly, slightly playful",
    "layout": "card-based mobile layout with strong spacing",
    "fontRecommendation": {
      "primary": "Inter",
      "secondary": "SF Pro / System Font",
      "style": "rounded, readable, modern"
    },
    "colors": {
      "primary": "#6C63FF",
      "secondary": "#78CA2A",
      "background": "#F8F9FC",
      "card": "#FFFFFF",
      "textPrimary": "#1F2937",
      "textSecondary": "#6B7280",
      "warning": "#F59E0B",
      "danger": "#EF4444",
      "success": "#22C55E"
    }
  },
  "mainTabs": [
    { "name": "Home", "purpose": "Show the user their current balance status quickly." },
    { "name": "Focus", "purpose": "Help users reduce distraction and enter focus mode." },
    { "name": "Missions", "purpose": "Give small recovery actions." },
    { "name": "Circle", "purpose": "Let users connect with friends or family for support." },
    { "name": "Profile", "purpose": "Show progress, streaks, and settings." }
  ],
  "screens": [
    {
      "screen": "Onboarding",
      "goal": "Explain DEMB with minimal text.",
      "texts": ["Your day has limits.", "DEMB protects your balance.", "Spend less. Recover more."],
      "cta": "Start balancing"
    },
    {
      "screen": "Home Dashboard",
      "goal": "Show balance without overwhelming the user.",
      "components": ["Balance Score Card", "Recovery Debt Card", "Screen Drain Card", "Today Mission Card"],
      "microcopy": {
        "balanceGood": "You are balanced today.",
        "balanceWarning": "Recovery needed.",
        "balanceCritical": "Slow down today.",
        "missionPrompt": "One small reset can help."
      }
    },
    {
      "screen": "Balance Score",
      "goal": "Show one simple score from 0 to 100.",
      "scoreLabels": {
        "80-100": "Balanced",
        "60-79": "Okay",
        "40-59": "Recovery Needed",
        "0-39": "Critical"
      }
    },
    {
      "screen": "Focus Mode",
      "goal": "Help user stay away from distracting apps.",
      "features": ["Start focus timer", "Block selected apps", "Show focus streak", "Gentle break reminder"],
      "texts": ["Protect your focus.", "Start with 25 minutes.", "Your attention matters."],
      "cta": "Start Focus"
    },
    {
      "screen": "Recovery Missions",
      "goal": "Give simple recovery actions.",
      "missionTypes": [
        { "name": "Walk", "text": "Walk for 10 minutes." },
        { "name": "Stretch", "text": "Stretch for 3 minutes." },
        { "name": "Breathe", "text": "Breathe slowly." },
        { "name": "No Screen", "text": "Take a short screen break." },
        { "name": "Hydrate", "text": "Drink water." }
      ],
      "cta": "Complete Mission"
    },
    {
      "screen": "Focus Shield",
      "goal": "Add healthy friction before opening draining apps.",
      "trigger": "High screen use or high recovery debt",
      "message": "Pause first.",
      "options": ["Walk 300 steps", "Breathe 1 minute", "Stretch 2 minutes", "Skip for now"],
      "unlockText": "Unlocked. Use it wisely."
    },
    {
      "screen": "Wellness Circle",
      "goal": "Simple social support without pressure.",
      "features": ["Create circle", "Invite friends", "Share streak", "Send encouragement"],
      "texts": ["Balance is easier together.", "Cheer your circle.", "Small wins count."]
    }
  ],
  "coreFeatures": [
    "Screen time monitoring",
    "Balance score",
    "Recovery debt calculation",
    "Focus mode",
    "Recovery missions",
    "Mission verification",
    "Wellness circles",
    "Rewards and streaks"
  ],
  "mvpRules": {
    "mustBeSimple": true,
    "avoidLongText": true,
    "useCards": true,
    "useIcons": true,
    "useAnimationsLightly": true,
    "mainGoal": "Make the user understand their balance in less than 5 seconds."
  },
  "sampleMicrocopy": {
    "goodMorning": "Set your balance for today.",
    "warning": "You are spending more than recovering.",
    "critical": "Your body needs a reset.",
    "success": "Nice. Balance restored.",
    "streak": "You protected your day.",
    "emptyState": "No activity yet.",
    "circleWin": "Your circle is proud of you."
  },
  "northStarMetric": "Balanced Days",
  "definitionOfBalancedDay": {
    "recovery": "User completes at least one recovery mission.",
    "focus": "User completes at least one focus session.",
    "screenUse": "User stays under personal screen limit.",
    "sleep": "User reports or tracks enough rest."
  }
}
```
