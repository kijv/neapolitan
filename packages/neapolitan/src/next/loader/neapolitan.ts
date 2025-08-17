import type { LoaderContext } from 'webpack'
import { loadNeapolitanConfig } from '../config'
import { dataToEsm } from '@rollup/pluginutils'
import {
  generateNeapolitanInputCode,
  loadAny,
  resolveInputSource,
} from '../../lib/plugin'
import { resolveNeapolitanConfig } from '../..'
import { createInputContainer } from '../../plugins/input'

export default async function loader(
  this: LoaderContext<{}>,
  code: string
): Promise<void> {
  const callback = this.async()

  const isCtx = this.resourceQuery === '?ctx'
  const isInput = this.resourceQuery === '?input'
  const isSlug = this.resourceQuery.startsWith('?slug')

  if (isCtx || isInput || isSlug) {
    const { config } = await loadNeapolitanConfig()

    if (isCtx) {
      const { input: _input, output: _output, ...options } = config
      return callback(
        null,
        dataToEsm(options, {
          namedExports: true,
          preferConst: true,
        })
      )
    }

    if (isInput || isSlug) {
      const resolvedConfig = await resolveNeapolitanConfig(config)

      if (isInput) {
        const code = await generateNeapolitanInputCode(
          resolvedConfig,
          () => createInputContainer(resolvedConfig.input),
          (slug, moduleType) =>
            `neapolitan/next?slug=/${encodeURIComponent(slug)}&moduleType=${encodeURIComponent(moduleType)}`
        )

        return callback(null, code)
      }

      if (isSlug) {
        const slug = this.resourceQuery
          .match(/[?&]slug=[^?&]*[\b/]*/)?.[0]!
          .replace(/^[?&]slug=/, '')!
        const moduleType = this.resourceQuery
          .match(/[?&]moduleType=[^?&]*\b/)?.[0]!
          .replace(/^[?&]moduleType=/, '')

        const code = await resolveInputSource(
          slug.slice(1).split('/'),
          moduleType,
          () => createInputContainer(resolvedConfig.input)
        )
        if (code) return callback(null, code)
      }
    }
  }

  const id = this.resource
  const result = await loadAny(id, async () => {
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
