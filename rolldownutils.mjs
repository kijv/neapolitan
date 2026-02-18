import glob from 'fast-glob';
import m from 'node:module';
import path from 'node:path';

export * as pluginutils from '@rolldown/pluginutils';

export const getInput = (exports, cwd = process.cwd()) =>
  glob(
    Object.entries(exports).flatMap(([key]) =>
      key === '.' ? ['index.*'] : [`${key}.*`, `${key}/index.*`],
    ),
    {
      cwd,
      ignore: ['**/*.test.*'],
      absolute: true,
    },
  );

export const idToExportKey = (entryName, id) => {
  // index.ts -> [".", "./index"]
  // provider/index.ts -> ["./provider", "./provider/index"]
  // etc.

  const dir = path.dirname(id);
  const base = path.basename(id);

  const relativeDir = dir.startsWith('.') ? dir : `./${dir}`;
  const relativeBase = `${relativeDir}/${base.replace(/\.[^.]*$/, '').replace(path.extname(entryName), '')}`;

  return [relativeBase].concat(
    relativeBase.endsWith('index') ? [relativeDir] : [],
  );
};

export const NODE_EXTERNAL = m.builtinModules.concat(
  m.builtinModules.map((mod) => `node:${mod}`),
);

export const createOutput = (
  dir,
  exports,
  cwd = process.cwd(),
  src = path.join(process.cwd(), 'src'),
) => {
  return {
    dir,
    entryFileNames: createEntryFileNames(exports, src, cwd),
  };
};

export const createEntryFileNames = (exports, src, cwd = process.cwd()) => {
  const exportMap = new Map(
    Object.entries(exports).map(([key, value]) => [key, value]),
  );

  const getExportFromKeys = (keys) => {
    for (const key of keys) {
      if (exportMap.has(key)) {
        return exportMap.get(key);
      }
    }
    return undefined;
  };

  return (entry) => {
    const relative = path.relative(src, entry.facadeModuleId);
    const keys = idToExportKey(entry.name, relative);

    const exportData = getExportFromKeys(keys);

    if (exportData == null) {
      throw new Error(`[neapolitan] [${relative}] export not found`);
    }

    const output =
      typeof exportData === 'string'
        ? exportData
        : ((entry.name.endsWith('.d')
            ? exportData.types
            : (exportData.import ?? exportData.require)) ??
          exportData.default ??
          entry.name);

    return path.relative(path.join(cwd, 'dist'), output);
  };
};
