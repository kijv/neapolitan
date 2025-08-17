import type { ModuleType, SourceMapInput } from 'rolldown'
import type { Input } from './plugins/input'
import type { NullValue } from './declaration'
import type { Output } from './plugins/output'
import type { PluginOption } from './plugin'

export interface SourceDescription {
  code: string
  map?: SourceMapInput
  moduleType?: ModuleType
}

export type SourceResult<O = {}> = NullValue | string | (SourceDescription & O)

export type { SourceMapInput, ModuleType }

export type { PluginBase, Falsy, PluginOption } from './plugin'

export type {
  SlugDescription,
  InputLoadHook,
  InputTransformHook,
  InputSlugsLoadHook,
  InputSlugsTransformHook,
  Input,
} from './plugins/input'
export type { OutputTransformHook, Output, OutputData } from './plugins/output'

export type InputOption = PluginOption<Input>
export type OutputOption = PluginOption<Output>

export {
  type NeapolitanConfig,
  resolveNeapolitanConfig,
  type ResolvedNeapolitanConfig,
} from './config'
