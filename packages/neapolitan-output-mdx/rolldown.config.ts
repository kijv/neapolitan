import { NODE_EXTERNAL, createOutput, getInput } from '../../rolldownutils.mjs';
import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';
import { exports } from './package.json';
import { minify } from 'rollup-plugin-swc3';
import path from 'node:path';

const src = path.join(import.meta.dirname, 'src');

const input = await getInput(exports, src);

const baseConfig = defineConfig({
  input,
  output: {
    ...createOutput('dist', exports, import.meta.dirname, src),
    format: 'esm',
    advancedChunks: {
      groups: [
        {
          test: /node_modules/,
          name: 'compiled',
        },
      ],
    },
  },
  external: (id) => {
    if (
      NODE_EXTERNAL.includes(id) ||
      id.startsWith('@mdx-js/mdx') ||
      id.startsWith('react')
    ) {
      return true;
    }

    return false;
  },
});

export default defineConfig([
  {
    ...baseConfig,
    plugins: [
      dts({
        emitDtsOnly: true,
        oxc: true,
      }),
    ],
  },
  {
    ...baseConfig,
    plugins: [
      process.env.BUILD
        ? minify({
            module: true,
          })
        : null,
    ],
  },
]);
