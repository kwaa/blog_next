import lume from 'lume/mod.ts'
import lts from 'lume_theme_shiraha/mod.ts'
// import { hatsuPlugin as hatsu } from 'aoba/lume/plugins/hatsu.ts'
import { webmanifest } from './plugins/pwa/webmanifest.ts'

export default lume({ src: './posts' })
  .use(lts())
  .use(webmanifest({
    manifest: {
      name: './kwaa.dev/next',
      short_name: './kwaa.dev/next',
      lang: 'zh',
      id: 'https://kwaa-blog-next.deno.dev',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#f8f9ff',
      theme_color: '#6750a4',
      icons: [],
    },
    minify: false,
  }))
  // .use(hatsu({
  //   instance,
  //   match: [/^\/articles\/(.+)$/],
  // }))
