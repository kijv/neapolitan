import '../runtime.d.ts'

import { NEAPOLITAN_CTX_ID, NEAPOLITAN_INPUT_ID } from '../loaderutils.ts'
import type { NeapolitanConfig } from '../config'
import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'

export const defineConfig = (options: NeapolitanConfig): NeapolitanConfig =>
  options

const resolve = (id: string) => fileURLToPath(import.meta.resolve(id))

export interface NeapolitanNextPluginOptions {
  configPath?: string
}

export const createNeapolitan = (
  options: NeapolitanNextPluginOptions = {}
): ((nextConfig?: NextConfig) => NextConfig) => {
  return <const T extends NextConfig>(nextConfig?: T) => {
    const loaderOptions = {
      configPath: options.configPath,
    } as Record<string, string>

    return Object.assign({}, nextConfig ?? {}, {
      turbopack: {
        resolveAlias: {
          [NEAPOLITAN_CTX_ID]: `neapolitan/next?ctx`,
          [NEAPOLITAN_INPUT_ID]: `neapolitan/next?input`,
        },
        rules: {
          '*': {
            loaders: [
              {
                loader: resolve('neapolitan/next/loader/load'),
                options: loaderOptions,
              },
              {
                loader: resolve('neapolitan/next/loader/transform'),
                options: loaderOptions,
              },
            ],
            as: '*',
          },
          '*next.js*': {
            loaders: [
              {
                loader: resolve('neapolitan/next/loader/neapolitan'),
                options: loaderOptions,
              },
            ],
            as: '*.js',
          },
        },
      },
    } satisfies NextConfig)
  }
}

export default createNeapolitan
