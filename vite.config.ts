//@ts-nocheck
declare global {
  const Salla: any;
}
import { defineConfig } from 'vite';
import {
sallaBuildPlugin,
sallaDemoPlugin,
sallaTransformPlugin,
} from '@salla.sa/twilight-bundles/vite-plugins';

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
  sallaDemoPlugin({
    // Uncomment to preview only specific components
    // components: ['product-card', 'scroll-top', 'table-list']
  }),
  fixWindowsDemoFsUrlsPlugin(),
]
});
