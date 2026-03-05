import {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

/* ── ASCII cat ── */

function AsciiCat({className}: {className?: string}) {
  return (
    <span className={clsx(styles.asciiCat, className)} aria-hidden>
      <span className={styles.catGray}>/\</span><span className={styles.catBlue}>(o.o)</span><span className={styles.catGray}>/\</span>
    </span>
  );
}

/* ── Terminal mockup ── */

function TerminalDemo() {
  return (
    <div className={styles.terminal}>
      <div className={styles.terminalBar}>
        <span className={styles.terminalDot} style={{background: '#e06c75'}} />
        <span className={styles.terminalDot} style={{background: '#e5c07b'}} />
        <span className={styles.terminalDot} style={{background: '#98c379'}} />
        <span className={styles.terminalTitle}>mdcat — README.md</span>
      </div>
      <div className={styles.terminalChrome}>
        <span className={styles.tcBadge}>[md]</span>
        <span className={styles.tcFile}>README.md</span>
        <span className={styles.tcCat}>/\<span className={styles.catBlue}>(o.o)</span>/\</span>
        <span className={styles.tcApp}>mdcat</span>
      </div>
      <div className={styles.terminalBody}>
        <div className={styles.tuiH1}>
          <span className={styles.h1Box}>╔══════════════════╗</span>
          <span className={styles.h1Box}>║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;MDCAT&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║</span>
          <span className={styles.h1Box}>╚══════════════════╝</span>
        </div>
        <div className={styles.tuiPara}>
          View markdown files beautifully
          <br />in your terminal.
        </div>
        <div className={styles.tuiH2}>
          <span className={styles.h2Text}>Features</span>
          <br />
          <span className={styles.h2Bar}>──────────────────────────</span>
        </div>
        <div className={styles.tuiList}>
          <div><span className={styles.bullet1}>●</span> Zero configuration</div>
          <div><span className={styles.bullet2}>○</span> One Dark colour palette</div>
          <div><span className={styles.bullet3}>‣</span> Incremental search <span className={styles.kbd}>/</span></div>
          <div><span className={styles.bullet1}>●</span> Mouse wheel scrolling</div>
          <div><span className={styles.bullet2}>○</span> OSC 8 clickable links</div>
          <div><span className={styles.bullet3}>‣</span> GFM tables &amp; task lists</div>
        </div>
        <div className={styles.tuiHr}>──────────────────────────────────</div>
        <div className={styles.tuiCodeTop}>┌─ <span className={styles.codeLang}>bash</span> ──────────────────┐</div>
        <div className={styles.tuiCodeLine}>│ <span className={styles.codePrompt}>$</span> <span className={styles.codeText}>npx @dunkinfrunkin/mdcat README.md</span></div>
        <div className={styles.tuiCodeBot}>└───────────────────────────────────┘</div>
      </div>
      <div className={styles.terminalStatus}>
        <span className={styles.tsHints}> q&nbsp;&nbsp;/&nbsp;&nbsp;j k&nbsp;&nbsp;↑↓&nbsp;&nbsp;space&nbsp;&nbsp;g G</span>
        <span className={styles.tsPct}>42%</span>
      </div>
    </div>
  );
}

/* ── Features ── */

const FEATURES = [
  {
    icon: '🎨',
    title: 'One Dark palette',
    desc: 'Easy on the eyes in any dark terminal. Consistent colors for every Markdown element.',
    code: '# Heading\n**bold** _italic_ `code`\n> blockquote',
  },
  {
    icon: '🔍',
    title: 'Incremental search',
    desc: 'Press / to search. Matches highlight live with gold gutter markers. n / N to cycle.',
    code: 'Press /  to enter search\nType to filter in real time\nn / N  to jump between hits',
  },
  {
    icon: '⌨️',
    title: 'Keyboard-driven',
    desc: 'Familiar vi-style bindings. j/k, space/b, g/G — zero learning curve if you know less.',
    code: 'j / k     scroll line\nspace / b  page down/up\ng / G     top / bottom',
  },
  {
    icon: '🖱️',
    title: 'Mouse wheel',
    desc: 'Scroll naturally with your mouse wheel. Three lines per tick using SGR mouse mode.',
    code: 'Scroll ↑   offset -= 3\nScroll ↓   offset += 3',
  },
  {
    icon: '🔗',
    title: 'Clickable links',
    desc: 'OSC 8 hyperlinks work in iTerm2, Kitty, WezTerm, foot, and Ghostty.',
    code: '[link text](https://example.com)\n→ blue underline, clickable',
  },
  {
    icon: '📦',
    title: 'Zero config',
    desc: 'No config files, no env vars, no setup. Pipe or open — it just works.',
    code: 'npx @dunkinfrunkin/mdcat file.md\ncurl … | npx @dunkinfrunkin/mdcat',
  },
];

/* ── Keyboard shortcuts ── */

const KEYS = [
  {key: 'q', action: 'Quit'},
  {key: 'y', action: 'Copy visible page to clipboard'},
  {key: 'M', action: 'Toggle mouse (off = free text selection)'},
  {key: 'j / k', action: 'Scroll down / up one line'},
  {key: '↑ / ↓', action: 'Scroll up / down one line'},
  {key: 'Space / b', action: 'Page down / page up'},
  {key: 'd / u', action: 'Half-page down / up'},
  {key: 'g / G', action: 'Jump to top / bottom'},
  {key: '/', action: 'Enter search mode'},
  {key: 'n / N', action: 'Next / previous match'},
  {key: 'Esc', action: 'Cancel search or clear matches'},
  {key: 'Mouse wheel', action: 'Scroll up / down three lines'},
];

/* ── Page ── */

export default function Home(): ReactNode {
  return (
    <Layout title="mdcat — markdown pager for your terminal" description="View markdown files beautifully in your terminal. Zero config, One Dark colours, incremental search, mouse support.">

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroInner}>
          <div className={styles.heroLeft}>
            <div className={styles.heroCatRow}>
              <AsciiCat />
              <div className={styles.heroBadge}>
                <span className={styles.heroBadgeText}>terminal · markdown · pager</span>
              </div>
            </div>
            <Heading as="h1" className={styles.heroTitle}>
              <span className={styles.heroGradient}>mdcat</span>
            </Heading>
            <p className={styles.heroTagline}>
              Render Markdown beautifully in your terminal.<br />
              Full colour, syntax highlighting, search, and mouse — zero config.
            </p>

            <div className={styles.heroInstall}>
              <div className={styles.installBox}>
                <span className={styles.installPrompt}>$</span>
                <code className={styles.installCode}>npm i -g @dunkinfrunkin/mdcat</code>
              </div>
            </div>

            <div className={styles.heroButtons}>
              <Link className={clsx('button button--primary button--md', styles.heroPrimary)}
                to="https://github.com/dunkinfrunkin/mdcat">
                GitHub
              </Link>
              <Link className={clsx('button button--secondary button--md', styles.heroSecondary)}
                to="https://www.npmjs.com/package/@dunkinfrunkin/mdcat">
                npm
              </Link>
            </div>
          </div>

          <div className={styles.heroRight}>
            <TerminalDemo />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCaret}>$</span>
            <Heading as="h2" className={styles.sectionTitle}>Everything you need</Heading>
            <p className={styles.sectionSubtitle}>
              All GitHub-Flavoured Markdown rendered with care. Nothing to configure.
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div className={styles.featureTitle}>{f.title}</div>
                <p className={styles.featureDesc}>{f.desc}</p>
                <pre className={styles.featureCode}>{f.code}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Keyboard shortcuts ── */}
      <section className={styles.keyboard}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCaret}>$</span>
            <Heading as="h2" className={styles.sectionTitle}>Keyboard shortcuts</Heading>
            <p className={styles.sectionSubtitle}>
              vi-style bindings. Familiar if you know <code>less</code> or <code>vim</code>.
            </p>
          </div>
          <div className={styles.keyGrid}>
            {KEYS.map(k => (
              <div key={k.key} className={styles.keyRow}>
                <div className={styles.keyBadge}>
                  {k.key.split(' / ').map((part, i) => (
                    <span key={i}>
                      {i > 0 && <span className={styles.keySep}> / </span>}
                      <kbd className={styles.kbdKey}>{part}</kbd>
                    </span>
                  ))}
                </div>
                <div className={styles.keyAction}>{k.action}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <Heading as="h2" className={styles.ctaTitle}>
            Try it <span className={styles.heroGradient}>right now</span>
          </Heading>
          <p className={styles.ctaSubtitle}>
            No install required. Just paste this into your terminal.
          </p>
          <div className={styles.ctaBox}>
            <span className={styles.installPrompt}>$</span>
            <code className={styles.installCode}>npm i -g @dunkinfrunkin/mdcat</code>
          </div>
          <div className={styles.ctaButtons}>
            <Link className={clsx('button button--primary button--lg', styles.heroPrimary)}
              to="https://github.com/dunkinfrunkin/mdcat">
              View on GitHub
            </Link>
            <Link className={clsx('button button--secondary button--lg', styles.heroSecondary)}
              to="https://www.npmjs.com/package/@dunkinfrunkin/mdcat">
              npm package
            </Link>
          </div>
        </div>
      </section>

    </Layout>
  );
}
