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
import { createCachedImport, neapolitanError } from './util'
import type { Output } from './plugins/output'
import type { OutputOption } from '.'
import { isTreeProxy } from './tree'

export interface NeapolitanLoaderOptions {
  output: MaybeArray<OutputOption>
}

export interface NeapolitanLoader<Outputs extends Output[]> {
  getFile: (
    slugs?: string | string[],
    subtree?: string
  ) => Promise<CombineOutputData<Outputs, 'transform'> | NullValue>
  getFiles: (
    subtree?: string
  ) => Promise<CombineOutputData<Outputs, 'transform'>[]>
  getSlugs: (subtree?: string) => Promise<string[]>
}

export const loader = <const Options extends NeapolitanLoaderOptions>(
  options: Options
): NeapolitanLoader<RawPlugins<Options['output']>> => {
  const getCtx = createCachedImport(importCtx)
  const getInput = createCachedImport(importInput)
  const getOutput = createCachedImport(async () =>
    createOutputContainer(await resolvePlugin(options.output))
  )

  const ensureCtx = async () => {
    const ctx = await getCtx()

    if (ctx == null) {
      neapolitanError(
        new Error(
          'context (module: neapolitan-ctx) is not initialized, are you using a Neapolitan plugin?'
        )
      )
    }
  }

  const getTreeNodes = async (subtree?: string) => {
    await ensureCtx()

    const input = await getInput()
    const tree = subtree
      ? input.tree.getTree(subtree) || input.tree.get(subtree)
      : input.tree

    if (!isTreeProxy(tree)) return []

    const data = tree.toJSON()

    return data.filter((item) => item.tree == null)
  }

  return {
    getFile: async (preSlugs: string | string[] = [], subtree?: string) => {
      await ensureCtx()

      const input = await getInput()

      const slugs =
        typeof preSlugs === 'string' ? preSlugs.split('/') : preSlugs
      const slug = typeof slugs === 'string' ? slugs : slugs.join('/')

      const key = `${typeof subtree === 'string' && subtree?.length > 0 ? `${subtree}.` : ''}${slug}`
      const load = input.tree.get(key)

      if (typeof load === 'function') {
        const source = await load()
        if (!source) return

        const output = await getOutput()

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
    getFiles: async (subtree?: string) => {
      const nodes = await getTreeNodes(subtree)
      const pages = []

      const loaders = nodes.map((item) => [item.key, item.value])

      if (loaders.length === 0) return []

      const output = await getOutput()

      for (const [slug, load] of loaders) {
        const source = await load()
        if (!source) continue

        const handler = getHookHandler(output.transform)
        const result = await handler(slug.split('/'), source.code, {
          moduleType: source.moduleType,
        })

        if (result != null && typeof result === 'object' && 'data' in result)
          pages.push(
            result.data as CombineOutputData<
              RawPlugins<Options['output']>,
              'transform'
            >
          )
      }

      return pages
    },
    getSlugs: async (subtree?: string) => {
      const nodes = await getTreeNodes(subtree)
      return nodes.map((item) => item.key)
    },
  }
}

export default loader
