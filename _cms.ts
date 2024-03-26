import lumeCMS from 'lume/cms.ts'
import { ltsCMS } from 'lume_theme_shiraha/cms.ts'

export default ltsCMS(lumeCMS({
  site: {
    name: './kwaa.dev/next',
    url: 'https://kwaa-blog-next.deno.dev'
  }
}))
  .versioning('main')
