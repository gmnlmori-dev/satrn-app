export type AppSettings = {
  inboxEnabled?: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  inboxEnabled: false,
};

export function parseAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return DEFAULT_APP_SETTINGS;
  }

  const settings = raw as Record<string, unknown>;
  return {
    inboxEnabled: settings.inboxEnabled === true,
  };
}

export function isInboxEnabled(settings: AppSettings): boolean {
  return settings.inboxEnabled === true;
}

export function mergeAppSettings(
  current: AppSettings,
  patch: Partial<AppSettings>,
): AppSettings {
  return {
    ...current,
    ...patch,
  };
}
