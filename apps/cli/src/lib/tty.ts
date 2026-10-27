/**
 * Ink's own isRawModeSupported check is just `stdin.isTTY`, which isn't
 * reliable everywhere -- some non-interactive/sandboxed shells report
 * isTTY: true but still throw from setRawMode itself, crashing Ink after
 * it's already mid-render. Testing actual capability directly, before ever
 * handing control to Ink, avoids that crash entirely. Shared by every
 * command that offers a `--tui` fallback (`debug --live`, `fix`).
 */
export function canUseRawMode(): boolean {
  if (!process.stdin.isTTY) return false;
  try {
    process.stdin.setRawMode(true);
    process.stdin.setRawMode(false);
    return true;
  } catch {
    return false;
  }
}
