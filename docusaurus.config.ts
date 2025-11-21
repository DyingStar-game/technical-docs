import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'DyingStar - Docs',
  tagline: 'Technical Documentation for DyingStar',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://developper.dyingstar-game.com/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'DyingStar-game',
  projectName: 'technical-docs',
  trailingSlash: true,

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },

  plugins: [
    [
      '@docusaurus/plugin-pwa',
      {
        debug: true,
        offlineModeActivationStrategies: [
          'appInstalled',
          'standalone',
          'queryString',
        ],
        pwaHead: [
          {
            tagName: 'link',
            rel: 'icon',
            href: '/img/logo.png',
          },
          {
            tagName: 'link',
            rel: 'manifest',
            href: '/manifest.json', // your PWA manifest
          },
          {
            tagName: 'meta',
            name: 'theme-color',
            content: '#ffba08',
          },
        ],
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/DyingStar-game/technical-docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    // image: 'img/docusaurus-social-card.jpg',
    metadata: [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'img/logo.png' },
      { name: 'twitter:title', content: 'DyingStar - Technical Docs' },
      {
        name: 'twitter:description',
        content: 'Technical Documentation for DyingStar',
      },
      { name: 'twitter:url', content: 'https://docs.dyingstar-game.com' },
      { name: 'twitter:creator', content: '@DyingStar-game' },
      { name: 'twitter:site', content: '@DyingStar-game' },
      { name: 'twitter:domain', content: 'docs.dyingstar-game.com' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: 'img/logo.png' },
      { name: 'twitter:title', content: 'DyingStar - Technical Docs' },
      {
        name: 'twitter:description',
        content: 'Technical Documentation for DyingStar',
      },
      { name: 'twitter:url', content: 'https://docs.dyingstar-game.com' },
      { name: 'twitter:creator', content: '@DyingStar-game' },
      { name: 'twitter:site', content: '@DyingStar-game' },
      { name: 'twitter:domain', content: 'docs.dyingstar-game.com' },
      { name: 'og:image', content: 'img/logo.png' },
      { name: 'og:title', content: 'DyingStar - Technical Docs' },
      {
        name: 'og:description',
        content: 'Technical Documentation for DyingStar',
      },
      { name: 'og:url', content: 'https://docs.dyingstar-game.com' },
      { name: 'og:site_name', content: 'DyingStar - Technical Docs' },
      { name: 'og:type', content: 'website' },
      { name: 'og:locale', content: 'en_US' },
      { name: 'og:locale:alternate', content: 'en_US' },
    ],
    // announcementBar: {
    //   content:
    //     'We are looking to revamp our docs, please fill <a target="_blank" rel="noopener noreferrer" href="#">this survey</a>',
    //   backgroundColor: '#fafbfc',
    //   textColor: '#091E42',
    //   isCloseable: false,
    // },
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'DyingStar - Technical Docs',
      logo: {
        alt: 'DyingStar - Technical Docs Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'projectSidebar',
          position: 'left',
          label: 'Project',
        },
        {
          type: 'docSidebar',
          sidebarId: 'webSidebar',
          position: 'left',
          label: 'Web',
        },
        {
          type: 'docSidebar',
          sidebarId: 'networkGameSidebar',
          position: 'left',
          label: 'Network Game',
        },
        {
          type: 'docSidebar',
          sidebarId: 'planetTechSidebar',
          position: 'left',
          label: 'Planet Tech',
        },
        {
          type: 'docSidebar',
          sidebarId: 'narrativeDesignSidebar',
          position: 'left',
          label: 'Narrative Design',
        },
        {
          type: 'docSidebar',
          sidebarId: 'gameDesignSidebar',
          position: 'left',
          label: 'Game Design',
        },
        {
          type: 'docSidebar',
          sidebarId: 'creativeConceptSidebar',
          position: 'left',
          label: 'Creative Concept',
        },
        {
          type: 'docSidebar',
          sidebarId: 'uiuxSidebar',
          position: 'left',
          label: 'UI/UX',
        },
        {
          type: 'docSidebar',
          sidebarId: 'audioSidebar',
          position: 'left',
          label: 'Audio',
        },
        {
          type: 'docSidebar',
          sidebarId: 'vFXSidebar',
          position: 'left',
          label: 'VFX',
        },
        {
          type: 'docSidebar',
          sidebarId: 'qaPlayTestSidebar',
          position: 'left',
          label: 'QA & PlayTest',
        },
        {
          type: 'docSidebar',
          sidebarId: 'cutsceneVideoSidebar',
          position: 'left',
          label: 'Cutscene & Video',
        },
        //TODO: Uncomment this when we have multiple versions
        // {
        //   type: 'docsVersionDropdown',
        //   position: 'right',
        // },
        {
          href: 'https://dyingstar-game.com',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://github.com/DyingStar-game',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Project',
              to: '/docs/project/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/t4ybBPwHaH  ',
            },
            {
              label: 'Twitter',
              href: 'https://x.com/DyingStar_Game',
            },
            {
              label: 'Youtube',
              href: 'https://youtube.com/@dyingstar-game',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Website',
              href: 'https://dyingstar-game.com',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/DyingStar-game',
            },
          ],
        },
      ],
      copyright: `Technical Documentation for DyingStar from 2025-07 to ${new Date().getFullYear()}-${
        new Date().getMonth() + 1
      }`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
