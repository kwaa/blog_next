import { merge } from 'lume/core/utils/object.ts'

import type { WebManifest } from './webmanifest-types.ts'
import { Page } from 'lume/core/file.ts'

export interface Options {
  /** @default '/site.webmanifest'' */
  filename: string
  /** The manifest object */
  manifest: Partial<WebManifest> | false
  /**
   * Minify the generated manifest
   *
   * @default true
   */
  minify: boolean
}

export const defaults = (site: Lume.Site): Options => ({
  filename: '/site.webmanifest',
  manifest: false,
  minify: true,
})

export const webmanifest = (userOptions?: Partial<Options>) =>
  (site: Lume.Site) => {
    const options = merge(defaults(site), userOptions)

    if (options.manifest !== false) {
      site.addEventListener('beforeSave', () =>
        site.pages.push(Page.create({
          url: options.filename,
          content: JSON.stringify(options.manifest, null, options.minify ? 0 : 2)
        }))
      )

      site.process(['.html'], (pages) => pages
        .filter(({ document }) => !!document)
        .forEach(({ document }) => {
          const link = document!.createElement('link')
          link.setAttribute('rel', 'manifest')
          link.setAttribute('href', site.url(options.filename))
          document!.head.append(link)
        }))
    }
  }
