export default {
  logo: <span style={{ fontWeight: 700 }}>Aleo 中文文档</span>,
  project: {
    link: 'https://github.com/AleoHQ/Aleo-101-Bootcamp',
  },
  docsRepositoryBase: 'https://github.com/AleoHQ/Aleo-101-Bootcamp/tree/main/docs',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Aleo 中文文档',
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Aleo 中文文档 - 学习 Aleo 和 Leo 编程" />
    </>
  ),
  footer: {
    text: (
      <span>
        {new Date().getFullYear()} © Aleo 中文文档.
      </span>
    ),
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
}
