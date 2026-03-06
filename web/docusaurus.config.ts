import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'mdcat',
  tagline: 'View markdown files beautifully in your terminal.',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://mdcat.frankchan.dev',
  baseUrl: '/',

  organizationName: 'dunkinfrunkin',
  projectName: 'mdcat',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: false,
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'mdcat',
      logo: {
        alt: 'mdcat',
        src: 'img/favicon.svg',
        width: 28,
        height: 28,
      },
      items: [
        {
          href: 'https://github.com/dunkinfrunkin/mdcat',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/@dunkinfrunkin/mdcat',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Install',
          items: [
            {label: 'npx (zero-install)', href: 'https://www.npmjs.com/package/@dunkinfrunkin/mdcat'},
            {label: 'npm global', href: 'https://www.npmjs.com/package/@dunkinfrunkin/mdcat'},
            {label: 'Homebrew', href: 'https://github.com/dunkinfrunkin/homebrew-tap'},
          ],
        },
        {
          title: 'Source',
          items: [
            {label: 'GitHub', href: 'https://github.com/dunkinfrunkin/mdcat'},
            {label: 'Issues', href: 'https://github.com/dunkinfrunkin/mdcat/issues'},
            {label: 'Releases', href: 'https://github.com/dunkinfrunkin/mdcat/releases'},
            {label: 'npm', href: 'https://www.npmjs.com/package/@dunkinfrunkin/mdcat'},
          ],
        },
      ],
      copyright: `MIT License · © ${new Date().getFullYear()} Frank Chan`,
    },
    prism: {
      theme: prismThemes.oneDark,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
