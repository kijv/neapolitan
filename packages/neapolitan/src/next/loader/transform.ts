import type { LoaderContext } from 'webpack'
import { cachedNeapolitanConfig } from '../util'
import { createInputContainer } from '../../plugins/input'
import { transformAny } from '../../lib/plugin'
import type { NeapolitanNextPluginOptions } from '..'

export default async function loader(
  this: LoaderContext<NeapolitanNextPluginOptions>,
  code: string
): Promise<void> {
  const options = this.getOptions()
  const callback = this.async()

  const id = this.resource

  const result = await transformAny(id, code, async () => {
    const resolvedConfig = await cachedNeapolitanConfig.resolve(options)
    return createInputContainer(resolvedConfig.input)
  })
  if (result)
    return callback(
      null,
      typeof result === 'object' && result != null ? result.code : result
    )

  return callback(null, code)
}
