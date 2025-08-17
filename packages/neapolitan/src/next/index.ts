import '../runtime.d.ts'

import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'
import { CTX_MODULE_ID, INPUT_MODULE_ID } from '../lib/constants.ts'
import type { NeapolitanConfig } from '../config'

export const defineConfig = (
  options: NeapolitanNextPluginOptions
): NeapolitanNextPluginOptions => options

export type NeapolitanNextPluginOptions = NeapolitanConfig

const resolve = (id: string) => fileURLToPath(import.meta.resolve(id))

export const createNeapolitan = (): ((
  nextConfig?: NextConfig
) => NextConfig) => {
  return <const T extends NextConfig>(nextConfig?: T) => {
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
                options: {},
              },
              {
                loader: resolve('neapolitan/next/loader/transform'),
                options: {},
              },
            ],
            as: '*',
          },
          '*next.js*': {
            loaders: [
              {
                loader: resolve('neapolitan/next/loader/neapolitan'),
                options: {},
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
