import type { ModuleType } from 'rolldown'
import type { PluginBase, SourceDescription } from '..'
import { createPluginContainer } from './container'
import type { MaybePromise, NullValue, Prettify } from '../declaration'

export type OutputTransformResult<O = {}> =
  | NullValue
  | string
  | (SourceDescription & O)

export type OutputTransformHook<Data> = (
  slugs: string[],
  code: string,
  meta: {
    moduleType: ModuleType
  }
) => MaybePromise<
  OutputTransformResult<
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

export const createOutputContainer = <const TOutput extends Output>(
  output: TOutput[]
): Prettify<Required<Pick<TOutput, 'transform'>>> => {
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
