/**
 * Verifica que Vite loadEnv resuelve VITE_* distintos por modo.
 * Uso: node scripts/verify-env.mjs
 */
import { loadEnv } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const expected = {
  development: {
    VITE_APP_ENV: 'development',
    VITE_API_BASE_URL: 'https://localhost:7141/api',
  },
  qa: {
    VITE_APP_ENV: 'qa',
    VITE_API_BASE_URL: 'http://schoolcore.api.expofabricantes.mx/api',
  },
  production: {
    VITE_APP_ENV: 'production',
    VITE_API_BASE_URL: 'https://api.school-core.net/api',
  },
};

let failed = 0;

for (const [mode, want] of Object.entries(expected)) {
  const loaded = loadEnv(mode, root, 'VITE_');
  const envOk = loaded.VITE_APP_ENV === want.VITE_APP_ENV;
  const urlOk = loaded.VITE_API_BASE_URL?.replace(/\/$/, '') === want.VITE_API_BASE_URL.replace(/\/$/, '');
  if (!envOk || !urlOk) {
    failed += 1;
    console.error(`[FAIL] mode=${mode}`);
    console.error('  got:', {
      VITE_APP_ENV: loaded.VITE_APP_ENV,
      VITE_API_BASE_URL: loaded.VITE_API_BASE_URL,
    });
    console.error('  want:', want);
  } else {
    console.log(`[OK] mode=${mode} → ${loaded.VITE_APP_ENV} @ ${loaded.VITE_API_BASE_URL}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} mode(s) failed.`);
  process.exit(1);
}

console.log('\nAll environment modes resolve correctly.');
