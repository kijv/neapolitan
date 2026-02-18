import {
  generateNeapolitanInputCode,
  loadAny,
  resolveInputSource,
} from '../../lib/plugin';
import type { LoaderContext } from 'webpack';
import type { Mode } from '../../declaration';
import type { NeapolitanNextPluginOptions } from '..';
import { cachedNeapolitanConfig } from '../util';
import { createInputContainer } from '../../plugins/input';
import { dataToEsm } from '@rollup/pluginutils';

export default async function loader(
  this: LoaderContext<
    NeapolitanNextPluginOptions & {
      mode: Mode;
    }
  >,
): Promise<void> {
  const options = this.getOptions();
  const callback = this.async();

  const isCtx = this.resourceQuery === '?ctx';
  const isInput = this.resourceQuery === '?input';
  const isSlug = this.resourceQuery.startsWith('?slug');

  if (isCtx || isInput || isSlug) {
    if (isCtx) {
      const resolvedConfig = await cachedNeapolitanConfig.resolve(
        options.config,
      );
      const { input: _input, output: _output, ...config } = resolvedConfig;

      callback(
        null,
        dataToEsm(config, {
          namedExports: true,
          preferConst: true,
        }),
      );
      return;
    }

    if (isInput || isSlug) {
      const resolvedConfig = await cachedNeapolitanConfig.resolve(
        options.config,
      );

      if (isInput) {
        if (options.mode === 'dev') {
          this.addDependency(this.resource);
        }

        const code = await generateNeapolitanInputCode.call(
          {
            watch: (id) => {
              this.addDependency(id);
            },
          },
          resolvedConfig,
          () => createInputContainer(resolvedConfig.input),
          (slug, moduleType) =>
            `neapolitan/next?slug=/${encodeURIComponent(slug)}&moduleType=${encodeURIComponent(moduleType)}`,
          options.mode,
        );

        callback(null, code);
        return;
      }

      if (isSlug) {
        const slug = this.resourceQuery
          .match(/[?&]slug=[^?&]*[\b/]*/)?.[0]!
          .replace(/^[?&]slug=/, '')!;
        const moduleType = this.resourceQuery
          .match(/[?&]moduleType=[^?&]*\b/)?.[0]!
          .replace(/^[?&]moduleType=/, '');

        const code = await resolveInputSource(
          slug.slice(1).split('/'),
          moduleType,
          () => createInputContainer(resolvedConfig.input),
        );

        if (code) {
          callback(null, code);
          return;
        }
      }
    }
  }

  const id = this.resource;
  const result = await loadAny(id, async () => {
    const resolvedConfig = await cachedNeapolitanConfig.resolve(options.config);
    return createInputContainer(resolvedConfig.input);
  });
  if (result) {
    callback(
      null,
      typeof result === 'object' && result != null ? result.code : result,
    );
    return;
  }

  callback(null, undefined);
}
