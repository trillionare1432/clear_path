import { UserProfile } from '../types';

export const GLOBAL_STORAGE_KEYS = {
  LANG: 'aarohan_lang',
  THEME_MODE: 'clearpath_theme_mode',
  USER_PROFILE: 'clearpath_user_profile',
  REGISTERED_USERS: 'clearpath_registered_users',
  SERVER_AUTH_TOKEN: 'clearpath_server_auth_token',
  SERVER_AUTH_USER: 'clearpath_server_auth_user',
} as const;

export const SCOPED_STORAGE_KEYS = {
  ROLE: 'aarohan_role',

  // ClearPath AI Core
  MOTIVATION_ANCHOR: 'clearpath_motivation_anchor',
  LEARNER_CUSTOM_PLAN: 'clearpath_learner_custom_plan',
  LEARNER_CERTIFICATE: 'clearpath_learner_certificate',

  // Role 01 keys
  ONBOARDING_P1: 'aarohan_onboarding_p1',
  ONBOARDING_P1_DRAFT: 'clearpath_onboarding_p1_draft',
  SCREENING_DRAFT: 'clearpath_screening_draft',
  MOTIVATION_SESSION: 'clearpath_motivation_session',
  TOOL_SHARE_FLAGS: 'clearpath_tool_share_flags',
  REPORT_SETTINGS: 'clearpath_report_settings',
  CLINICAL_CARE_NOTES: 'clearpath_clinical_care_notes',
  SUBSTANCE_CONCERNS: 'clearpath_substance_concerns',
  PERSONALIZED_SUPPORT_PLAN: 'clearpath_personalized_support_plan',
  LOGS_P1: 'aarohan_daily_logs',
  EVENTS_P1: 'aarohan_calendar_events',
  GOALS_P1: 'aarohan_goals',
  GAME_STATS: 'aarohan_game_stats',
  TOOL_COMPLETIONS: 'aarohan_tool_completions',
  RECOVERY_REPORTS: 'clearpath_recovery_reports',
  OPPORTUNITY_PROFILE: 'clearpath_opportunity_profile',
  SAVED_OPPORTUNITIES: 'clearpath_saved_opportunities',
  OPPORTUNITY_APPLICATIONS: 'clearpath_opportunity_applications',
  RECOVERY_PASSPORT: 'clearpath_recovery_passport',
  PERSONAL_DEV_PROGRESS: 'clearpath_personal_dev_progress',

  // Role 02 Supporter keys
  ONBOARDING_P2: 'aarohan_supporter_onboarding',
  SUPPORT_PLANS: 'aarohan_support_plans',
  SUPPORTER_EVENTS: 'aarohan_supporter_events',
  SUPPORTER_REFLECTIONS: 'aarohan_supporter_reflections',
  SAVED_CONVERSATIONS: 'aarohan_saved_conversations',
  COMPLETED_EDU_MODULES: 'aarohan_completed_edu_modules',
  SUPPORTER_PROFESSIONAL_QS: 'clearpath_supporter_professional_qs',
  SUPPORTER_SUBSTANCE_CONTEXT: 'clearpath_supporter_substance_context',

  // Role 03 Learner keys
  ONBOARDING_P3: 'aarohan_learner_onboarding',
  COMPLETED_LESSONS: 'aarohan_completed_lessons',
  BOOKMARKED_LESSONS: 'aarohan_bookmarked_lessons',
  SCENARIO_ATTEMPTS: 'aarohan_scenario_attempts',
  LEARNER_EVENTS: 'aarohan_learner_events',
  LEARNER_JOURNAL: 'aarohan_learner_journal',
  QUIZ_ATTEMPTS: 'aarohan_quiz_attempts',
  LEARNER_STUDY_DATES: 'clearpath_learner_study_dates',

  // Role 04 Community Builder keys
  ONBOARDING_P4: 'aarohan_community_onboarding',
  ORG_P4: 'aarohan_community_org',
  MEMBERS_P4: 'aarohan_community_members',
  PROGRAMMES_P4: 'aarohan_community_programmes',
  EVENTS_P4: 'aarohan_community_events',
  TASKS_P4: 'aarohan_community_tasks',
  CAMPAIGNS_P4: 'aarohan_community_campaigns',
  FEEDBACK_P4: 'aarohan_community_feedback',
  BOOKMARKED_RESOURCES_P4: 'aarohan_community_bookmarked_resources',

  // Ecosystem & Intelligence keys
  TRIGGER_ENTRIES: 'clearpath_trigger_entries',
  HABIT_CHALLENGES: 'clearpath_habit_challenges',
  EARLY_ASSESSMENTS: 'clearpath_early_assessments',
  NOTIFICATIONS: 'clearpath_notifications',
  CONSENT_PREFS: 'clearpath_consent_prefs',
  MISSIONS: 'clearpath_missions',
  EXCHANGE_ITEMS: 'clearpath_exchange_items',
  TIMELINE_EVENTS: 'clearpath_timeline_events',
  DISMISSED_INTROS: 'clearpath_dismissed_intros',
  AI_CHAT_SESSIONS: 'clearpath_ai_chat_sessions',

  // Shared & Care Relay
  SAVED_CENTERS: 'aarohan_saved_centers',
  CARE_RELAYS: 'clearpath_care_relays',
  SHARED_SUPPORTER_ITEMS: 'clearpath_shared_supporter_items',

  // 18+ Substance Research verification per account/guest
  AGE18_VERIFIED: 'clearpath_age18_verified',
} as const;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const VAULT_PREFIX = 'cp_vault';

