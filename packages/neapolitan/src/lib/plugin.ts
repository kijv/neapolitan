import { dataToEsm } from '@rollup/pluginutils'
import type {
  ModuleType,
  ResolvedNeapolitanConfig,
  SourceDescription,
} from '..'
import { getHookHandler } from '../plugins'
import type { MaybePromise } from '../declaration'
import { interpreter } from '@rolldown/pluginutils'
import {
  generalHookFilterMatcherToFilterExprs,
  loadFilterToFilterExprs,
  transformFilterToFilterExprs,
} from './hook-filter'
import { normalizeHook } from '../util'
import path from 'node:path'
import type { InputContainer } from '../plugins/input'
import { NEAPOLITAN_INPUT_ID } from '../loaderutils'

export const isSourceDescription = <D>(
  obj: unknown
): obj is SourceDescription & {
  data?: D
} => {
  if (obj == null || typeof obj !== 'object') return false

  const code = 'code' in obj && typeof obj.code === 'string'
  const map =
    'map' in obj
      ? typeof obj.map === 'string' ||
        (obj.map != null &&
          typeof obj.map === 'object' &&
          'mappings' in obj.map &&
          obj.map.mappings != null &&
          typeof obj.map.mappings === 'string')
      : true
  const moduleType =
    'moduleType' in obj
      ? obj.moduleType != null && typeof obj.moduleType === 'string'
      : true

  return code && map && moduleType
}

export const generateNeapolitanInputCode = async (
  resolvedConfig: ResolvedNeapolitanConfig,
  getInput: () => MaybePromise<InputContainer>,
  formatImport = (slug: string, moduleType: ModuleType) =>
    `${NEAPOLITAN_INPUT_ID}/${slug}?moduleType=${encodeURIComponent(moduleType)}`
): Promise<string> => {
  const input = await getInput()
  const slugs = await input.slugs.collect()

  const subtrees = Object.entries(resolvedConfig.splitting ?? {}).map(
    ([key, { filter, modifySlug }]) => ({
      key,
      filter: (id: string) =>
        interpreter(
          generalHookFilterMatcherToFilterExprs(filter, 'id')!,
          undefined,
          id
        ),
      modifySlug,
    })
  )

  return [
    'import { createTree } from "neapolitan/tree";',
    'const data = Object.freeze([',
    ...slugs.map(({ slug, moduleType }) => {
      const subtree = subtrees?.find((l) => l.filter(slug))

      return `\t{ tree: ${subtree?.key ? JSON.stringify(subtree.key) : 'undefined'}, key: ${JSON.stringify(subtree?.modifySlug ? subtree.modifySlug(slug) : slug)}, value: () => import(${JSON.stringify(formatImport(slug, moduleType))}).then(m => m.default) },`
    }),
    ']);',
    'export const tree = createTree(data);',
    'export default {\n\ttree\n};',
  ].join('\n')
}

export const resolveInputSource = async (
  slugOrSlugs: string | string[],
  moduleType: ModuleType | undefined,
  getInput: () => MaybePromise<InputContainer>
) => {
  const slugs = Array.isArray(slugOrSlugs)
    ? slugOrSlugs
    : slugOrSlugs.split('/')

  const input = await getInput()
  const load = input.slugs.load

  if (load) {
    const handler = getHookHandler(load)
    const result = await handler.call(null, slugs)

    return dataToEsm(
      typeof result === 'string'
        ? {
            code: result,
            moduleType,
          }
        : result != null && typeof result === 'object'
          ? Object.assign(
              {
                moduleType,
              },
              result
            )
          : result,
      {
        namedExports: true,
        preferConst: true,
      }
    )
  }
}

export const loadAny = async (
  id: string,
  getInput: () => MaybePromise<InputContainer>
) => {
  const input = await getInput()
  const loadHook = normalizeHook(input.load)

  if (
    !loadHook.filter ||
    interpreter(loadFilterToFilterExprs(loadHook.filter)!, undefined, id)
  ) {
    const desc = await loadHook.handler(id)

    return typeof desc === 'object' && desc != null
      ? {
          code: desc.code,
          map:
            desc.map != null && typeof desc.map === 'string' ? desc.map : null,
        }
      : desc
  }
}

export const transformAny = async (
  id: string,
  code: string,
  getInput: () => MaybePromise<InputContainer>
) => {
  const input = await getInput()
  const transformHook = normalizeHook(input.transform)

  if (
    !transformHook.filter ||
    interpreter(
      transformFilterToFilterExprs(transformHook.filter)!,
      undefined,
      id
    )
  ) {
    const result = await transformHook.handler(id, code, {
      moduleType: path.extname(id).slice(1),
    })

    return typeof result === 'object' && result != null
      ? {
          code: result.code,
          map:
            result.map != null && typeof result.map === 'string'
              ? result.map
              : null,
        }
      : result
  }
}
