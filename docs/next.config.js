const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})

const isGithubActions = process.env.GITHUB_ACTIONS || false
const repo = 'Aleo-101-Bootcamp'

module.exports = withNextra({
  output: 'export',
  basePath: isGithubActions ? `/${repo}` : '',
  images: {
    unoptimized: true,
  },
})
