export type AsyncFlatten<T extends unknown[]> = T extends (infer U)[]
  ? Exclude<Awaited<U>, U[]>[]
  : never

export const asyncFlatten = async <T extends unknown[]>(
  arr: T
): Promise<AsyncFlatten<T>> => {
  do {
    arr = (await Promise.all(arr)).flat(Infinity) as any
  } while (arr.some((v: any) => v?.then))
  return arr as unknown[] as AsyncFlatten<T>
}

export const neapolitanError = <const E>(e: E, extra = ''): never => {
  if (e instanceof Error) {
    e.message = `[neapolitan]${extra} ${e.message}`

    throw e
  } else {
    throw new Error(`[neapolitan]${extra} ${String(e)}`, { cause: e })
  }
}

export const createCachedImport = <T>(
  imp: () => Promise<T>
): (() => T | Promise<T>) => {
  let cached: T | Promise<T>
  return () => {
    if (!cached) {
      cached = imp().then((module) => {
        cached = module
        return module
      })
    }
    return cached
  }
}

export const arraify = <T>(value: T | T[]): T[] => {
  return Array.isArray(value) ? value : [value]
}

export type NormalizeHook<T> = T extends { filter: infer F; handler: infer H }
  ? { filter: F; handler: H }
  : T extends (...args: any[]) => any
    ? T
    : never

export const normalizeHook = <const T extends {}, F>(
  obj: T | { filter?: F; handler: T }
): { filter?: F; handler: T } => {
  if (typeof obj === 'object' && 'filter' in obj) {
    const { filter, handler } = obj as { filter: F; handler: T }
    return { filter, handler }
  } else if (typeof obj !== 'object') return { handler: obj }

  throw new Error('unreachable')
}

export type Falsy = false | null | undefined

export const isFasly = (t: unknown): t is Falsy => {
  return (typeof t === 'boolean' && t === false) || t == null
}
