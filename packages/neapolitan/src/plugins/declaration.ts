import type { AsyncFlatten } from '../util'
import type { PluginBase, PluginOption } from '../plugin'
import type { Output, OutputData } from '..'
import type { Arraify, ElementOf, NullValue, UnionToIntersection } from '../declaration'

export type PluginBaseConfig = {
  load?: {
    hook: (...args: any) => any
    filter?: boolean | undefined
  }
  transform?: {
    hook: (...args: any) => any
    filter?: boolean | undefined
  }
}

export type RawPlugins<T extends PluginOption<PluginBase<any>>> =
  AsyncFlatten<Arraify<T>> extends infer R
    ? R extends (infer U)[]
      ? U[]
      : never
    : never

type IsEmpty<T extends readonly any[]> = T extends [] ? true : false

type ExtractOutputData<
  Outputs extends Output[],
  TStringKind extends keyof OutputData | NullValue,
> = {
  [K in keyof Outputs]: Outputs[K] extends Output<infer D extends OutputData>
    ? TStringKind extends keyof OutputData
      ? D[TStringKind]
      : D
    : never
}

type DefaultOutputData = {
  transform?: undefined
}

export type CombineOutputData<
  TOutputs extends Output[],
  TStringKind extends keyof OutputData | NullValue = NullValue,
> =
  IsEmpty<TOutputs> extends true
    ? TStringKind extends keyof DefaultOutputData
      ? DefaultOutputData[TStringKind]
      : DefaultOutputData
    : OutputDataOrDefault<
        UnionToIntersection<
          Awaited<ElementOf<ExtractOutputData<TOutputs, TStringKind>>>
        >
      >

type OutputDataOrDefault<T> = T extends
  | OutputData
  | OutputData[keyof OutputData]
  ? T
  : DefaultOutputData
