import {
  type NeapolitanConfig,
  type ResolvedNeapolitanConfig,
  resolveNeapolitanConfig,
} from '..';
import type { MaybePromise } from '../declaration';
import type { NeapolitanNextPluginOptions } from '.';
import { createCachedImport } from '../util';
import { loadConfig } from 'c12';

export const loadNeapolitanConfig = createCachedImport(() => {
  return loadConfig<NeapolitanConfig>({
    cwd: process.cwd(),
    name: 'neapolitan',
    configFile: 'neapolitan.config',
  });
});

export const loadNeapolitanConfigPath = (() => {
  const cached: Record<string, NeapolitanConfig | Promise<NeapolitanConfig>> =
    {};
  let lastConfigPath: string | undefined = undefined;

  const imp = async (configPath: string | undefined) =>
    (
      await loadConfig<NeapolitanConfig>({
        cwd: process.cwd(),
        name: 'neapolitan',
        configFile: configPath ?? 'neapolitan.config',
      })
    ).config;

  return (configPath?: string) => {
    if (configPath != null && configPath !== lastConfigPath) {
      lastConfigPath = undefined;
    }
    if (lastConfigPath == null && configPath != null) {
      lastConfigPath = configPath;
      cached[configPath] = imp(configPath).then((module) => {
        cached[configPath] = module;
        return cached[configPath];
      });
    }
    return cached[configPath ?? lastConfigPath!];
  };
})();

export const cachedNeapolitanConfig = (() => {
  let cachedOptions: NeapolitanNextPluginOptions['config'] | undefined =
    undefined;
  let config: MaybePromise<NeapolitanConfig> | null = null;
  let resolved: MaybePromise<ResolvedNeapolitanConfig> | null = null;

  const imp = async (options?: NeapolitanNextPluginOptions['config']) =>
    loadConfig<NeapolitanConfig>(
      Object.assign(
        {
          cwd: process.cwd(),
          configFile: 'neapolitan.config',
        },
        options,
        {
          name: 'neapolitan',
        },
      ),
    );

  const load = async (options?: NeapolitanNextPluginOptions['config']) => {
    if (
      cachedOptions == null ||
      (options != null && options !== cachedOptions)
    ) {
      cachedOptions = undefined;
      config = null;
      resolved = null;
    }
    if (!config) {
      config = imp(options).then((module) => {
        config = module.config;
        return module.config;
      });
    }
    return config!;
  };

  return {
    load,
    resolve: async (options?: NeapolitanNextPluginOptions['config']) => {
      if (
        cachedOptions == null ||
        config == null ||
        (options != null && options !== cachedOptions)
      ) {
        await load(options);
      }
      if (!resolved && config != null) {
        resolved = resolveNeapolitanConfig(await config);
      }
      return resolved!;
    },
    clear: () => {
      cachedOptions = undefined;
      config = null;
      resolved = null;
    },
  };
})();

export const loadResolvedConfig = createCachedImport(async () => {
  const { config } = await loadNeapolitanConfig();
  return resolveNeapolitanConfig(config);
});

export const mapCachedResolvedConfig = <T>(
  imp: (config: ResolvedNeapolitanConfig) => Promise<T>,
): (() => T | Promise<T>) => {
  const inner = async () => {
    const resolvedConfig = await loadResolvedConfig();
    return imp(resolvedConfig);
  };
  let cached: T | Promise<T>;
  return () => {
    if (!cached) {
      cached = inner().then((module) => {
        cached = module;
        return module;
      });
    }
    return cached;
  };
};
