import { generateChangelog, release } from '@vitejs/release-scripts';
import colors from 'picocolors';
import { logRecentCommits } from './util';

await release({
  repo: 'neapolitan',
  packages: ['neapolitan', 'neapolitan-input-local', 'neapolitan-output-mdx'],
  toTag: (pkg, version) =>
    pkg === 'neapolitan' ? `v${version}` : `${pkg}@${version}`,
  logChangelog: (pkg) => logRecentCommits(pkg),
  generateChangelog: async (pkgName) => {
    console.log(colors.cyan('\nGenerating changelog...'));

    await generateChangelog({
      getPkgDir: () => `packages/${pkgName}`,
      tagPrefix: pkgName === 'neapolitan' ? undefined : `${pkgName}@`,
    });
  },
});
