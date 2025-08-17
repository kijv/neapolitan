# neapolitan

Neapolitan is a content management tool intended to be used as low-level interfacing for any external content that is eventually served and displayed on a website (i.e., documentation, blog posts, etc.).

Neapolitan is intended to be extended by default. It provides a API with close similarities to Rollup/Vite plugin and also enforces good defaults for handling content. Thus, building Documentation frameworks--and the such--is relatively easy with Neapolitan.

## Install

```sh
npm install neapolitan
```

## Usage

Neapolitan requires the use of its Vite or Next.js plugin within the current application in order to provide its full capabilities, whether thats under-the-hood of your own plugin, or if it is directly supplied to the appropriate configuration (as follows).

With Vite:

vite.config.js

```js
import { defineConfig } from 'vite'
import neapolitan from 'neapolitan/vite'

export default defineConfig({
  plugins: [
    neapolitan({
      input: [
        /* inputs */
      ],
    }),
  ],
})
```

With Next.js:

next.config.mjs

```js
import createNeapolitan from 'neapolitan/next'

const withNeapolitan = createNeapolitan()

const nextConfig = {
  /* ... */
}

export default withNeapolitan(nextConfig)
```

neapolitan.config.mjs

```js
import { defineConfig } from 'neapolitan/next'

export default defineConfig({
  input: [
    /* inputs */
  ],
})
```
