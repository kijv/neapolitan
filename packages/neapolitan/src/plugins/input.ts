import type { MaybePromise, NullValue, Prettify } from '../declaration'
import type { PluginBase, SourceResult } from '..'
import { type PluginContainer, createPluginContainer } from './container'
import type { ModuleType } from 'rolldown'
import { neapolitanError } from '../util'

interface PartialResolvedId {
  external?: boolean | 'absolute' | 'relative'
  id: string
}

export type ResolveIdResult = string | NullValue | false | PartialResolvedId

export interface SlugDescription {
  id: string
  slug: string
  moduleType: ModuleType
}

export type InputLoadHook = (id: string) => MaybePromise<SourceResult>

export type InputTransformHook = (
  id: string,
  code: string,
  meta: {
    moduleType: ModuleType
  }
) => MaybePromise<SourceResult>

export type InputSlugsLoadHook = (slugs: string[]) => MaybePromise<SourceResult>

export type InputSlugsTransformHook = (
  slugs: string[],
  code: string,
  meta: {
    moduleType: ModuleType
  }
) => MaybePromise<SourceResult>

export type InputSlugsResolveIdHook = (id: string) => ResolveIdResult

export interface Input
  extends PluginBase<{
    load: {
      hook: InputLoadHook
      filter: true
    }
    transform: {
      hook: InputTransformHook
      filter: true
    }
  }> {
  slugs: Prettify<
    {
      collect: () => MaybePromise<Array<SlugDescription>>
    } & Pick<
      PluginBase<{
        load: {
          hook: InputSlugsLoadHook
        }
        transform: {
          hook: InputSlugsTransformHook
        }
        resolveId: {
          hook: InputSlugsResolveIdHook
          filter: true
        }
      }>,
      'load' | 'transform' | 'resolveId'
    >
  >
}

export type InputContainer = Required<
  PluginContainer<Input> & {
    slugs: Prettify<
      PluginContainer<
        Input['slugs'] & {
          name: string
        }
      > &
        Pick<Input['slugs'], 'collect'>
    >
  }
>

export const createInputContainer = (inputs: Input[]): InputContainer => {
  const inputSlugs = inputs.map((input) => {
    return {
      name: input.name,
      load: input.slugs.load,
      transform: input.slugs.transform,
      resolveId: input.slugs.resolveId,
    }
  })

  return {
    slugs: {
      collect: async () => {
        const slugs = new Set<SlugDescription>()

        for (const input of inputs) {
          try {
            for (const slug of await input.slugs.collect()) {
              slugs.add(slug)
            }
          } catch (e) {
            neapolitanError(e, ` [input: ${input.name}]`)
          }
        }

        return Array.from(slugs)
      },
      ...createPluginContainer(inputSlugs, {
        resolveId: (id) => [undefined, id, undefined],
      }),
    },
    ...createPluginContainer(inputs, {
      load: (id) => [undefined, id, undefined],
      transform: (id, code, meta) => [code, id, meta.moduleType],
    }),
  }
}
