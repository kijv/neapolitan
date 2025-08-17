import type { LoaderContext } from 'webpack'
import { loadNeapolitanConfig } from '../config'
import { resolveNeapolitanConfig } from '../..'
import { createInputContainer } from '../../plugins/input'
import { transformAny } from '../../lib/plugin'

export default async function loader(
  this: LoaderContext<{}>,
  code: string
): Promise<void> {
  const callback = this.async()

  const id = this.resource

  const result = await transformAny(id, code, async () => {
    const { config } = await loadNeapolitanConfig()
    const resolvedConfig = await resolveNeapolitanConfig(config)
    return createInputContainer(resolvedConfig.input)
  })
  if (result)
    return callback(
      null,
      typeof result === 'object' && result != null ? result.code : result
    )

  return callback(null, code)
}
