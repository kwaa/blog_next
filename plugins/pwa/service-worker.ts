import { merge } from 'lume/core/utils/object.ts'
import { generateSW, type GenerateSWOptions } from 'npm:workbox-build@7.0.0'

export interface Options {
  /** @default 'sw.js' */
  filename: string
  /** @default 'generateSW'' */
  // strategies: 'generateSW' | 'injectManifest'
  /** The workbox object for `generateSW` */
  workbox: Partial<GenerateSWOptions>
}

export const defaults: Options = {
  filename: '/sw.js',
  // strategies: 'generateSW',
  workbox: {
    globDirectory: '_site/',
  }
}

export const serviceWorker = (userOptions?: Partial<Options>) =>
  (site: Lume.Site) => {
    const options = merge(defaults, userOptions)
    site.addEventListener('afterBuild', async () => {
      await generateSW({
        ...options.workbox,
        swDest: `_site${options.filename}`
      })
    })
  }
