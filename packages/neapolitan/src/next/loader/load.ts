import type { LoaderContext } from 'webpack'
import type { NeapolitanNextPluginOptions } from '..'
import { cachedNeapolitanConfig } from '../util'
import { createInputContainer } from '../../plugins/input'
import { interpreter } from '@rolldown/pluginutils'
import { loadFilterToFilterExprs } from '../../lib/hook-filter'
import { normalizeHook } from '../../util'

export default async function loader(
  this: LoaderContext<NeapolitanNextPluginOptions>,
  code: string
): Promise<void> {
  const callback = this.async()

  const id = this.resource

  const resolvedOptions = await cachedNeapolitanConfig.resolve(
    this.getOptions()
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
      return;
    }
  }

  callback(null, code)
}
