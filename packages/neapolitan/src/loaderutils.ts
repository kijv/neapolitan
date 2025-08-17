/// <reference types="./runtime.d.ts" />

import './runtime.d.ts'

export const NEAPOLITAN_CTX_ID = 'neapolitan-ctx'
export const NEAPOLITAN_INPUT_ID = 'neapolitan-input'

export const importCtx = (): Promise<typeof import('neapolitan-ctx').default> => import('neapolitan-ctx').then((mod) => mod.default)
export const importInput = (): Promise<typeof import('neapolitan-input').default> => import('neapolitan-input').then((mod) => mod.default)

export { createOutputContainer } from './plugins/output'
export { createInputContainer } from './plugins/input'

export { normalizeHook } from './util'
export { getHookHandler, extractFilter } from './plugins/'

export type * from './plugins/declaration'