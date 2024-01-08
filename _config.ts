import lume from 'lume/mod.ts'
import lts from 'lume_theme_shiraha/mod.ts'

export default lume({ src: './posts' })
  .use(lts())
