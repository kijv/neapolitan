# neapolitan-input-local

## Install

```sh
npm install neapolitan-input-local
```

## Usage

```js
import local from 'neapolitan-input-local';

// within some neapolitan config
{
  input: [
    local({
      dir: 'content/docs',
      // root -- defaults to process.cwd()
      // filter -- specify certain conditions for including/excluding files from property 'dir'
    }),
  ];
}
```
