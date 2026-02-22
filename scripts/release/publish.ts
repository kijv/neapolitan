import { publish } from '@vitejs/release-scripts';

publish({ defaultPackage: 'neapolitan', packageManager: 'pnpm' }).catch((e) => {
  throw e;
});
