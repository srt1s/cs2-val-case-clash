// Robust Browser HWID Fingerprint Generator
// Combines Canvas, WebGL, AudioContext, Screen, and Hardware parameters
async function getHardwareFingerprint() {
  const components = [];

  // 1. Screen & Hardware Concurrency
  components.push(window.screen.width + 'x' + window.screen.height + 'x' + window.screen.colorDepth);
  components.push(navigator.hardwareConcurrency || '4');
  components.push(navigator.deviceMemory || '8');
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

  // 2. Canvas 2D Fingerprint
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('CS2_VAL_HWID_<@>!', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('CS2_VAL_HWID_<@>!', 4, 17);
    components.push(canvas.toDataURL());
  } catch (e) {
    components.push('no_canvas');
  }

  // 3. WebGL Renderer & Vendor
  try {
    const glCanvas = document.createElement('canvas');
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch (e) {
    components.push('no_webgl');
  }

  // 4. Fallback or Local Storage persistent device seed
  let persistentSeed = localStorage.getItem('cs2_val_device_seed');
  if (!persistentSeed) {
    persistentSeed = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('cs2_val_device_seed', persistentSeed);
  }
  components.push(persistentSeed);

  // Simple string hash function
  const rawString = components.join('###');
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  const finalHwid = 'HWID-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return finalHwid;
}

window.getHardwareFingerprint = getHardwareFingerprint;
