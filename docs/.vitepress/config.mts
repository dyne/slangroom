import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Slangroom",
  base: "/slangroom/",
	description: "🎮 Enhance zencode smart contracts with your slang ",

  head: [
		[
			'script',
			{
				async: '',
				type: "module",
				src: 'https://cdn.jsdelivr.net/npm/@dyne/components/dist/dyne-components/dyne-components.esm.js'
			}
		],
		[
			'link',
			{
				rel: "stylesheet",
				href: "https://cdn.jsdelivr.net/npm/@dyne/components/dist/dyne-components/dyne-components.css"
			}
		]
	],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Reference', link: '/statements/' },
      { text: 'Playground', link: '/playground/' },
    ],

    sidebar: [
      {
        text: 'Section title',
        items: [
          { text: 'Examples', link: '/examples/' },
          { text: 'API Reference', link: '/statements/' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://socials.dyne.org/github' },
      { icon: 'npm', link: 'https://www.npmjs.com/search?q=%40slangroom' },
      { icon: 'mastodon', link: 'https://socials.dyne.org/mastodon' },
    ]
  }
})
