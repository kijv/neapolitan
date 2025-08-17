import type { ModuleType, SourceMapInput } from 'rolldown'
import type { Input } from './plugins/input'
import type { Output } from './plugins/output'
import type { PluginOption } from './plugin'

export interface SourceDescription {
  code: string
  map?: SourceMapInput
  moduleType?: ModuleType
}

export type { SourceMapInput, ModuleType }

export type { PluginBase, Falsy, PluginOption } from './plugin'

export type * from './plugins/input'
export type * from './plugins/output'

export type InputOption = PluginOption<Input>
export type OutputOption = PluginOption<Output>

export {
  resolveNeapolitanConfig,
  type ResolvedNeapolitanConfig,
} from './config'
