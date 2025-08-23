import type { HookFilterExtension, ObjectHook } from 'rolldown'
import type { MaybePromise, Prettify } from './declaration'
import type { PluginBaseConfig } from './plugins/declaration'

export type PluginWithRequiredHook<
  PB extends PluginBase,
  K extends keyof PluginBase,
> = PB & {
  [P in K]: NonNullable<PB[P]>
}

export type { MaybePromise }

export type Falsy = false | null | undefined

export type PluginBase<
  Config extends PluginBaseConfig = {
    load: {
      hook: (...args: any) => any
      filter: true | undefined
    }
    transform: {
      hook: (...args: any) => any
      filter: true | undefined
    }
    resolveId: {
      hook: (...args: any) => any
      filter: true | undefined
    }
  },
> = Prettify<
  Omit<
    {
      name: string
      enforce?: 'pre' | 'post'
      load?: Config['load'] extends {
        hook: infer H extends (...args: any) => any
      }
        ? ObjectHook<
            H,
            Config['load']['filter'] extends true
              ? HookFilterExtension<'load'>
              : {}
          >
        : never
      transform?: Config['transform'] extends {
        hook: infer H extends (...args: any) => any
      }
        ? ObjectHook<
            H,
            Config['transform']['filter'] extends true
              ? HookFilterExtension<'transform'>
              : {}
          >
        : never
      resolveId?: Config['resolveId'] extends {
        hook: infer H extends (...args: any) => any
      }
        ? ObjectHook<
            H,
            Config['resolveId']['filter'] extends true
              ? HookFilterExtension<'resolveId'>
              : {}
          >
        : never
    },
    | (Config['load'] extends {
        hook: (...args: any) => any
      }
        ? never
        : 'load')
    | (Config['transform'] extends {
        hook: (...args: any) => any
      }
        ? never
        : 'transform')
    | (Config['resolveId'] extends {
        hook: (...args: any) => any
      }
        ? never
        : 'resolveId')
  >
>

export type PluginOption<T extends PluginBase<any>> = MaybePromise<
  T | Falsy | PluginOption<T>[]
>
