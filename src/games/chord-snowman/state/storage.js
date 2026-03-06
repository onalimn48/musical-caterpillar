export async function loadGameState() {
  try {
    const [lvRes, ivRes, sessRes, unlockRes, ceRes, ieRes, introRes, achRes] = await Promise.all([
      window.storage.get("tLevelStats").catch(() => null),
      window.storage.get("intervalStats").catch(() => null),
      window.storage.get("sessionStats").catch(() => null),
      window.storage.get("cUnlocked").catch(() => null),
      window.storage.get("ceLevelStats").catch(() => null),
      window.storage.get("ieLevelStats").catch(() => null),
      window.storage.get("seenIntro").catch(() => null),
      window.storage.get("achievements").catch(() => null),
    ]);

    return {
      tLevelStats: lvRes?.value ? JSON.parse(lvRes.value) : null,
      intervalStats: ivRes?.value ? JSON.parse(ivRes.value) : null,
      sessionStats: sessRes?.value ? JSON.parse(sessRes.value) : null,
      cUnlocked: unlockRes?.value ? JSON.parse(unlockRes.value) : null,
      ceLevelStats: ceRes?.value ? JSON.parse(ceRes.value) : null,
      ieLevelStats: ieRes?.value ? JSON.parse(ieRes.value) : null,
      seenIntro: !!introRes?.value,
      achievements: achRes?.value ? JSON.parse(achRes.value) : null,
    };
  } catch (e) {
    return {};
  }
}

export function saveGameValue(key, value) {
  try {
    window.storage.set(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch (e) {}
}

export function clearAllProgressStorage() {
  try {
    window.storage.delete("tLevelStats");
    window.storage.delete("intervalStats");
    window.storage.delete("sessionStats");
    window.storage.delete("cUnlocked");
    window.storage.delete("ceLevelStats");
    window.storage.delete("ieLevelStats");
    window.storage.delete("seenIntro");
    window.storage.delete("achievements");
  } catch (e) {}
}
