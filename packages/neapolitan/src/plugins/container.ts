import {
  type FilterParams,
  createPluginHookUtils,
  getCachedFilterForPlugin,
  getHookHandler,
} from '.';
import type { MaybePromise, PluginBase } from '../plugin';
import type { ObjectHook } from 'rolldown';

type ExtractHandler<
  Plugin extends Record<string, ObjectHook<any>>,
  K extends keyof Plugin,
> =
  Plugin[K] extends ObjectHook<infer H>
    ? NonNullable<H> extends (...args: any) => any
      ? NonNullable<H>
      : never
    : never;

type HandlerOnly<Plugin extends PluginBase<any>, K extends keyof Plugin> = (
  ...args: Parameters<ExtractHandler<Plugin, K>>
) => Promise<ReturnType<ExtractHandler<Plugin, K>>>;

export type PluginContainer<
  Plugin extends PluginBase<{
    load: {
      hook: (...args: any) => any;
    };
    transform: {
      hook: (...args: any) => any;
    };
    resolveId: {
      hook: (...args: any) => any;
    };
  }>,
> = {
  load: HandlerOnly<Plugin, 'load'>;
  transform: HandlerOnly<Plugin, 'transform'>;
  resolveId: HandlerOnly<Plugin, 'resolveId'>;
};

export const createPluginContainer = <
  const Plugin extends PluginBase<{
    load: {
      hook: (...args: any) => any;
    };
    transform: {
      hook: (...args: any) => any;
    };
    resolveId: {
      hook: (...args: any) => any;
    };
  }>,
>(
  plugins: Plugin[],
  filterArgs: {
    load?: (
      ...args: Parameters<ExtractHandler<Plugin, 'load'>>
    ) => FilterParams;
    transform?: (
      ...args: Parameters<ExtractHandler<Plugin, 'transform'>>
    ) => FilterParams;
    resolveId?: (
      ...args: Parameters<ExtractHandler<Plugin, 'resolveId'>>
    ) => FilterParams;
  } = {},
): PluginContainer<Plugin> => {
  const utils = createPluginHookUtils(plugins);

  const _processesing = new Set<Promise<any>>();

  const handleHookPromise = <T>(maybePromise: undefined | T | Promise<T>) => {
    if (!(maybePromise as any)?.then) {
      return maybePromise;
    }
    const promise = maybePromise as Promise<T>;
    _processesing.add(promise);
    return promise.finally(() => _processesing.delete(promise));
  };

  return {
    load: async (...args: Parameters<ExtractHandler<Plugin, 'load'>>) => {
      for (const plugin of utils.getSortedPlugins('load')) {
        const filter = getCachedFilterForPlugin(plugin, 'load');
        if (filter && filterArgs.load && !filter(...filterArgs.load(...args)))
          continue;

        const handler = getHookHandler(plugin.load);
        const result = await handleHookPromise<MaybePromise<any>>(
          handler(...args),
        );
        if (result != null) return result;
      }

      return null;
    },
    transform: async (
      ...args: Parameters<ExtractHandler<Plugin, 'transform'>>
    ) => {
      for (const plugin of utils.getSortedPlugins('transform')) {
        const filter = getCachedFilterForPlugin(plugin, 'transform');
        if (
          filter &&
          filterArgs.transform &&
          !filter(...filterArgs.transform(...args))
        )
          continue;

        const handler = getHookHandler(plugin.transform);
        const result = await handleHookPromise<MaybePromise<any>>(
          handler(...args),
        );
        if (result != null) return result;
      }

      return null;
    },
    resolveId: async (
      ...args: Parameters<ExtractHandler<Plugin, 'resolveId'>>
    ) => {
      for (const plugin of utils.getSortedPlugins('resolveId')) {
        const filter = getCachedFilterForPlugin(plugin, 'resolveId');
        if (
          filter &&
          filterArgs.resolveId &&
          !filter(...filterArgs.resolveId(...args))
        )
          continue;

        const handler = getHookHandler(plugin.resolveId);
        const result = await handleHookPromise<MaybePromise<any>>(
          handler(...args),
        );
        if (result != null) return result;
      }
      return null;
    },
  };
};
