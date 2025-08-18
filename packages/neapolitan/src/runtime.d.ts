declare module 'neapolitan-input' {
  import type { RawTreeData, TreeProxy } from 'neapolitan/tree'

  export declare const tree: TreeProxy<RawTreeData>

  export default {
    tree,
  }
}

declare module 'neapolitan-ctx' {
  import type { ResolvedNeapolitanConfig } from 'neapolitan'

  declare const ctx: Omit<ResolvedNeapolitanConfig, 'input' | 'output'>

  export default ctx
}
