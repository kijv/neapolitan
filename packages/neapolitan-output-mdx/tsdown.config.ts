import { defineConfig } from 'tsdown';
import m from 'node:module';

export default defineConfig({
  platform: 'neutral',
  dts: {
    oxc: true,
  },
  external: (
    m.builtinModules.concat(m.builtinModules.map((mod) => `node:${mod}`)) as (
      | string
      | RegExp
    )[]
  ).concat([/@mdx-js\/mdx(\/.*)?/, /react(\/.*)?/]),
  entry: 'src/*.ts',
  outputOptions: {
    codeSplitting: {
      groups: [
        {
          name: 'vendor',
          test: /node_modules/,
          // @ts-expect-error
          entriesAware: true,
        },
      ],
    },
  },
});
