let iosHapticLabel: HTMLLabelElement | null = null;
let iosHapticCheckbox: HTMLInputElement | null = null;

function ensureIosHapticElements() {
  if (iosHapticCheckbox) return;

  iosHapticCheckbox = document.createElement('input');
  iosHapticCheckbox.type = 'checkbox';
  iosHapticCheckbox.setAttribute('switch', '');
  iosHapticCheckbox.id = '_haptic';
  iosHapticCheckbox.style.cssText = 'position:fixed;top:-9999px;opacity:0;pointer-events:none;';

  iosHapticLabel = document.createElement('label');
  iosHapticLabel.htmlFor = '_haptic';
  iosHapticLabel.style.cssText = 'position:fixed;top:-9999px;opacity:0;pointer-events:none;';

  document.body.appendChild(iosHapticCheckbox);
  document.body.appendChild(iosHapticLabel);
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function haptic(duration = 10) {
  if (typeof navigator === 'undefined') return;

  if ('vibrate' in navigator) {
    navigator.vibrate(duration);
    return;
  }

  // iOS fallback: trigger haptic via hidden switch checkbox
  if (isIos()) {
    ensureIosHapticElements();
    iosHapticLabel?.click();
  }
}
