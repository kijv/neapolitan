import { loadConfig } from 'c12'
import type { NeapolitanNextPluginOptions } from '.'
import { createCachedImport } from '../util'

export const loadNeapolitanConfig = createCachedImport(() =>
  loadConfig<NeapolitanNextPluginOptions>({
    cwd: process.cwd(),
    name: 'neapolitan:nextjs',
    configFile: 'neapolitan.config',
    rcFile: false,
    globalRc: false,
    configFileRequired: true,
  })
)

export const loadResolvedInput = <T>(
  imp: (config: NeapolitanNextPluginOptions) => Promise<T>
): ((config: NeapolitanNextPluginOptions) => T | Promise<T>) => {
  const inner = async () => {
    const { config } = await loadNeapolitanConfig()
    return imp(config)
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
