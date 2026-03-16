import {type ReactNode, useState, useEffect, useRef} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

/* ── Copy-to-clipboard install box ── */

function CopyBox({command, className}: {command: string; className?: string}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={clsx(styles.installBox, className)} onClick={copy} role="button" tabIndex={0}>
      <span className={styles.installPrompt}>$</span>
      <code className={styles.installCode}>{command}</code>
      <button className={styles.copyBtn} onClick={copy} aria-label="Copy to clipboard">
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        )}
      </button>
    </div>
  );
}

/* ── ASCII cat ── */

function AsciiCat({className}: {className?: string}) {
  return (
    <span className={clsx(styles.asciiCat, className)} aria-hidden>
      <span className={styles.catGray}>/\</span><span className={styles.catBlue}>(o.o)</span><span className={styles.catGray}>/\</span>
    </span>
  );
}

/* ── Terminal tab content panels ── */

function PanelHeadings() {
  return <>
    <div className={styles.tuiH1}>
      <span className={styles.h1Box}>╔═════════════════╗</span>
      <span className={styles.h1Box}>║&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;MDCAT&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;║</span>
      <span className={styles.h1Box}>╚═════════════════╝</span>
    </div>
    <div className={styles.tuiH2}><span className={styles.h2Text}>## Heading 2</span><br/><span className={styles.h2Bar}>──────────────────────</span></div>
    <div className={styles.tuiH3}>### Heading 3</div>
    <div className={styles.tuiH4}>#### Heading 4</div>
    <div className={styles.tuiH5}>##### Heading 5</div>
    <div className={styles.tuiPara}>
      <span className={styles.inlineBold}>bold</span>{'  '}
      <span className={styles.inlineItalic}>italic</span>{'  '}
      <span className={styles.inlineCode}>`code`</span>{'  '}
      <span className={styles.inlineStrike}>~~strike~~</span>
    </div>
  </>;
}

function PanelCode() {
  return <>
    <div className={styles.tuiH2}><span className={styles.h2Text}>Code blocks</span><br/><span className={styles.h2Bar}>──────────────────────</span></div>
    <div className={styles.tuiCodeTop}>┌─ <span className={styles.codeLang}>javascript</span> ────────┐</div>
    <div className={styles.tuiCodeLine}>│ <span className={styles.codeKw}>const</span> <span className={styles.codeVar}>greet</span> <span className={styles.codePunct}>=</span> <span className={styles.codeStr}>'hello'</span></div>
    <div className={styles.tuiCodeLine}>│ <span className={styles.codeKw}>function</span> <span className={styles.codeFn}>run</span><span className={styles.codePunct}>()</span> {'{'}</div>
    <div className={styles.tuiCodeLine}>│&nbsp;&nbsp; console<span className={styles.codePunct}>.</span><span className={styles.codeFn}>log</span><span className={styles.codePunct}>(</span><span className={styles.codeVar}>greet</span><span className={styles.codePunct}>)</span></div>
    <div className={styles.tuiCodeLine}>│ {'}'}</div>
    <div className={styles.tuiCodeBot}>└───────────────────────┘</div>
    <br/>
    <div className={styles.tuiCodeTop}>┌─ <span className={styles.codeLang}>bash</span> ──────────────────┐</div>
    <div className={styles.tuiCodeLine}>│ <span className={styles.codePrompt}>$</span> <span className={styles.codeText}>npm i -g @dunkinfrunkin/mdcat</span></div>
    <div className={styles.tuiCodeBot}>└───────────────────────────────┘</div>
  </>;
}

function PanelTable() {
  return <>
    <div className={styles.tuiH2}><span className={styles.h2Text}>Tables</span><br/><span className={styles.h2Bar}>──────────────────────</span></div>
    <div className={styles.tuiTable}>
      <div className={styles.tuiTableRow + ' ' + styles.tuiTableHead}>
        <span className={styles.tuiTh}>╔══════════╦═════════╦═══════╗</span>
      </div>
      <div className={styles.tuiTableRow + ' ' + styles.tuiTableHead}>
        <span className={styles.tuiTh}>║ <span className={styles.tuiThText}>Name</span>     ║ <span className={styles.tuiThText}>Type</span>    ║ <span className={styles.tuiThText}>Size</span> ║</span>
      </div>
      <div className={styles.tuiTableRow}><span className={styles.tuiBorder}>╠══════════╬═════════╬═══════╣</span></div>
      <div className={styles.tuiTableRow}><span className={styles.tuiTd}>║ cli.js   ║ <span className={styles.tuiGreen}>module</span>  ║ <span className={styles.tuiBlue}>1.6kB</span> ║</span></div>
      <div className={styles.tuiTableRow}><span className={styles.tuiTd}>║ render.js║ <span className={styles.tuiGreen}>module</span>  ║ <span className={styles.tuiBlue}>16kB</span>  ║</span></div>
      <div className={styles.tuiTableRow}><span className={styles.tuiTd}>║ tui.js   ║ <span className={styles.tuiGreen}>module</span>  ║ <span className={styles.tuiBlue}>13kB</span>  ║</span></div>
      <div className={styles.tuiTableRow}><span className={styles.tuiBorder}>╚══════════╩═════════╩═══════╝</span></div>
    </div>
  </>;
}

