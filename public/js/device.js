// Robust Browser HWID Fingerprint Generator
// Combines Canvas, WebGL, AudioContext, Screen, and Hardware parameters
async function getHardwareFingerprint() {
  const components = [];

  try {
    // 1. Screen & Hardware Concurrency
    components.push((window.screen && window.screen.width ? window.screen.width : '1920') + 'x' + 
                    (window.screen && window.screen.height ? window.screen.height : '1080') + 'x' + 
                    (window.screen && window.screen.colorDepth ? window.screen.colorDepth : '24'));
    components.push(navigator.hardwareConcurrency || '4');
    components.push(navigator.deviceMemory || '8');
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    } catch(e) {
      components.push('UTC');
    }

    // 2. Canvas 2D Fingerprint
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (ctx) {
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
      }
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
    let persistentSeed = null;
    try {
      persistentSeed = localStorage.getItem('cs2_val_device_seed');
      if (!persistentSeed) {
        persistentSeed = 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('cs2_val_device_seed', persistentSeed);
      }
    } catch (e) {
      persistentSeed = 'seed_fallback_' + (navigator.userAgent || 'ua');
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

    return 'HWID-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  } catch (err) {
    console.error('Fingerprint error:', err);
    return 'HWID-' + Math.random().toString(16).substring(2, 10).toUpperCase();
  }
}

window.getHardwareFingerprint = getHardwareFingerprint;
