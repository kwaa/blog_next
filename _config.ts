import lume from 'lume/mod.ts'
import lts from 'lume_theme_shiraha/mod.ts'
import { hatsuPlugin as hatsu } from 'aoba/lume/plugins/hatsu.ts'

export const instance = new URL('https://hatsu.local')

export default lume({ src: './posts' })
  .use(lts())
  .use(hatsu({
    instance,
    match: [/^\/articles\/(.+)$/],
  }))
