export interface TreeNode<T> {
  type: 'node';
  value?: T;
  children: Map<string, TreeChild>;
}

export interface Tree {
  type: 'tree';
  name: string;
  children: Map<string, TreeChild>;
}

export type TreeChild = TreeNode<any> | Tree;

export type RawTreeData = Array<{
  tree?: string;
  key: string;
  value: any;
}>;

type FindKey<
  Tree extends RawTreeData,
  Key extends string,
  Parent extends string | undefined = undefined,
> =
  Tree extends Array<infer T>
    ? T extends { key: Key; tree?: Parent }
      ? T
      : any
    : any;

export type TreeProxy<Data extends RawTreeData> = Tree & {
  getValue: <const K extends string>(
    target: K,
  ) => FindKey<Data, K>['value'] | undefined;
  setValue: (target: string, value: any) => boolean;
  getTree: (target: string) => TreeProxy<RawTreeData> | undefined;
  setTree: (target: string, tree?: Tree) => boolean;
  get: <const K extends string>(
    target: K,
  ) => FindKey<Data, K>['value'] | TreeProxy<RawTreeData> | undefined;
  load: <const T extends RawTreeData>(obj: T) => void;
  toJSON: () => RawTreeData;
};

export const proxyTree = <Data extends RawTreeData>(
  tree: Tree,
): TreeProxy<Data> => {
  const getValue = (target: string) => {
    const node = tree.children.get(target);

    if (node?.type === 'node') {
      return node.value;
    }
  };

  const setValue = (target: string, value: any) => {
    const node = tree.children.get(target);

    if (node != null && node.type !== 'node') {
      return false;
    }

    tree.children.set(
      target,
      Object.assign(
        {},
        (node as TreeNode<any>) ?? {
          type: 'node',
          children: new Map(),
        },
        {
          value,
        },
      ),
    );

    return true;
  };

  const getTree = (target: string) => {
    const node = tree.children.get(target);

    if (node?.type === 'tree') {
      return proxyTree(node);
    }
  };

  const setTree = (target: string, subtree?: Tree) => {
    const node = tree.children.get(target);

    if (node != null && node.type !== 'tree') {
      return false;
    }

    tree.children.set(
      target,
      Object.assign(
        {},
        (node as Tree) ?? {
          type: 'tree',
          children: new Map(),
        },
        subtree
          ? {
              children: new Map(
                Array.from(node?.children ?? []).concat(
                  Array.from(subtree.children),
                ),
              ),
            }
          : {},
      ),
    );

    return true;
  };

  const load = <const T extends RawTreeData>(obj: T) => {
    for (const data of obj) {
      const parent =
        data.tree != null
          ? (() => {
              let next = proxyTree(tree);

              for (const part of data.tree.split('.')) {
                next.setTree(part);
                next = next.getTree(part)!;
              }

              return next;
            })()
          : proxyTree(tree);

      parent.setValue(data.key, data.value);
    }
  };

  return new Proxy(
    Object.assign(tree, {
      getValue,
      setValue,
      getTree,
      setTree,
      get: (target: string) => {
        let currentNode: TreeChild = tree;

        const treeSep = '.';
        const childSep = '/';

        const full =
          (target.includes(treeSep) || target.includes(childSep)) &&
          currentNode.children.get(target);

        if (full) {
          return full.type === 'node' ? full.value : proxyTree(full);
        }

        let current = '';

        for (const char of target) {
          if (char === childSep || char === treeSep) {
            const path = current;
            current = '';

            const node = currentNode.children.get(path);

            if (node) {
              if (char === childSep && node.type === 'node') {
                currentNode = node;
              } else if (char === treeSep && node.type === 'tree') {
                currentNode = node;
              } else {
                current += path + char;
              }
            }
          } else {
            current += char;
          }
        }

        if (current.length > 0 || current === target) {
          const node = currentNode.children.get(current);

          if (node) {
            currentNode = node;
          } else {
            return;
          }
        }

        return currentNode.type === 'node'
          ? currentNode.value
          : proxyTree(currentNode);
      },
      load,
      toJSON: () => {
        const result: RawTreeData = [];

        const traverse = (
          tree: string | undefined,
          key: string,
          node: TreeChild,
        ) => {
          if (node.type === 'node') {
            result.push({
              tree,
              key,
              value: node.value,
            });
          }

          if (node.type === 'tree') {
            for (const [childKey, child] of node.children) {
              traverse(tree != null ? `${tree}.${key}` : key, childKey, child);
            }
          }
        };

        for (const [key, child] of tree.children) {
          traverse(undefined, key, child);
        }

        return result;
      },
    }),
    {
      get: (t, p, r) => Reflect.get(t, p, r),
    },
  );
};

export const createTree = <const TInitial extends RawTreeData>(
  initial?: TInitial,
): TreeProxy<TInitial> => {
  const tree: Tree = {
    type: 'tree',
    name: Math.random().toString(36).substring(2, 15),
    children: new Map(),
  };

  const proxy = proxyTree(tree);

  if (initial) {
    proxy.load(initial);
  }

  return proxy;
};

export const lazyTransformTree = <const T>(
  tree: TreeProxy<RawTreeData>,
  transform: (value: any) => T,
): TreeProxy<RawTreeData> => {
  const cache = new Map<string, T>();

  return new Proxy(
    Object.assign({}, tree, {
      get: (target: string) => {
        const value = tree.get(target);

        if (value != null) {
          if (cache.has(target)) {
            return cache.get(target);
          }

          const result = transform(value);

          cache.set(target, result);
          return result;
        }

        return;
      },
      getValue: (target: string) => {
        const value = tree.getValue(target);

        if (value != null) {
          if (cache.has(target)) {
            return cache.get(target);
          }

          const result = transform(value);

          cache.set(target, result);
          return result;
        }

        return;
      },
    }),
    {
      get: (t, p, r) => Reflect.get(t, p, r),
    },
  );
};

export const isTreeProxy = (value: any): value is TreeProxy<RawTreeData> => {
  if (value == null || typeof value !== 'object' || value.type !== 'tree')
    return false;

  const keyTypeofs: Record<string, (value: unknown) => boolean> = {
    type: (value) => typeof value === 'string' && value === 'tree',
    children: (value) => value instanceof Map,
    name: (value) => typeof value === 'string',
    getValue: (value) => typeof value === 'function',
    setValue: (value) => typeof value === 'function',
    getTree: (value) => typeof value === 'function',
    setTree: (value) => typeof value === 'function',
    get: (value) => typeof value === 'function',
    load: (value) => typeof value === 'function',
    toJSON: (value) => typeof value === 'function',
  };

  for (const [key, verify] of Object.entries(keyTypeofs)) {
    if (!verify(value[key])) {
      return false;
    }
  }

  return true;
};
