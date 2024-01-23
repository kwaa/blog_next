---
title: Introducing Lume Theme Shiraha
tags:
  - Lume
  - Lume_Theme_Shiraha
published: 2024-01-21
image: https://images.unsplash.com/photo-1632683353128-1d02d43cfdd4?w=720
---

> 这篇文章尚未完成，且预计在迁移完之前不会于 [./kwaa.dev](https://kwaa.dev) 发布。

时隔两年（2021.10 ~ 2024.1），是时候翻新我的博客了。

这个项目集成了很多我的其它东西，所以我会按照时间线来写。

## [Gumori You](https://github.com/importantimport/gumori-you)

一次失败尝试，但是它的“AOT”主题生成很好的延续了下来。

在 Deno，我使用 [`skia_canvas`](https://deno.land/x/skia_canvas) 库来读取图片数据。~~希望以后能用上 OffscreenCanvas~~

感兴趣？可以看看源码（分别是 22 年 Gumori You 原版和 24 年 LTS 重写）：

- [gumori-you/src/components/head.astro](https://github.com/importantimport/gumori-you/blob/main/src/components/head.astro)
- [gumori-you/src/scripts/m3-utils.ts](https://github.com/importantimport/gumori-you/blob/main/src/scripts/m3-utils.ts)
- [lume_theme_shiraha/plugins/lts/theme.ts](https://github.com/importantimport/lume_theme_shiraha/blob/main/plugins/lts/theme.ts)
- [lume_theme_shiraha/plugins/lts/lib/theme_utils.ts](https://github.com/importantimport/lume_theme_shiraha/blob/main/plugins/lts/lib/theme_utils.ts)

## [Shiraha](https://github.com/importantimport/shiraha)

在开发 Gumori 时，我接触到了 Classless CSS 这种东西。

很理想不是吗？作用于任何语义化 HTML，免类名，直接应用。

但事实证明用惯了 Tailwind CSS / UnoCSS 的我还是不太适应这种开发方式。

SugarSS 第一版和 Vanilla Extract 第二版全部无望，现在只剩下使用 UnoCSS 的本主题了。

### [Shiraha Colors](https://github.com/importantimport/shiraha/tree/main/packages/shiraha-colors)

一个子项目，当时我希望把主题生成的活交给客户端来做，这样就不再需要在 Node / Deno 依赖一个很肥的 canvas 库。

事实证明这样做体验确实很不好，包括但不限于：

- 要加载 20~40KB 的脚本（如果用上 Web Worker 则是 100KB 以上，因为它和 Partytown 不兼容）
- 生成缓慢（取决于设备，一般要等几秒）
- 造成阻塞（增加 [TBT](https://web.dev/articles/tbt)，这是主要原因）

## [Lume Theme Shiraha](https://github.com/importantimport/lume_theme_shiraha)

好的，进入正题。这个项目能追溯到 2023 年 3 月，但进度缓慢——直到我用 UnoCSS 重写为止。

由于它的名字，很明显这是一个 Lume 主题，也是 Shiraha 的子项目。（虽然现在技术上已经和两版 Shiraha 关系不大了）

### Lume

> 非常好 SSG，插件丰富并且很现代。

不考虑 Astro（模板阴间）的情况下，Lume 就是我的首选 SSG。

也多亏了它的设计，我可以单独发布主题（而不是提供一个模板），这样用户可以方便更新。

~~如果你在 2024 年 1 月查看本站源码，就会发现只有 `_config.ts` 和 `serve.ts` 两个 TypeScript 文件~~

### Fast(est) JSX Template

重写之后，我选择了 TSX 作为模板。

那么用 React 还是 Preact 呢？我觉得都太重，所以... Hono JSX，就决定是你了！

它专为 SSG/SSR 场景准备，[比 React JSX 快五到七倍](https://github.com/honojs/hono/pull/1768)的同时体积很小。

```
> esbuild --bundle src/benchmark.ts | node
Hono x 437,736 ops/sec ±0.25% (95 runs sampled)
React x 56,216 ops/sec ±1.09% (99 runs sampled)
Preact x 266,304 ops/sec ±0.21% (98 runs sampled)
Nano x 60,715 ops/sec ±0.21% (98 runs sampled)
Fastest is Hono
```

与此同时，我还用上了 Deno 的 [Fast(est) JSX Transform](https://deno.com/blog/v1.38#fastest-jsx-transform)。

由于 Hono JSX 已经适配，只需要将 `compilerOptions.jsx` 改为 `precompile` 即可启用。

你可以在 [lume_theme_shiraha/plugins/lts/jsx.ts](https://github.com/importantimport/lume_theme_shiraha/blob/main/plugins/lts/jsx.ts) 找到这个插件的源码，我还针对 slot 做了一些特殊优化：

```ts
if (typeof content === 'string')
  content = jsx('script', {
    dangerouslySetInnerHTML: { __html: `</script>${content}<script>` },
  })

if (typeof children === 'string')
  children = jsx('script', {
    dangerouslySetInnerHTML: { __html: `</script>${children}<script>` },
  })

site.process(['.html'], (pages) =>
  pages.forEach(
    (page) =>
      (page.content = (page.content as string).replaceAll(
        '<script></script>',
        ''
      ))
  )
)
```

没错，它会生成 `<script></script>${content}<script></script>{:jsx}`，然后我再在构建时把所有 `<script></script>` 删除，这样就没有空 div 影响样式了。

### View Transitions

原生页面过渡，终于来了！

我基本上是直接用它默认的动画效果，因为省事并且看起来不错。

首先，需要在 html head 加一个 meta，以允许同源 View Transition：

```html
<meta content="same-origin" name="view-transition" />
```

然后将不同页面中相同组件的 `view-transition-name` 值匹配，由于 ID 必须是唯一的，这里我写了个插件把 `github-slugger` 注入到 `Lume.Helpers` 里。

```ts title="plugins/helpers/slug.ts"
import { slug } from 'npm:github-slugger@2.0.0'

export default () => (site: Lume.Site) =>
  site.helper('slug', slug, { type: 'tag' })

/** Extends Data interface */
declare global {
  namespace Lume {
    export interface Helpers {
      slug: typeof slug
    }
  }
}
```

然后在 JSX 模板中使用 slug 函数处理 url（此处仅为示意）：

```tsx
export default ({ results }: Lume.Data, { slug }: Lume.Helpers) => (
  <>
    {results?.map((result) => (
      <h2 style={`--name: article-title-${slug(data.url)}`}>
        {data.title}
      </h2>
    ))}
  </>
)
```

它设置了 `--name` 变量，还需要增加 CSS 以应用它。

```css
h2 {
  view-transition-name: var(--name);
}
```

基于 Chromium 的浏览器目前需要手动开启 [#view-transition-on-navigation](chrome://flags/#view-transition-on-navigation) 这个 flag 才能看到动画，希望能早点设为默认吧。

### (maybe) 最强大的 Markdown 语法高亮

这段就是专门吹 `rehype-pretty-code` 这个库的。到底有多强？看看[演示](https://rehype-pretty-code.netlify.app/)吧。

从 Urara 时期我就想用了，但受限于 MDsveX 只能自己手写 Shiki 转换。

LTS 早期 Deno 还没有支持 `npm:` 说明符，我从 esm.sh 导入它 oniguruma 会有问题从而用不了。

几个月后我再看，发现 `rehype-pretty-code` 居然基于 `shikiji` 了！

因为基于 shikiji，所以它的 [Twoslash](https://shikiji.netlify.app/packages/twoslash) 和其他 [Transformer](https://shikiji.netlify.app/packages/transformers) 也都可以用。（问题主要在于我的 CSS 没有适配，之后会更新）

> 先写到这里，之后再更新
