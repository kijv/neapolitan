declare module 'neapolitan-input' {
  import type { TreeProxy } from 'neapolitan/tree'

  export declare const tree: TreeProxy

  export default {
    tree,
  }
}

declare module 'neapolitan-ctx' {
  import type { ResolvedNeapolitanPluginOptions } from 'neapolitan'

  declare const ctx: Omit<ResolvedNeapolitanPluginOptions, 'source'>

  export default ctx
}
