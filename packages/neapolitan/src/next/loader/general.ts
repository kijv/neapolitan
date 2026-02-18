import type { LoaderContext } from 'webpack';
import type { Mode } from '../../declaration';
import type { NeapolitanNextPluginOptions } from '..';
import { cachedNeapolitanConfig } from '../util';
import { createInputContainer } from '../../plugins/input';
import { createOutputContainer } from '../../plugins/output';
import { interpreter } from '@rolldown/pluginutils';
import { loadFilterToFilterExprs } from '../../lib/hook-filter';
import { normalizeHook } from '../../util';
import { transformAny } from '../../lib/plugin';

export default async function loader(
  this: LoaderContext<
    NeapolitanNextPluginOptions & {
      task: 'load' | 'transform';
      mode: Mode;
    }
  >,
  code: string,
): Promise<void> {
  const callback = this.async();
  const options = this.getOptions();

  const id = this.resource;

  if (options.task === 'load') {
    const resolvedConfig = await cachedNeapolitanConfig.resolve(
      this.getOptions().config,
    );
    const resolvedInput = createInputContainer(resolvedConfig.input);

    const loadHook = normalizeHook(resolvedInput.load);

    if (
      !loadHook.filter ||
      interpreter(loadFilterToFilterExprs(loadHook.filter)!, undefined, id)
    ) {
      const result = await loadHook.handler(id);

      if (result) {
        callback(
          null,
          typeof result === 'object' && result != null ? result.code : result,
        );
        return;
      }
    }
  } else if (options.task === 'transform') {
    if (!id) {
      callback(null, code);
      return;
    }

    const inputResult = await transformAny(id, code, async () => {
      const resolvedConfig = await cachedNeapolitanConfig.resolve(
        options.config,
      );
      return createInputContainer(resolvedConfig.input);
    });

    const inputCode =
      typeof inputResult === 'object' && inputResult != null
        ? inputResult.code
        : inputResult;

    const resolvedConfig = await cachedNeapolitanConfig.resolve(
      this.getOptions().config,
    );

    const result =
      resolvedConfig.output != null
        ? await transformAny(id, inputCode || code, async () => {
            const resolvedConfig = await cachedNeapolitanConfig.resolve(
              options.config,
            );
            return createOutputContainer(resolvedConfig.output!);
          })
        : inputResult;

    if (result) {
      callback(
        null,
        typeof result === 'object' && result != null ? result.code : result,
      );
      return;
    }
  }

  callback(null, code);
}
