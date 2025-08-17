import type { MaybePromise, Prettify } from '../declaration'
import type { PluginBase, SourceResult } from '..'
import type { ModuleType } from 'rolldown'
import { createPluginContainer } from './container'
import { neapolitanError } from '../util'

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
      }>,
      'load' | 'transform'
    >
  >
}

export type InputContainer = Required<
  Pick<Input, 'slugs' | 'load' | 'transform'>
>

export const createInputContainer = (inputs: Input[]): InputContainer => {
  const inputSlugs = inputs.map((input) => {
    return {
      name: input.name,
      load: input.slugs.load,
      transform: input.slugs.transform,
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
      ...createPluginContainer(inputSlugs),
    },
    ...createPluginContainer(inputs, {
      load: (id) => [undefined, id, undefined],
      transform: (id, code, meta) => [code, id, meta.moduleType],
    }),
  }
}