function PanelLists() {
  return <>
    <div className={styles.tuiH2}><span className={styles.h2Text}>Lists &amp; tasks</span><br/><span className={styles.h2Bar}>──────────────────────</span></div>
    <div className={styles.tuiList}>
      <div><span className={styles.bullet1}>●</span> Unordered item</div>
      <div>&nbsp;&nbsp;<span className={styles.bullet2}>○</span> Nested item</div>
      <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.bullet3}>‣</span> Deeply nested</div>
    </div>
    <div className={styles.tuiHr}>──────────────────────────────────</div>
    <div className={styles.tuiList}>
      <div><span className={styles.tuiCheck}>☑</span> <span className={styles.tuiCheckDone}>Ship mdcat v1.0</span></div>
      <div><span className={styles.tuiCheck}>☑</span> <span className={styles.tuiCheckDone}>Add search</span></div>
      <div><span className={styles.tuiUncheck}>☐</span> World domination</div>
    </div>
    <div className={styles.tuiHr}>──────────────────────────────────</div>
    <div className={styles.tuiList}>
      <div><span className={styles.tuiOl}>1.</span> First item</div>
      <div><span className={styles.tuiOl}>2.</span> Second item</div>
      <div><span className={styles.tuiOl}>3.</span> Third item</div>
    </div>
  </>;
}

/* ── Terminal mockup ── */

const DEMO_TABS = [
  {label: 'headings', file: 'headings.md', Panel: PanelHeadings},
  {label: 'code',     file: 'code.md',     Panel: PanelCode},
  {label: 'tables',   file: 'table.md',    Panel: PanelTable},
  {label: 'lists',    file: 'lists.md',    Panel: PanelLists},
];

