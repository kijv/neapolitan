import { publish } from '@vitejs/release-scripts';

await publish({ defaultPackage: 'neapolitan', packageManager: 'pnpm' });
