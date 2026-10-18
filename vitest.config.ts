import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Let `?raw` stylesheet imports through so tests can read theme tokens.
    css: { include: [/\.css/] },
  },
});
