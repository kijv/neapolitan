import '../runtime.d.ts'

import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { CTX_MODULE_ID, INPUT_MODULE_ID } from '../lib/constants'
import type { NeapolitanConfig } from '../config'

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
          [CTX_MODULE_ID]: `neapolitan/next?ctx`,
          [INPUT_MODULE_ID]: `neapolitan/next?input`,
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
