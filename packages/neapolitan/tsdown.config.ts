import { defineConfig } from 'tsdown';
import m from 'node:module';

export default defineConfig({
  platform: 'neutral',
  dts: {
    oxc: true,
  },
  external: m.builtinModules
    .concat(m.builtinModules.map((mod) => `node:${mod}`))
    .concat(['c12', 'neapolitan-ctx', 'neapolitan-input']),
  entry: [
    'src/{index,tree,loaderutils,loader,vite}.ts',
    'src/next/{index,loader/{general,neapolitan}}.ts',
    '!src/*.test.ts',
  ],
});
