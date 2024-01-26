---
title: 浅谈 Deno Deploy Entrypoint
published: 2024-01-26
tags:
  - Deno
  - Deno Deploy
  - Hono
---

部署到 Deno Deploy 的时候，需要指定一个 entrypoint 文件。

```yaml
- name: Deploy to Deno Deploy
  uses: denoland/deployctl@v1
  with:
    project: my-project
    entrypoint: https://deno.land/std/http/file_server.ts
```

这是服务端入口点，静态网站通常会使用 https://deno.land/std/http/file_server.ts ；让我看看它都做了什么。

```ts
if (import.meta.main) {
  main()
}
```

检测 [`import.meta.main{:ts}`](https://docs.deno.com/runtime/manual/runtime/import_meta_api#importmetamain)，如果当前模块为入口点则执行 [`main`](https://deno.land/std@0.213.0/http/file_server.ts?source=#L742) 函数（`serveDir` 的包装）。

```ts
const handler = (req: Request): Promise<Response> => {
  return serveDir(req, {
    fsRoot: target,
    showDirListing: serverArgs['dir-listing'],
    showDotfiles: serverArgs.dotfiles,
    enableCors: serverArgs.cors,
    quiet: !serverArgs.verbose,
    headers,
  })
}

Deno.serve(
  {
    port,
    hostname: host,
  },
  handler
)
```

我参考这个，在 Lume Theme Shiraha 提供了 `server.ts` 模块：

```ts
import { Hono, serveStatic } from './deps/hono_server.ts'

export const server = new Hono()
  .get('*', serveStatic({ root: './_site' }))
  .notFound(({ redirect }) => redirect('/404.html', 307))

if (import.meta.main) {
  const { parseArgs } = await import('lume/deps/cli.ts')
  const { hostname, port } = parseArgs(Deno.args, {
    alias: { host: 'hostname' },
    string: ['hostname', 'port'],
    default: {
      hostname: '0.0.0.0',
      port: '8000',
    },
  })

  Deno.serve({ hostname, port: Number(port) || 8000 }, server.fetch)
}
```

虽然它也可以正常导入，但我还没想好该怎么扩展... （因为 `get('*'){:ts}` 在最顶上，优先级比下面要高）

本站目前直接使用 `new Hono()`：

```ts
import { Hono } from 'hono/mod.ts'
import { serveStatic } from 'hono/adapter/deno/serve-static.ts'
import { hatsuWellKnown, hatsuObject } from 'aoba/hono/middlewares/hatsu.ts'

const app = new Hono()
const instance = new URL('https://hatsu.local')

app.use('/.well-known/*', hatsuWellKnown({ instance }))
app.use('/articles/*', hatsuObject({ instance }))
app.get('*', serveStatic({ root: './_site' }))
app.notFound(({ redirect }) => redirect('/404.html', 307))

Deno.serve(app.fetch)
```

`hatsuWellKnown` 和 `hatsuObject` 这两个中间件是之后用来测试 Hatsu 集成的。

未来我可以加点好玩的功能，比如对部分 unlisted 文章使用 [basicAuth](https://hono.dev/middleware/builtin/basic-auth)。
