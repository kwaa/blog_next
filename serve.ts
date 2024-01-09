import { Hono } from 'hono/mod.ts'
import { serveStatic } from 'hono/adapter/deno/serve-static.ts'

const app = new Hono()

app.get(
  '*',
  serveStatic({
    root: './_site',
    // onNotFound: (path, c) => {},
  }),
)

Deno.serve(app.fetch)
