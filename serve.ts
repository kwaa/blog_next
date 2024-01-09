import { Hono } from 'hono/mod.ts'
import { serveStatic } from 'hono/adapter/deno/serve-static.ts'

const app = new Hono()

app.get('*', serveStatic({ root: './_site' }))
app.notFound(c => c.redirect('/404.html', 307))

Deno.serve(app.fetch)
