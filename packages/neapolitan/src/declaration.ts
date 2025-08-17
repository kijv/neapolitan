import type { Falsy } from './util'

export type MaybePromise<T> = T | Promise<T>

export type MaybeArray<T> = T | Array<T>

export type StringOrRegExp = string | RegExp

export type NullValue<T = void> = T | undefined | null | void

export type NonFalsyArray<T extends readonly unknown[]> = T extends [
  infer Head,
  ...infer Tail,
]
  ? Head extends Falsy
    ? NonFalsyArray<Tail> // skip falsy
    : [Head, ...NonFalsyArray<Tail>] // keep non-falsy
  : []

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type Arraify<T> = T extends Array<any> ? T : [T]

export type AwaitedArray<T extends Array<any>> = T extends readonly [
  infer Head,
  ...infer Tail,
]
  ? AwaitedArray<Tail> extends never[]
    ? [Awaited<Head>]
    : [Awaited<Head>, ...AwaitedArray<Tail>]
  : T extends Array<infer U>
    ? Awaited<U>[]
    : never

export type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

export type ElementOf<T extends readonly any[]> = T extends readonly (infer E)[]
  ? E
  : never

type LastOf<U> =
  UnionToIntersection<U extends any ? (x: U) => void : never> extends (
    x: infer L
  ) => void
    ? L
    : never

export type UnionToTuple<U, T extends any[] = []> = [U] extends [never]
  ? T
  : UnionToTuple<Exclude<U, LastOf<U>>, [LastOf<U>, ...T]>

export type NonNullable<T> = T extends null | undefined ? never : T

export type RequiredKeys<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>
}
