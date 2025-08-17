import {
  type FormatAwareProcessors,
  createFormatAwareProcessors,
} from '@mdx-js/mdx/internal-create-format-aware-processors'
import { createCachedImport, resolveOptions } from './util'
import type { CompileOptions } from '@mdx-js/mdx'
import type { MaybePromise } from './declaration'
import type { Pluggable } from 'unified'

export type ResolvePlugins = Pluggable[] | ((v: Pluggable[]) => Pluggable[])

const importJsxRuntime = createCachedImport(() => import('react/jsx-runtime'))
const importJsxDevRuntime = createCachedImport(
  () => import('react/jsx-dev-runtime')
)

export interface CompilerOptions
  extends Omit<CompileOptions, 'remarkPlugins' | 'rehypePlugins'> {
  dev?: boolean
  remarkPlugins?: ResolvePlugins
  rehypePlugins?: ResolvePlugins
  /**
   * Exports values from VFile.data
   */
  valuesToExport?: string[]
}

type Rendered = {
  default: React.ElementType
}

export type Compiler = ReturnType<typeof createCompiler>

export const createCompiler = (
  options: CompilerOptions = {}
): {
  compile: (code: string) => Promise<string>
  render: (
    compiled: MaybePromise<string>,
    scope?: Record<string, unknown>
  ) => Promise<Rendered>
} => {
  let mdxOptions: CompileOptions
  let formatAwareProcessors: FormatAwareProcessors

  return Object.freeze({
    async compile(code: string) {
      if (!mdxOptions) {
        mdxOptions = resolveOptions(options)
      }
      if (!formatAwareProcessors) {
        formatAwareProcessors = createFormatAwareProcessors(mdxOptions)
      }

      const file = await formatAwareProcessors.process(code)

      return Object.assign(String(file), file.data)
    },
    async render(compiled: MaybePromise<string>, scope = {}) {
      const jsxRuntime =
        process.env.NODE_ENV === 'production' && !options.dev
          ? await importJsxRuntime()
          : await importJsxDevRuntime()

      const fullScope = {
        opts: jsxRuntime,
        ...scope,
      }
      const keys = Object.keys(fullScope)
      const values = Object.values(fullScope)

      const hydrateFn = Reflect.construct(Function, keys.concat(await compiled))

      return hydrateFn.apply(hydrateFn, values) as {
        default: React.ElementType
      }
    },
  })
}
