import {
  type CombineOutputData,
  type RawPlugins,
  createOutputContainer,
  getHookHandler,
  importCtx,
  importInput,
  resolvePlugin,
} from './loaderutils'
import type { MaybeArray, NullValue } from './declaration'
import type { Output } from './plugins/output'
import type { OutputOption } from '.'
import { neapolitanError } from './util'

export interface NeapolitanLoaderOptions {
  output: MaybeArray<OutputOption>
}

export interface NeapolitanLoader<Outputs extends Output[]> {
  getPage: (
    slugs?: string | string[],
    subtree?: string
  ) => Promise<CombineOutputData<Outputs, 'transform'> | NullValue>
}

export const loader = async <const Options extends NeapolitanLoaderOptions>(
  options: Options
): Promise<NeapolitanLoader<RawPlugins<Options['output']>>> => {
  const ctx = await importCtx()

  let input: Awaited<ReturnType<typeof importInput>> | null = null
  const getInput = async () => input ?? (input = await importInput())

  const output = createOutputContainer(await resolvePlugin(options.output))

  if (ctx == null) {
    neapolitanError(
      new Error(
        'context (module: neapolitan-ctx) is not initialized, are you using a Neapolitan plugin?'
      )
    )
  }

  return {
    getPage: async (preSlugs: string | string[] = [], subtree?: string) => {
      const input = await getInput()

      const slugs =
        typeof preSlugs === 'string' ? preSlugs.split('/') : preSlugs
      const slug = typeof slugs === 'string' ? preSlugs : slugs.join('/')

      const key = `${typeof subtree === 'string' && subtree?.length > 0 ? `${subtree}.` : ''}${slug}`
      const load = input.tree.get(key)

      if (typeof load === 'function') {
        const source = await load()
        if (!source) return

        const handler = getHookHandler(output.transform)
        const result = await handler(slugs, source.code, {
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
