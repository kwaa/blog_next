---
title: Hello, World!
---

Hello, World!

这是一篇测试文章。

<script type="module">
  import { hatsu } from 'https://esm.sh/@kkna/preset-hatsu'
  import { defineConfig } from 'https://esm.sh/@kkna/context'
  defineConfig({
    presets: [
      hatsu({ instance: 'https://hatsu-nightly-debug.hyp3r.link' }),
    ],
  })
</script>
<script type="module" src="https://esm.sh/@kkna/component-material"></script>
<kkna-material></kkna-material>
