---
title: Hello, World!
---

Hello, World!

这是一篇测试文章。

<script type="module">
  import 'https://esm.sh/@kkna/component-material'
  import { hatsu } from 'https://esm.sh/@kkna/preset-hatsu'
  import 'kkna' import { defineConfig } from 'https://esm.sh/@kkna/context'
  defineConfig({
    presets: [
      hatsu({ instance: 'https://hatsu-nightly-debug.hyp3r.link' }),
    ],
  })
</script>
<kkna-material></kkna-material>
