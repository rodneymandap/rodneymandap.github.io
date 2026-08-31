import type { LevelUpMissionPreset } from "./types";

export const LEVELUP_QUEST_PRESETS: LevelUpMissionPreset[] = [
  {
    key: "daily-top-three",
    category: "Planning",
    input: {
      title: "Set Today’s Top Three",
      description:
        "Choose and schedule the three most important outcomes for today.",
      cadence: "daily",
      difficulty: "easy",
      stat_key: "discipline",
    },
  },
  {
    key: "daily-deep-work",
    category: "Planning",
    input: {
      title: "Complete a Deep Work Block",
      description:
        "Spend at least 60 distraction-free minutes on the day’s priority.",
      cadence: "daily",
      difficulty: "normal",
      stat_key: "discipline",
    },
  },
  {
    key: "daily-movement",
    category: "Wellbeing",
    input: {
      title: "Move for 30 Minutes",
      description:
        "Complete 30 minutes of walking, training, or intentional movement.",
      cadence: "daily",
      difficulty: "normal",
      stat_key: "strength",
    },
  },
  {
    key: "daily-learning-note",
    category: "Learning",
    input: {
      title: "Learn and Capture a Note",
      description:
        "Study for 30 minutes and save at least one useful takeaway.",
      cadence: "daily",
      difficulty: "normal",
      stat_key: "intellect",
    },
  },
  {
    key: "daily-wind-down",
    category: "Wellbeing",
    input: {
      title: "Complete the Wind-Down Routine",
      description:
        "Disconnect from work and complete the planned evening routine.",
      cadence: "daily",
      difficulty: "easy",
      stat_key: "vitality",
    },
  },
  {
    key: "weekly-freelance-pipeline",
    category: "Career",
    input: {
      title: "Grow the Freelance Pipeline",
      description:
        "Send at least three tailored proposals or outreach messages.",
      cadence: "weekly",
      difficulty: "hard",
      stat_key: "discipline",
    },
  },
  {
    key: "weekly-technical-lab",
    category: "Learning",
    input: {
      title: "Complete a Technical Lab",
      description:
        "Spend two focused hours practicing Python, Django, automation, APIs, cloud, or DevOps.",
      cadence: "weekly",
      difficulty: "hard",
      stat_key: "intellect",
    },
  },
  {
    key: "weekly-proof-of-work",
    category: "Career",
    input: {
      title: "Publish Proof of Work",
      description:
        "Publish a demo, technical post, project update, or case-study improvement.",
      cadence: "weekly",
      difficulty: "hard",
      stat_key: "intellect",
    },
  },
  {
    key: "weekly-budget-review",
    category: "Finance",
    input: {
      title: "Review the Weekly Budget",
      description:
        "Reconcile balances, review spending, and plan the coming week using any budgeting method.",
      cadence: "weekly",
      difficulty: "normal",
      stat_key: "discipline",
    },
  },
  {
    key: "weekly-reset",
    category: "Planning",
    input: {
      title: "Run the Weekly Reset",
      description:
        "Review wins and blockers, plan the calendar, and prepare the workspace.",
      cadence: "weekly",
      difficulty: "normal",
      stat_key: "discipline",
    },
  },
  {
    key: "once-freelance-service",
    category: "Career",
    input: {
      title: "Package a Freelance Service",
      description:
        "Define one clear service, ideal client, deliverables, timeline, and starting price.",
      cadence: "once",
      difficulty: "epic",
      stat_key: "discipline",
    },
  },
  {
    key: "once-flagship-case-study",
    category: "Career",
    input: {
      title: "Publish a Flagship Case Study",
      description:
        "Publish an automation, API, or Django case study covering the problem, solution, and result.",
      cadence: "once",
      difficulty: "epic",
      stat_key: "intellect",
    },
  },
];
