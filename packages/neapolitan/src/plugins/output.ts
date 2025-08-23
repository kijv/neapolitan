import type { PluginBase, SourceResult } from '..'
import { type PluginContainer, createPluginContainer } from './container'
import type { MaybePromise } from '../declaration'
import type { ModuleType } from 'rolldown'

export type OutputTransformHook<Data> = (
  slugs: string[],
  code: string,
  meta: {
    moduleType: ModuleType
  }
) => MaybePromise<
  SourceResult<
    Data extends {}
      ? {
          data: MaybePromise<Data>
        }
      : {}
  >
>

export interface OutputData {
  transform?: {}
}

export interface Output<TOutputData extends OutputData = {}>
  extends PluginBase<{
    transform: {
      hook: OutputTransformHook<TOutputData['transform']>
      filter: true
    }
  }> {}

export type OutputContainer = Required<PluginContainer<Output>>

export const createOutputContainer = <const TOutput extends Output>(
  output: TOutput[]
): OutputContainer => {
  return {
    ...createPluginContainer(output as Output[], {
      transform: (slugs, code, meta) => [
        code,
        slugs.join('/'),
        meta.moduleType,
      ],
    }),
  }
}
