import type { LoaderContext } from 'webpack'
import type { Mode } from '../../declaration'
import type { NeapolitanNextPluginOptions } from '..'
import { cachedNeapolitanConfig } from '../util'
import { createInputContainer } from '../../plugins/input'
import { interpreter } from '@rolldown/pluginutils'
import { loadFilterToFilterExprs } from '../../lib/hook-filter'
import { normalizeHook } from '../../util'
import { transformAny } from '../../lib/plugin'

export default async function loader(
  this: LoaderContext<
    NeapolitanNextPluginOptions & {
      task: 'load' | 'transform'
      mode: Mode
    }
  >,
  code: string
): Promise<void> {
  const callback = this.async()
  const options = this.getOptions()

  const id = this.resource

  if (options.task === 'load') {
    const resolvedOptions = await cachedNeapolitanConfig.resolve(
      this.getOptions().config
    )
    const resolvedInput = createInputContainer(resolvedOptions.input)

    const loadHook = normalizeHook(resolvedInput.load)

    if (
      !loadHook.filter ||
      interpreter(loadFilterToFilterExprs(loadHook.filter)!, undefined, id)
    ) {
      const result = await loadHook.handler(id)

      if (result) {
        callback(
          null,
          typeof result === 'object' && result != null ? result.code : result
        )
        return
      }
    }
  } else if (options.task === 'transform') {
    if (!id) {
      callback(null, code)
      return
    }

    const result = await transformAny(id, code, async () => {
      const resolvedConfig = await cachedNeapolitanConfig.resolve(
        options.config
      )
      return createInputContainer(resolvedConfig.input)
    })
    if (result) {
      callback(
        null,
        typeof result === 'object' && result != null ? result.code : result
      )
      return
    }
  }

  callback(null, code)
}
