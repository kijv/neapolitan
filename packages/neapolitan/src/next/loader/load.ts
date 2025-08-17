import type { LoaderContext } from 'webpack'
import { cachedNeapolitanConfig } from '../util'
import { createInputContainer } from '../../plugins/input'
import { interpreter } from '@rolldown/pluginutils'
import { normalizeHook } from '../../util'
import { loadFilterToFilterExprs } from '../../lib/hook-filter'
import type { NeapolitanNextPluginOptions } from '..'

export default async function loader(
  this: LoaderContext<NeapolitanNextPluginOptions>,
  code: string
): Promise<void> {
  const callback = this.async()

  const id = this.resource

  const resolvedOptions = await cachedNeapolitanConfig.resolve(
    this.getOptions()
  )
  const resolvedInput = await createInputContainer(resolvedOptions.input)

  const loadHook = normalizeHook(resolvedInput.load)

  if (
    !loadHook.filter ||
    interpreter(loadFilterToFilterExprs(loadHook.filter)!, undefined, id)
  ) {
    const result = await loadHook.handler(id)

    if (result) {
      return callback(
        null,
        typeof result === 'object' && result != null ? result.code : result
      )
    }
  }

  return callback(null, code)
}
