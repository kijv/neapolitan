import type { LoaderContext } from 'webpack'
import { loadNeapolitanConfig } from '../config'
import { resolveNeapolitanConfig } from '../..'
import { createInputContainer } from '../../plugins/input'
import { interpreter } from '@rolldown/pluginutils'
import { normalizeHook } from '../../util'
import { loadFilterToFilterExprs } from '../../lib/hook-filter'

export default async function loader(
  this: LoaderContext<{}>,
  code: string
): Promise<void> {
  const callback = this.async()

  const id = this.resource

  const { config } = await loadNeapolitanConfig()
  const resolvedOptions = await resolveNeapolitanConfig(config)
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
