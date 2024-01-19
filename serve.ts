import { Hono } from 'hono/mod.ts'
import { serveStatic } from 'hono/adapter/deno/serve-static.ts'
import { hatsuWellKnown, hatsuObject } from 'aoba/hono/middlewares/hatsu.ts'

const app = new Hono()
const instance = new URL('https://hatsu.local')

app.use('/.well-known/*', hatsuWellKnown({ instance }))
app.use('/articles/*', hatsuObject({ instance }))
app.get('*', serveStatic({ root: './_site' }))
app.notFound(c => c.redirect('/404.html', 307))

Deno.serve(app.fetch)
