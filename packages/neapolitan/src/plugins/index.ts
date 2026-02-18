import type { PluginBase, PluginWithRequiredHook } from '../plugin';
import {
  loadFilterToFilterExprs,
  transformFilterToFilterExprs,
} from '../lib/hook-filter';
import type { ObjectHook } from 'rolldown';
import { interpreter } from '@rolldown/pluginutils';

export type HookHandler<T> = T extends ObjectHook<infer H> ? H : T;

export interface PluginHookUtils<T extends PluginBase> {
  getSortedPlugins: <K extends keyof PluginBase>(
    hookName: K,
  ) => PluginWithRequiredHook<T, K>[];
  getSortedPluginHooks: <K extends keyof PluginBase>(
    hookName: K,
  ) => NonNullable<HookHandler<PluginBase[K]>>[];
}

export const getHookHandler = <T extends ObjectHook<Function>>(hook: T) => {
  return (typeof hook === 'object' ? hook.handler : hook) as HookHandler<T>;
};

export const extractFilter = <T extends Function, F>(
  hook: ObjectHook<T, { filter?: F }> | undefined,
): {} | undefined => {
  return hook && 'filter' in hook && hook.filter ? hook.filter : undefined;
};

export function createPluginHookUtils<const T extends PluginBase>(
  plugins: T[],
): PluginHookUtils<T> {
  // sort plugins per hook
  const sortedPluginsCache = new Map<keyof PluginBase, PluginBase<any>[]>();
  function getSortedPlugins<const K extends keyof PluginBase>(
    hookName: K,
  ): PluginWithRequiredHook<T, K>[] {
    if (sortedPluginsCache.has(hookName))
      return sortedPluginsCache.get(hookName) as PluginWithRequiredHook<T, K>[];
    const sorted = getSortedPluginsByHook(hookName, plugins);
    sortedPluginsCache.set(hookName, sorted);
    return sorted;
  }
  function getSortedPluginHooks<K extends keyof PluginBase>(
    hookName: K,
  ): NonNullable<HookHandler<PluginBase[K]>>[] {
    const plugins = getSortedPlugins(hookName);
    return plugins.map((p) => getHookHandler<any>(p[hookName])).filter(Boolean);
  }

  return {
    getSortedPlugins,
    getSortedPluginHooks,
  };
}

type SkipItems<T, K extends number> = T extends [infer U, ...infer R]
  ? U extends undefined
    ? SkipItems<R, K>
    : SkipItems<R, K>
  : T;

export type FilterParams = SkipItems<Parameters<typeof interpreter>, 1>;

type FilterForPluginValue = {
  load?: ((...args: FilterParams) => boolean) | undefined;
  transform?: ((...args: FilterParams) => boolean) | undefined;
  resolveId?: ((...args: FilterParams) => boolean) | undefined;
};
const filterForPlugin = new WeakMap<PluginBase<any>, FilterForPluginValue>();

export function getCachedFilterForPlugin<H extends keyof FilterForPluginValue>(
  plugin: PluginBase<{
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
  hookName: H,
): FilterForPluginValue[H] | undefined {
  let filters = filterForPlugin.get(plugin);
  if (filters && hookName in filters) {
    return filters[hookName];
  }

  if (!filters) {
    filters = {};
    filterForPlugin.set(plugin, filters);
  }

  let filter: FilterForPluginValue[H] | undefined;
  switch (hookName) {
    case 'load': {
      const rawFilter = extractFilter(plugin.load);
      const filterExprs = loadFilterToFilterExprs(rawFilter);
      filters.load = filterExprs
        ? (...args) => interpreter(filterExprs, ...args)
        : undefined;
      filter = filters.load;
      break;
    }
    case 'transform': {
      const rawFilters = extractFilter(plugin.transform);
      const filterExprs = transformFilterToFilterExprs(rawFilters);
      filters.transform = filterExprs
        ? (...args) => interpreter(filterExprs, ...args)
        : undefined;
      filter = filters.transform;
      break;
    }
    case 'resolveId': {
      const rawFilter = extractFilter(plugin.resolveId);
      const filterExprs = loadFilterToFilterExprs(rawFilter);
      filters.resolveId = filterExprs
        ? (...args) => interpreter(filterExprs, ...args)
        : undefined;
      filter = filters.resolveId;
      break;
    }
  }
  return filter as FilterForPluginValue[H] | undefined;
}

export function getSortedPluginsByHook<
  T extends PluginBase,
  K extends keyof PluginBase,
>(hookName: K, plugins: readonly T[]): PluginWithRequiredHook<T, K>[] {
  const sortedPlugins: PluginBase[] = [];
  // Use indexes to track and insert the ordered plugins directly in the
  // resulting array to avoid creating 3 extra temporary arrays per hook
  let pre = 0,
    normal = 0,
    post = 0;
  for (const plugin of plugins) {
    const hook = plugin[hookName];
    if (hook) {
      if (typeof hook === 'object') {
        if (hook.order === 'pre') {
          sortedPlugins.splice(pre++, 0, plugin);
          continue;
        }
        if (hook.order === 'post') {
          sortedPlugins.splice(pre + normal + post++, 0, plugin);
          continue;
        }
      }
      sortedPlugins.splice(pre + normal++, 0, plugin);
    }
  }

  return sortedPlugins as PluginWithRequiredHook<T, K>[];
}
