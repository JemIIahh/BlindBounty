import { defineConfig } from 'tsup';

const entries = [
  'src/index.ts',
  'src/agent/index.ts',
  'src/worker/index.ts',
  'src/verifier/index.ts',
  'src/chain/index.ts',
  'src/storage/index.ts',
  'src/compute/index.ts',
  'src/crypto/index.ts',
  'src/api/index.ts',
  'src/signer/index.ts',
  'src/keystore/index.ts',
  'src/events/index.ts',
  'src/errors/index.ts',
  'src/network/index.ts',
  'src/testing/index.ts',
];

export default defineConfig({
  entry: entries,
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2022',
  tsconfig: './tsconfig.build.json',
  outDir: 'dist',
});