export function getVaultScope(profile: Pick<UserProfile, 'id'> | null | undefined): string {
  if (profile && typeof profile.id === 'string' && profile.id.trim().length > 0) {
    return `user:${profile.id.trim()}`;
  }
  return 'guest';
}

export function buildScopedKey(scope: string, baseKey: string): string {
  return `${VAULT_PREFIX}::${scope}::${baseKey}`;
}

function getDefaultStorage(): StorageAdapter | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function readScopedJson<T>(
  scope: string,
  baseKey: string,
  fallback: T,
  storage: StorageAdapter | null = getDefaultStorage()
): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(buildScopedKey(scope, baseKey));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readScopedString(
  scope: string,
  baseKey: string,
  storage: StorageAdapter | null = getDefaultStorage()
): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(buildScopedKey(scope, baseKey));
  } catch {
    return null;
  }
}

export function writeScopedJson<T>(
  scope: string,
  baseKey: string,
  value: T,
  storage: StorageAdapter | null = getDefaultStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(buildScopedKey(scope, baseKey), JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

export function writeScopedString(
  scope: string,
  baseKey: string,
  value: string,
  storage: StorageAdapter | null = getDefaultStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(buildScopedKey(scope, baseKey), value);
  } catch {
    // ignore storage quota errors
  }
}

export function removeScopedKey(
  scope: string,
  baseKey: string,
  storage: StorageAdapter | null = getDefaultStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(buildScopedKey(scope, baseKey));
  } catch {
    // ignore
  }
}

/**
 * Clears ONLY the keys belonging to a specific account or guest vault,
 * leaving other registered accounts and their encrypted vaults intact.
 */
export function clearScopedVault(
  scope: string,
  storage: StorageAdapter | null = getDefaultStorage()
): void {
  if (!storage) return;
  Object.values(SCOPED_STORAGE_KEYS).forEach(baseKey => {
    try {
      storage.removeItem(buildScopedKey(scope, baseKey));
    } catch {
      // ignore
    }
  });
}

/**
 * Purges legacy unscoped workspace keys so old records from prior unscoped builds
 * never leak into signed-in accounts or guest mode.
 */
export function purgeLegacyUnscopedWorkspaceKeys(
  storage: StorageAdapter | null = getDefaultStorage()
): void {
  if (!storage) return;
  Object.values(SCOPED_STORAGE_KEYS).forEach(baseKey => {
    try {
      storage.removeItem(baseKey);
    } catch {
      // ignore
    }
  });
}
