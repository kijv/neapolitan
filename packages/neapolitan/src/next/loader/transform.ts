import type { LoaderContext } from 'webpack'
import type { NeapolitanNextPluginOptions } from '..'
import { cachedNeapolitanConfig } from '../util'
import { createInputContainer } from '../../plugins/input'
import { transformAny } from '../../lib/plugin'

export default async function loader(
  this: LoaderContext<NeapolitanNextPluginOptions>,
  code: string
): Promise<void> {
  const options = this.getOptions()
  const callback = this.async()

  const id = this.resource

  if (!id) {
    callback(null, code)
    return
  }

  const result = await transformAny(id, code, async () => {
    const resolvedConfig = await cachedNeapolitanConfig.resolve(options)
    return createInputContainer(resolvedConfig.input)
  })
  if (result) {
    callback(
      null,
      typeof result === 'object' && result != null ? result.code : result
    )
    return
  }

  callback(null, code)
}
