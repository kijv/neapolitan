import type { Root } from 'mdast'
import type { Transformer } from 'unified'
import { getMdastExport } from './util'

interface RemarkMDXExportOptions {
  /**
   * Values to export from `vfile.data`
   */
  values: string[]
}

/**
 * Export properties from `vfile.data`
 */
export function remarkMdxExport({
  values,
}: RemarkMDXExportOptions): Transformer<Root, Root> {
  return (tree, vfile) => {
    for (const name of values) {
      if (!(name in vfile.data)) return

      // @ts-expect-error MdxjsEsm is a valid mdast node
      tree.children.unshift(getMdastExport(name, vfile.data[name]))
    }
  }
}
