import { type Context, Hono } from 'hono/mod.ts'
import { serveStatic } from 'hono/adapter/deno/serve-static.ts'
import { hatsuWellKnown, hatsuObject } from 'aoba/hono/middlewares/hatsu.ts'

const app = new Hono()
const instance = new URL('https://hatsu-nightly-debug.hyp3r.link')

app.use('/.well-known/*', hatsuWellKnown({ instance }))
app.use('/articles/*', hatsuObject({ instance }))
app.get('*', serveStatic({ root: './_site' }))
app.notFound(({ redirect }: Context) => redirect('/404.html', 307))

Deno.serve(app.fetch)
