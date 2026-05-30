const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
})

const isGithubActions = process.env.GITHUB_ACTIONS || false
const repo = 'Aleo-101-Bootcamp'
const defaultBasePath = isGithubActions ? `/${repo}` : ''
const basePath = process.env.BASE_PATH || defaultBasePath

module.exports = withNextra({
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
})
