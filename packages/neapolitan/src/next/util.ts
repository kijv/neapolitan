import {
  type NeapolitanConfig,
  type ResolvedNeapolitanConfig,
  resolveNeapolitanConfig,
} from '..'
import type { MaybePromise } from '../declaration'
import type { NeapolitanNextPluginOptions } from '.'
import { createCachedImport } from '../util'
import { loadConfig } from 'c12'

export const loadNeapolitanConfig = createCachedImport(() => {
  return loadConfig<NeapolitanConfig>({
    cwd: process.cwd(),
    name: 'neapolitan',
    configFile: 'neapolitan.config',
  })
})

export const loadNeapolitanConfigPath = (() => {
  const cached: Record<string, NeapolitanConfig | Promise<NeapolitanConfig>> =
    {}
  let lastConfigPath: string | undefined = undefined

  const imp = async (configPath: string | undefined) =>
    (
      await loadConfig<NeapolitanConfig>({
        cwd: process.cwd(),
        name: 'neapolitan',
        configFile: configPath ?? 'neapolitan.config',
      })
    ).config

  return (configPath?: string) => {
    if (configPath != null && configPath !== lastConfigPath) {
      lastConfigPath = undefined
    }
    if (lastConfigPath == null && configPath != null) {
      lastConfigPath = configPath
      cached[configPath] = imp(configPath).then((module) => {
        cached[configPath] = module
        return cached[configPath]
      })
    }
    return cached[configPath ?? lastConfigPath!]
  }
})()

export const cachedNeapolitanConfig = (() => {
  let configPath: string | undefined = undefined
  let config: MaybePromise<NeapolitanConfig> | null = null
  let resolved: MaybePromise<ResolvedNeapolitanConfig> | null = null

  const c12imp = async (configPath: string | undefined) =>
    loadConfig<NeapolitanConfig>({
      cwd: process.cwd(),
      name: 'neapolitan',
      configFile: configPath ?? 'neapolitan.config',
    })

  const load = async (options?: NeapolitanNextPluginOptions) => {
    if (options?.configPath != null && options.configPath !== configPath) {
      configPath = undefined
      config = null
      resolved = null
    }
    if (!config) {
      config = c12imp(options?.configPath).then((module) => {
        config = module.config
        return module.config
      })
    }
    return config!
  }

  return {
    load,
    resolve: async (options?: NeapolitanNextPluginOptions) => {
      if (configPath == null || config == null || (options?.configPath != null && options.configPath !== configPath)) {
        load(options)
      }
      if (!resolved && config != null) {
        resolved = resolveNeapolitanConfig(await config)
      }
      return resolved!
    },
    clear: () => {
      configPath = undefined
      config = null
      resolved = null
    },
  }
})()

export const loadResolvedConfig = createCachedImport(async () => {
  const { config } = await loadNeapolitanConfig()
  return resolveNeapolitanConfig(config)
})

export const mapCachedResolvedConfig = <T>(
  imp: (config: ResolvedNeapolitanConfig) => Promise<T>
): (() => T | Promise<T>) => {
  const inner = async () => {
    const resolvedConfig = await loadResolvedConfig()
    return imp(resolvedConfig)
  }
  let cached: T | Promise<T>
  return () => {
    if (!cached) {
      cached = inner().then((module) => {
        cached = module
        return module
      })
    }
    return cached
  }
}
