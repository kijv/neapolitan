import { defineConfig } from 'tsdown';
import m from 'node:module';

export default defineConfig({
  platform: 'neutral',
  external: m.builtinModules
    .concat(m.builtinModules.map((mod) => `node:${mod}`))
    .concat(['c12', 'neapolitan-ctx', 'neapolitan-input', 'webpack']),
  entry: [
    'src/{index,tree,loaderutils,loader,vite}.ts',
    'src/next/{index,loader/{general,neapolitan}}.ts',
    '!src/**/*.test.ts',
  ],
  dts: {
    oxc: false,
    compilerOptions: {
      isolatedDeclarations: true,
    },
  },
  inlineOnly: [
    '@rolldown/pluginutils',
    '@rollup/pluginutils',
    'rolldown',
    'remeda',
    // Sub dependent
    '@oxc-project/types',
  ],
});
