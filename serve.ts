import { Hono } from 'hono/mod.ts'
import { serveStatic } from 'hono/adapter/deno/serve-static.ts'

const app = new Hono()

app.get('*', serveStatic({ root: './_site' }))

Deno.serve(app.fetch)
