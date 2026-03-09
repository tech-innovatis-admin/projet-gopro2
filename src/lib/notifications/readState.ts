const STORAGE_KEY = "gopro2.notifications.readIds.v1";
const CHANGE_EVENT = "gopro2.notifications.readIds.changed";

export function loadReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return new Set<string>();
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    const normalized = parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return new Set<string>(normalized);
  } catch {
    return new Set<string>();
  }
}

export function saveReadNotificationIds(ids: Iterable<string>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalized = Array.from(new Set(ids))
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // noop
  }
}

export function subscribeReadNotificationIds(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
