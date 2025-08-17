import { arraify, asyncFlatten } from './util'
import type { Input, InputOption, Output, OutputOption, PluginOption } from '.'
import type { GeneralHookFilter } from 'rolldown'
import type { Falsy, PluginBase } from './plugin'

export interface NeapolitanConfig {
  input: InputOption
  output?: OutputOption
  i18n?: {
    defaultLanguage?: string
    locales: {
      [Language: string]: {
        filter: GeneralHookFilter
        modifySlug?: (slug: string) => string
      }
    }
  }
}

export interface ResolvedNeapolitanConfig
  extends Pick<NeapolitanConfig, 'i18n'> {
  input: Input[]
  output?: Output[]
}

export function sortUserPlugins<const T extends PluginBase>(
  plugins: (T | T[])[] | undefined
): [PluginBase[], PluginBase[], PluginBase[]] {
  const prePlugins: PluginBase[] = []
  const postPlugins: PluginBase[] = []
  const normalPlugins: PluginBase[] = []

  if (plugins) {
    plugins.flat().forEach((p) => {
      if (p.enforce === 'pre') prePlugins.push(p)
      else if (p.enforce === 'post') postPlugins.push(p)
      else normalPlugins.push(p)
    })
  }

  return [prePlugins, normalPlugins, postPlugins]
}

export const resolvePlugin = async <const P extends PluginBase>(
  plugins: PluginOption<P>
): Promise<P[]> => {
  const filterPlugin = <T extends PluginBase<any>>(p: T | Falsy): p is T => {
    if (!p) {
      return false
    }

    return true
  }

  const rawPlugins = (await asyncFlatten(arraify(plugins))).filter(filterPlugin)

  const [prePlugins, normalPlugins, postPlugins] = sortUserPlugins(rawPlugins)

  return [...prePlugins, ...normalPlugins, ...postPlugins] as P[]
}

export const resolveNeapolitanConfig = async <const T extends NeapolitanConfig>(
  config: T
): Promise<ResolvedNeapolitanConfig> => {
  const input = await resolvePlugin(config.input)
  const output = config.output ? await resolvePlugin(config.output) : undefined

  const resolved = {
    ...config,
    input,
    output,
  }

  // Object.assign(resolved, createPluginHookUtils(resolved.plugins))

  return resolved
}
