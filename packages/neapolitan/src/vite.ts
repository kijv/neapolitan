/// <reference types="./runtime.d.ts" />

import './runtime.d.ts'

import type { PluginOption } from 'vite'
import { dataToEsm } from '@rollup/pluginutils'
import { resolveNeapolitanConfig, type NeapolitanConfig } from './config'
import { createInputContainer } from './plugins/input'
import {
  generateNeapolitanInputCode,
  loadAny,
  resolveInputSource,
  transformAny,
} from './lib/plugin'
import { NEAPOLITAN_CTX_ID, NEAPOLITAN_INPUT_ID } from './loaderutils.ts'

export type NeapolitanVitePluginOptions = NeapolitanConfig

const neapolitanVitePlugin = ({
  ...config
}: NeapolitanVitePluginOptions): PluginOption => {
  let resolvedConfig: Awaited<
    ReturnType<typeof resolveNeapolitanConfig>
  > | null = null
  const getResolvedConfig = async () =>
    resolvedConfig ?? (resolvedConfig = await resolveNeapolitanConfig(config))

  let resolvedInput: Awaited<ReturnType<typeof createInputContainer>> | null =
    null
  const getInput = async () =>
    resolvedInput ??
    (resolvedInput = createInputContainer((await getResolvedConfig()).input))

  const resolvedCtxId = `\0${NEAPOLITAN_CTX_ID}`
  const resolvedSrcId = `\0${NEAPOLITAN_INPUT_ID}`

  return {
    name: 'neapolitan',
    resolveId(id) {
      if (id === NEAPOLITAN_CTX_ID) return resolvedCtxId
      if (id.startsWith(NEAPOLITAN_INPUT_ID))
        return resolvedSrcId + id.slice(NEAPOLITAN_INPUT_ID.length)

      return null
    },
    load: {
      async handler(id) {
        if (id === resolvedCtxId) {
          const resolvedConfig = await getResolvedConfig()

          return dataToEsm(resolvedConfig, {
            preferConst: true,
            namedExports: true,
          })
        }

        if (id === resolvedSrcId) {
          const resolvedConfig = await getResolvedConfig()

          const code = await generateNeapolitanInputCode(
            resolvedConfig,
            getInput
          )

          return code
        }

        if (id.startsWith(resolvedSrcId)) {
          const path = id.slice(resolvedSrcId.length + 1)
          const moduleType = path
            .match(/[?&]moduleType=[^?&]*\b/)?.[0]!
            .replace(/^[?&]moduleType=/, '')
          const slug = moduleType
            ? path.replace(/[?&]moduleType=[^?&]*\b/, '')
            : path

          const code = await resolveInputSource(slug, moduleType, getInput)
          if (code) return code
        }

        const result = await loadAny(id, getInput)
        if (result) return result

        return null
      },
    },
    transform: {
      async handler(id, code) {
        const result = await transformAny(id, code, getInput)
        if (result) return result

        return null
      },
    },
  } satisfies PluginOption
}

export const neapolitan: typeof neapolitanVitePlugin = neapolitanVitePlugin

export default neapolitan
