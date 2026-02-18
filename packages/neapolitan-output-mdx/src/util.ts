import type { CompilerOptions, ResolvePlugins } from './compiler';
import type { CompileOptions } from '@mdx-js/mdx';
import type { Pluggable } from 'unified';
import { remarkMdxExport } from './plugins/remark-export';

export const resolveOptions = ({
  valuesToExport = [],
  ...options
}: CompilerOptions): CompileOptions => {
  return {
    development: options.dev ?? process.env.NODE_ENV === 'development',
    outputFormat: 'function-body',
    ...options,
    remarkPlugins: pluginOption(
      (v) => [
        ...v,
        [
          remarkMdxExport,
          {
            values: valuesToExport,
          },
        ],
      ],
      options.remarkPlugins,
    ),
    rehypePlugins: pluginOption((v) => [...v], options.rehypePlugins),
  };
};

export const pluginOption = (
  def: (v: Pluggable[]) => (Pluggable | false)[],
  options: ResolvePlugins = [],
): Pluggable[] => {
  const list = def(Array.isArray(options) ? options : []).filter(
    Boolean,
  ) as Pluggable[];

  if (typeof options === 'function') {
    return options(list);
  }

  return list;
};

export const createCachedImport = <T>(
  imp: () => Promise<T>,
): (() => T | Promise<T>) => {
  let cached: T | Promise<T>;
  return () => {
    if (!cached) {
      cached = imp().then((module) => {
        cached = module;
        return module;
      });
    }
    return cached;
  };
};
