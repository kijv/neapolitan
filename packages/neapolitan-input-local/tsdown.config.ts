import { defineConfig } from 'tsdown';
import m from 'node:module';

export default defineConfig({
  platform: 'neutral',
  dts: {
    oxc: true,
  },
  entry: 'src/*.ts',
  external: m.builtinModules.concat(
    m.builtinModules.map((mod) => `node:${mod}`),
  ),
  inlineOnly: false,
});