function TerminalDemo() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!pauseRef.current) {
        setActive(i => (i + 1) % DEMO_TABS.length);
      }
    }, 2800);
    return () => clearInterval(id);
  }, []);

  function pick(i: number) {
    setActive(i);
    setPaused(true);
    pauseRef.current = true;
  }

  const {file, Panel} = DEMO_TABS[active];

  return (
    <div className={styles.terminal}>
      <div className={styles.terminalBar}>
        <span className={styles.terminalDot} style={{background: '#e06c75'}} />
        <span className={styles.terminalDot} style={{background: '#e5c07b'}} />
        <span className={styles.terminalDot} style={{background: '#98c379'}} />
        <div className={styles.demoTabs}>
          {DEMO_TABS.map((t, i) => (
            <button key={t.label}
              className={clsx(styles.demoTab, i === active && styles.demoTabActive)}
              onClick={() => pick(i)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.terminalChrome}>
        <span className={styles.tcFile}>{file}</span>
        <span className={styles.tcCat}>/\<span className={styles.catBlue}>(o.o)</span>/\</span>
        <span className={styles.tcApp}>mdcat</span>
      </div>
      <div key={active} className={styles.terminalBody}>
        <Panel />
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
    title: 'Light & dark themes',
    desc: 'Auto-detects your terminal background. One Dark for dark terminals, One Light for light ones. Override with --light or --dark.',
    code: 'mdcat README.md          # auto\nmdcat --light README.md  # force\nMDCAT_THEME=dark mdcat …',
  },
  {
    title: 'Incremental search',
    desc: 'Press / to search. Matches highlight live with gold gutter markers. n / N to cycle.',
    code: 'Press /  to enter search\nType to filter in real time\nn / N  to jump between hits',
  },
  {
    title: 'Keyboard-driven',
    desc: 'Familiar vi-style bindings. j/k, space/b, g/G — zero learning curve if you know less.',
    code: 'j / k     scroll line\nspace / b  page down/up\ng / G     top / bottom',
  },
  {
    title: 'Mouse wheel',
    desc: 'Scroll naturally with your mouse wheel. Three lines per tick using SGR mouse mode.',
    code: 'Scroll ↑   offset -= 3\nScroll ↓   offset += 3',
  },
  {
    title: 'Clickable links',
    desc: 'OSC 8 hyperlinks work in iTerm2, Kitty, WezTerm, foot, and Ghostty.',
    code: '[link text](https://example.com)\n→ blue underline, clickable',
  },
  {
    title: 'Plain text output',
    desc: 'Use -p / --plain to strip all ANSI styling and skip the TUI. Perfect for piping to grep, pbcopy, or other tools.',
    code: 'mdcat -p README.md | grep install\nmdcat --plain NOTES.md | pbcopy',
  },
  {
    title: 'Git diff gutter',
    desc: 'See which lines changed at a glance. Green + for added, yellow ~ for modified, red - for deleted. Works automatically in git repos.',
    code: '+ added line\n~ modified line\n- deleted line',
  },
  {
    title: 'Zero config',
    desc: 'No config files, no env vars, no setup. Pipe or open — it just works.',
    code: 'npx @dunkinfrunkin/mdcat file.md\ncurl … | npx @dunkinfrunkin/mdcat',
  },
];

/* ── Keyboard shortcuts ── */

const KEYS = [
  {key: 'q', action: 'Quit'},
  {key: 'y', action: 'Copy visible page to clipboard'},
  {key: 'L', action: 'Toggle line numbers'},
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
    <div className={styles.pageWrap}>

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
              <CopyBox command="npm i -g @dunkinfrunkin/mdcat" />
              <span className={styles.installOr}>or</span>
              <CopyBox command="brew install dunkinfrunkin/tap/mdcat" />
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
            <div className={styles.heroVideo}>
              <div className={styles.terminalBar}>
                <span className={styles.terminalDot} style={{background: '#e06c75'}} />
                <span className={styles.terminalDot} style={{background: '#e5c07b'}} />
                <span className={styles.terminalDot} style={{background: '#98c379'}} />
                <span className={styles.terminalTitle}>mdcat README.md</span>
              </div>
              <video
                src="https://github.com/dunkinfrunkin/mdcat/releases/download/v0.1.2/demo.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

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
                <div className={styles.featureTitle}>{f.title}</div>
                <p className={styles.featureDesc}>{f.desc}</p>
                <pre className={styles.featureCode}>{f.code}</pre>
              </div>
            ))}
          </div>
        </div>
      </section>


      <div className={styles.divider} />

      {/* ── Browser mode ── */}
      <section className={styles.browserSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionCaret}>$</span>
            <Heading as="h2" className={styles.sectionTitle}>Open in your browser</Heading>
            <p className={styles.sectionSubtitle}>
              Prefer a browser? Use the <code>--web</code> flag to render your Markdown as a styled HTML page and open it instantly.
            </p>
          </div>
          <div className={styles.browserDemo}>
            <div className={styles.browserInstallRow}>
              <CopyBox command="mdcat --web README.md" />
            </div>
            <div className={styles.browserMockup}>
              <div className={styles.browserBar}>
                <span className={styles.terminalDot} style={{background: '#e06c75'}} />
                <span className={styles.terminalDot} style={{background: '#e5c07b'}} />
                <span className={styles.terminalDot} style={{background: '#98c379'}} />
                <div className={styles.browserUrlBar}>
                  <span className={styles.browserUrl}>localhost:3000/README.md</span>
                </div>
              </div>
              <div className={styles.browserBody}>
                <div className={styles.browserContent}>
                  <div className={styles.browserH1}>mdcat <span style={{opacity: 0.5}}>/\(o.o)/\</span></div>
                  <p className={styles.browserMeta}>
                    <span className={styles.browserBadge}>npm</span>
                    <span className={styles.browserBadge}>MIT</span>
                    <span className={styles.browserBadge}>node ≥18</span>
                  </p>
                  <p className={styles.browserPara}><strong>Terminal pager for Markdown.</strong> Full colour, syntax highlighting, incremental search, mouse support — zero config.</p>
                  <div className={styles.browserCodeBlock}>
                    npm install -g @dunkinfrunkin/mdcat
                  </div>
                  <div className={styles.browserH2}>Install</div>
                  <div className={styles.browserCodeBlock}>
                    {'# npm\n'}npm install -g @dunkinfrunkin/mdcat{'\n\n'}{'# Homebrew\n'}brew install dunkinfrunkin/tap/mdcat
                  </div>
                  <div className={styles.browserH2}>Usage</div>
                  <div className={styles.browserCodeBlock}>
                    mdcat README.md{'          '}# open a file{'\n'}mdcat --web README.md{'    '}# render &amp; open in browser
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

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

      <div className={styles.divider} />

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <Heading as="h2" className={styles.ctaTitle}>
            Try it <span className={styles.heroGradient}>right now</span>
          </Heading>
          <p className={styles.ctaSubtitle}>
            No install required. Just paste this into your terminal.
          </p>
          <CopyBox command="npm i -g @dunkinfrunkin/mdcat" className={styles.ctaBox} />
          <span className={styles.installOr}>or</span>
          <CopyBox command="brew install dunkinfrunkin/tap/mdcat" className={styles.ctaBox} />
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

      <div className={styles.divider} />

      {/* ── Follow ── */}
      <section className={styles.followSection}>
        <div className={styles.followInner}>
          <Heading as="h2" className={styles.followTitle}>Follow me</Heading>
          <div className={styles.followLinks}>
            <a href="https://github.com/dunkinfrunkin" target="_blank" rel="noopener noreferrer" className={styles.followLink}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>
            <a href="https://x.com/dunkinfrunkin" target="_blank" rel="noopener noreferrer" className={styles.followLink}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span>X</span>
            </a>
            <a href="https://www.linkedin.com/in/dunkinfrunkin/" target="_blank" rel="noopener noreferrer" className={styles.followLink}>
              <svg viewBox="0 0 24 24" width="23" height="23" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </section>

    </div>
    </Layout>
  );
}
