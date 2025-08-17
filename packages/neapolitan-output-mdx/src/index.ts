import { type Compiler, type CompilerOptions, createCompiler } from './compiler'
import type { Output } from 'neapolitan'

export { pluginOption } from './util'

export interface MdxOutputOptions {
  compiler?: CompilerOptions
}

export const mdx = (
  options: MdxOutputOptions = {}
): Output<{
  transform: ReturnType<Compiler['render']>
}> => {
  let compiler: Compiler | undefined

  const getCompiler = () =>
    compiler ?? (compiler = createCompiler(options.compiler))

  return {
    name: 'mdx',
    transform: {
      filter: {
        moduleType: ['md', 'mdx'],
      },
      handler: async (_, text) => {
        const compiler = getCompiler()

        const code = await compiler.compile(text)
        const module = compiler.render(code)

        return {
          code,
          data: module,
        }
      },
    },
  }
}

export default mdx
