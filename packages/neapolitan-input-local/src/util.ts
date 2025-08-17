import path from 'node:path'
import fs from 'node:fs/promises'

export const collectFiles = async function* (
  dir: string,
  filter: (path: string) => boolean
): AsyncGenerator<string, void, unknown> {
  const stats = await fs.readdir(dir, { withFileTypes: true, recursive: true })

  for (const stat of stats) {
    const fullPath = path.join(dir, stat.name)

    if (stat.isDirectory()) {
      yield* collectFiles(fullPath, filter)
    } else if (stat.isFile() && filter(stat.name)) {
      yield fullPath
    }
  }
}
