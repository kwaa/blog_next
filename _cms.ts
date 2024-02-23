import lumeCMS, { Fs } from 'lume/cms.ts'

const fs = new Fs({ root: Deno.cwd() + '/posts' })

export default lumeCMS({
  site: {
    name: './kwaa.dev/next',
    url: 'https://kwaa-blog-next.deno.dev',
  },
})
  .storage('fs', fs)
  .document('posts', 'src:posts/*.md', [
    'title: text',
    'tags: list',
    'content: markdown',
  ])
