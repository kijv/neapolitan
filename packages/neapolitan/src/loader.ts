import type { RawPlugins } from './plugins/declaration'
import { resolvePlugin } from './config'
import { createOutputContainer, type Output } from './plugins/output'
import type { OutputOption } from '.'
import { getHookHandler } from './plugins'
import type { CombineOutputData } from './plugins/declaration'
import { neapolitanError } from './util'
import type { NullValue } from './declaration'

export interface NeapolitanLoaderOptions {
  output: OutputOption[]
}

export interface NeapolitanLoader<Outputs extends Output[]> {
  getPage: (
    slugs?: string | string[],
    language?: string
  ) => Promise<CombineOutputData<Outputs, 'transform'> | NullValue>
}

export const loader = async <const Options extends NeapolitanLoaderOptions>(
  options: Options
): Promise<NeapolitanLoader<RawPlugins<Options['output']>>> => {
  const ctx = await import('neapolitan-ctx').then((mod) => mod.default)

  let input: (typeof import('neapolitan-input'))['default'] | null = null
  const getInput = async () =>
    (input ??
      (input = await import('neapolitan-input').then(
        (mod) => mod.default
      ))) as NonNullable<typeof input>

  const output = createOutputContainer(await resolvePlugin(options.output))

  if (ctx == null) {
    neapolitanError(
      new Error(
        'context (module: neapolitan-ctx) is not initialized, are you using a Neapolitan plugin?'
      )
    )
  }

  return {
    getPage: async (
      preSlugs: string | string[] = [],
      language = ctx.i18n?.defaultLanguage
    ) => {
      const input = await getInput()

      const slugs =
        typeof preSlugs === 'string' ? preSlugs.split('/') : preSlugs
      const slug = typeof slugs === 'string' ? preSlugs : slugs.join('/')

      const key = `${typeof language === 'string' && language?.length > 0 && language !== ctx.i18n?.defaultLanguage ? `${language}.` : ''}${slug}`
      const page = input.tree.get(key)

      if (typeof page === 'function') {
        const source = await page()
        if (!source) return

        const handler = getHookHandler(output.transform)
        const result = await handler.call(null, slugs, source.code, {
          moduleType: source.moduleType,
        })

        if (result != null && typeof result === 'object' && 'data' in result)
          return result.data as CombineOutputData<
            RawPlugins<Options['output']>,
            'transform'
          >
      }

      return null
    },
  }
}

export default loader
