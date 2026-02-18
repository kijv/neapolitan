import { type FilterPattern, createFilter } from '@rollup/pluginutils';
import type { InputOption, ModuleType } from 'neapolitan';
import type { GeneralHookFilter } from 'rolldown';
import { collectFiles } from './util';
import fs from 'node:fs/promises';
import { packageDirectorySync } from 'package-directory';
import path from 'node:path';

export interface LocalInputOptions {
  root?: string;
  dir: string;
  filter?: GeneralHookFilter;
}

const normalizeFilter = (
  filter: GeneralHookFilter | undefined,
): {
  include?: FilterPattern;
  exclude?: FilterPattern;
} => {
  if (filter instanceof RegExp) {
    return {
      include: filter,
    };
  }

  if (typeof filter === 'object' && !Array.isArray(filter)) {
    return filter;
  }

  if (Array.isArray(filter)) {
    return {
      include: filter,
    };
  }

  return {
    include: filter ?? '**/*',
  };
};

export const local = (options: LocalInputOptions): InputOption => {
  const cwd = packageDirectorySync() ?? process.cwd();
  const root = options.root ? path.relative(cwd, options.root) : cwd;
  const dir = path.relative(root, options.dir);

  const filter = normalizeFilter(options.filter);

  const idFilter = createFilter(filter.include, filter.exclude, {
    resolve: dir,
  });

  let slugsCache: Map<
    string,
    {
      id: string;
      moduleType: ModuleType;
    }
  > | null = null;
  let collectedFiles: string[] | null = null;

  const getFiles = async (force = false) => {
    if (!force && collectedFiles) return collectedFiles;

    const files: string[] = [];
    for await (const id of collectFiles(path.relative(cwd, dir), idFilter)) {
      files.push(id);
    }
    return (collectedFiles = files);
  };

  const idToSlug = (id: string) => {
    const ext = path.extname(id);
    const slug =
      path.basename(id, ext) === 'index'
        ? path.dirname(id)
        : id.slice(0, -ext.length);

    return slug === '.' ? '' : slug;
  };

  return {
    name: 'neapolitan:local',
    slugs: {
      collect: async (force = false) => {
        if (!slugsCache || force) {
          slugsCache = new Map();

          for (const id of await getFiles(force)) {
            const relative = path.relative(dir, id);
            const slug = idToSlug(relative);
            slugsCache.set(slug, {
              id: relative,
              moduleType: path.extname(id).slice(1),
            });
          }
        }

        return Array.from(slugsCache).map(([slug, rest]) =>
          Object.assign(
            {
              slug,
            },
            rest,
          ),
        );
      },
      load: async (slugs) => {
        const slug = slugs.join('/');

        const filter = createFilter(
          [new RegExp(`${slug}/index.[^.]*$`), new RegExp(`${slug}.[^.]*$`)],
          [],
          {
            resolve: false,
          },
        );

        for (const id of await getFiles()) {
          if (filter(path.relative(dir, id))) {
            const text = await fs.readFile(path.relative(cwd, id), {
              encoding: 'utf8',
            });
            return text.toString();
          }
        }

        return null;
      },
    },
  };
};

export default local;
