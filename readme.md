# neapolitan

Neapolitan is a low-level content management system intended for use within websites when serving any form of external content into blog posts, documentation, etc.

## Install

> [!CAUTION]
> Neapolitan is currently in beta and is subject to breaking changes without warning.

```sh
npm install neapolitan@canary
```

## Why

Neapolitan aims to be a low-level building block that allows authors of documentation frameworks (or any other kind of library that serves external content) to easily leverage the simple, yet strict, defaults of this library. It should technically be possible to build applications like VitePress (yes, possibly serving to Vue--and other web frameworks, not just JS/JSX), Nextra (docs framework built into the Next.js routing system), and Fumadocs.

### API

Neapolitan implements a **Vite/Rollup-plugin-like API**, this means that code can be loaded and transformed easily, whether that is transforming a `app/some-path/page.mdx`, or loading the contents of some `docs/some-file.mdx`. The plugin API primarily attempts to have feature parity to rolldown (ex. built-in `filter` object in applicable hooks--look into the @rolldown/pluginutils library for more information)

```ts
resolveId: (id: string) => string | NullValue | { id: string, external?: "relative" | "absolute" }
load: (id: string) => string | NullValue | { code: string, map?: /* ... */, moduleType?: ModuleType }
transform: (id: string, code: string, meta: { moduleType: ModuleType }) => string | NullValue | { code: string, map?: /* ... */, moduleType?: ModuleType, data?: /* ... */ }
slugs.load: (slugs: string[]) => string | NullValue | { code: string, map?: /* ... */, moduleType?: ModuleType }
slugs.transform: (slugs: string[], code: string, meta: { moduleType: ModuleType }) => string | NullValue | { code: string, map?: /* ... */, moduleType?: ModuleType }
```
#### Input

An input is a source of content that is eventually served into the output(s)

The [neapolitan-input-local](https://github.com/kijv/neapolitan/tree/main/packages/neapolitan-input-local) is an implementation of an input.

##### Slugs

Neapolitan focuses on leveraging content through a slug system, meaning that files are not treated by their file paths/ids, but rather by their "slug" (i.e. `docs/some-file-name/index.mdx` has a slug of `some-file-name` by most documentation framework standards). How a "slug" is interpreted can be determined by the given input implementation.

> Every input requires the implementation of the `slugs.collect` method. This provides an initial set of "slugs" that Neapolitan should register when the user requests all or a single slug.

`slugs.load` and `slugs.transform` are optional methods that determine the content of a slug. 
It is recommended that you implement `slugs.load`, even though it is not required, if you want your source to determine said slug's content. 
The `slugs.transform` method allows you to modify other input's slugs or the current slug (depending on the `enforce` value, and if the current input loaded their own slugs via `slugs.load`)

##### Loading and Transforming

The option `load` and `transform` options on the root of the input (object) allow you to change the code of any file that is requested in the current application. In most cases, this will not be necessary, but is available for potential use.

#### Output

An output is a processor for some code.

The output contains an optional `transform` method that is self-explanatory (ex. Markdown/MDX text compiled into JS)

The [neapolitan-output-mdx](https://github.com/kijv/neapolitan/tree/main/packages/neapolitan-output-mdx) is an implementation of an output.
