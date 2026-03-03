import { lookupUsersByIds } from "@/src/lib/api/endpoints/auth";

const userNameCache = new Map<number, string>();

function normalizeUserIds(ids: Array<number | null | undefined>): number[] {
  return Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );
}

export async function resolveUserNamesById(
  ids: Array<number | null | undefined>
): Promise<Record<number, string>> {
  const normalizedIds = normalizeUserIds(ids);
  if (normalizedIds.length === 0) {
    return {};
  }

  const missingIds = normalizedIds.filter((id) => !userNameCache.has(id));
  if (missingIds.length > 0) {
    const users = await lookupUsersByIds(missingIds);
    for (const user of users) {
      const displayName = user.fullName?.trim() || user.email || `ID ${user.id}`;
      userNameCache.set(user.id, displayName);
    }
  }

  const resolved: Record<number, string> = {};
  for (const id of normalizedIds) {
    resolved[id] = userNameCache.get(id) ?? `ID ${id}`;
  }
  return resolved;
}

