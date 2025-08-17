import { createFilter } from '@rollup/pluginutils'
import { packageDirectorySync } from 'package-directory'
import path from 'node:path'
import { collectFiles } from './util'
import type { CommonInputOptions, InputOption, ModuleType } from 'neapolitan'
import fs from 'node:fs/promises'

export interface LocalInputOptions extends CommonInputOptions {
  idToSlug?: (id: string) => string
}

export const local = (options: LocalInputOptions): InputOption => {
  const cwd = packageDirectorySync() ?? process.cwd()
  const root = options.root ? path.relative(cwd, options.root) : cwd
  const dir = path.relative(root, options.dir)

  const idFilter = createFilter(
    options.filter != null
      ? typeof options.filter === 'object' &&
        !Array.isArray(options.filter) &&
        'include' in options.filter
        ? options.filter.include
        : Array.isArray(options.filter)
          ? options.filter
          : undefined
      : '**/*',
    typeof options.filter === 'object' && 'exclude' in options.filter
      ? options.filter.exclude
      : [],
    {
      resolve: dir,
    }
  )

  let slugsCache: Map<
    string,
    {
      id: string
      moduleType: ModuleType
    }
  > | null = null
  let collectedFiles: string[] | null = null

  const getFiles = async (force = false) => {
    if (!force && collectedFiles) return collectedFiles

    const files: string[] = []
    for await (const id of collectFiles(path.relative(cwd, dir), idFilter)) {
      files.push(id)
    }
    return (collectedFiles = files)
  }

  const idToSlug =
    options.idToSlug ??
    ((id: string) => {
      const ext = path.extname(id)
      const slug =
        path.basename(id, ext) === 'index'
          ? path.dirname(id)
          : id.slice(0, -ext.length)

      return slug === '.' ? '' : slug
    })

  return {
    name: 'neapolitan:local',
    slugs: {
      collect: async (force = false) => {
        if (!slugsCache || force) {
          slugsCache = new Map()

          for await (const id of await getFiles(force)) {
            const relative = path.relative(dir, id)
            const slug = idToSlug(relative)
            slugsCache.set(slug, {
              id: relative,
              moduleType: path.extname(id).slice(1),
            })
          }
        }

        return Array.from(slugsCache).map(([slug, rest]) =>
          Object.assign(
            {
              slug,
            },
            rest
          )
        )
      },
      load: async (slugs) => {
        const slug = slugs.join('/')

        const filter = createFilter(
          [new RegExp(`${slug}/index.[^.]*$`), new RegExp(`${slug}.[^.]*$`)],
          [],
          {
            resolve: false,
          }
        )

        for (const id of await getFiles()) {
          if (filter(path.relative(dir, id))) {
            const text = await fs.readFile(path.relative(cwd, id), {
              encoding: 'utf8',
            })
            return text.toString()
          }
        }

        return null
      },
    },
  }
}

export default local
