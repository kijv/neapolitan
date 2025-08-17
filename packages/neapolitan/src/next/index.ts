import '../runtime.d.ts'

import type { Configuration, Resolver } from 'webpack'
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
  return <const T extends NextConfig>(nextConfig: T = {} as T) => {
    const loaderOptions = {
      configPath: options.configPath,
    } as Record<string, string>

    const loadAndTransformLoaders = [
      {
        loader: resolve('neapolitan/next/loader/load'),
        options: loaderOptions,
      },
      {
        loader: resolve('neapolitan/next/loader/transform'),
        options: loaderOptions,
      },
    ]
    const neapolitanLoader = {
      loader: resolve('neapolitan/next/loader/neapolitan'),
      options: loaderOptions,
    }

    const resolveAlias = {
      [NEAPOLITAN_CTX_ID]: `neapolitan/next?ctx`,
      [NEAPOLITAN_INPUT_ID]: `neapolitan/next?input`,
    }

    return Object.assign({}, nextConfig ?? {}, {
      webpack(config: Configuration, context) {
        config.resolve ||= {}

        config.module ||= {}
        config.module.rules ||= []

        config.module.rules.unshift({
          test: () => true,
          use: loadAndTransformLoaders,
        })

        config.module.rules.push({
          test: (value) => Object.values(resolveAlias).map(resolve).includes(value),
          use: [context.defaultLoaders.babel, neapolitanLoader],
        })

        config.plugins ||= []

        config.resolve.plugins ||= []
        config.resolve.plugins.push({
          apply(resolver: Resolver) {
            const target = resolver.ensureHook('resolve')

            resolver
              .getHook('resolve')
              .tapAsync(
                'neapolitan',
                async (request, resolveContext, callback) => {
                  if (
                    !request.request ||
                    !Object.keys(resolveAlias).includes(request.request)
                  )
                    return callback()

                  // construct the new request
                  const newRequest = {
                    ...request,
                    request: resolveAlias[request.request as keyof typeof resolveAlias],
                  }

                  // redirect the resolver
                  resolver.doResolve(
                    target,
                    newRequest,
                    null,
                    resolveContext,
                    callback
                  )
                }
              )
          },
        })

        return nextConfig.webpack?.(config, context) ?? config
      },
      turbopack: {
        resolveAlias,
        rules: {
          '*': {
            loaders: loadAndTransformLoaders,
            as: '*',
          },
          '*next.js*': {
            loaders: [neapolitanLoader],
            as: '*.js',
          },
        },
      },
    } satisfies NextConfig)
  }
}

export default createNeapolitan
