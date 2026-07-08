//@ts-nocheck
declare global {
  const Salla: any;
}
import { resolve } from 'path';
import { defineConfig } from 'vite';
import {
sallaBuildPlugin,
sallaDemoPlugin,
sallaTransformPlugin,
} from '@salla.sa/twilight-bundles/vite-plugins';

/**
 * Duplicate `src/shared/*` into every component at build time.
 *
 * sallaBuildPlugin runs ONE multi-entry Rollup build, and Rollup splits any
 * module imported by 2+ entries into a shared `dist/<name>-<hash>.js` chunk.
 * That breaks the Salla contract of one self-contained JS file per component.
 * This plugin tags each shared-module import with the importing component
 * (`?gk=<name>`), so Rollup sees N distinct modules and inlines a copy into
 * each entry — single source in `src/shared/`, zero coupling in `dist/`.
 */
function duplicateSharedPerComponentPlugin() {
  const sharedDir = resolve(process.cwd(), 'src/shared');
  return {
    name: 'gk-duplicate-shared',
    enforce: 'pre',
    apply: 'build',
    async resolveId(source: string, importer: string | undefined) {
      if (!importer) return null;
      const comp =
        importer.match(/src\/components\/([^/]+)\//)?.[1] ??
        importer.match(/[?&]gk=([^&]+)/)?.[1];
      if (!comp) return null;
      const resolved = await this.resolve(source, importer.split('?')[0], {
        skipSelf: true,
      });
      if (!resolved || resolved.external) return null;
      if (!resolved.id.startsWith(sharedDir)) return null;
      return `${resolved.id}?gk=${comp}`;
    },
  };
}

function fixWindowsDemoFsUrlsPlugin() {
  return {
    name: 'fix-windows-demo-fs-urls',
    transformIndexHtml(html: string) {
      if (!html.includes('window.customComponents =')) return html;
      return html.replace(
        /window\.customComponents\s*=\s*[\s\S]*?;/,
        (match: string) => `${match}
window.customComponents = (window.customComponents || []).map((url) => {
  if (typeof url !== 'string') return url;
  return url
    .replace(/\\\\/g, '/')
    .replace(/^\\/\\@fs([A-Za-z]:)/, '/@fs/$1');
});`,
      );
    },
  };
}

export default defineConfig({
plugins: [
  sallaTransformPlugin(),
  sallaBuildPlugin(),
  duplicateSharedPerComponentPlugin(),
  sallaDemoPlugin({
    // Uncomment to preview only specific components
    // components: ['interactive-product']
  }),
  fixWindowsDemoFsUrlsPlugin(),
]
});
