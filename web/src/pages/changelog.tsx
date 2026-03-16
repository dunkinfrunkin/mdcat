import {type ReactNode, useState, useEffect} from 'react';
import Layout from '@theme/Layout';
import styles from './changelog.module.css';

const API_URL = 'https://api.github.com/repos/dunkinfrunkin/mdcat/releases?per_page=50';

interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
}

function parseMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/\n{2,}/g, '<br/>')
    .replace(/\n/g, '');
}

function ReleaseSkeleton() {
  return (
    <div className={styles.release}>
      <div className={styles.skeletonTag} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} style={{width: '60%'}} />
    </div>
  );
}

function ReleaseCard({release}: {release: Release}) {
  const date = new Date(release.published_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className={styles.release}>
      <div className={styles.releaseHeader}>
        <a href={release.html_url} target="_blank" rel="noopener noreferrer" className={styles.tag}>
          {release.tag_name}
        </a>
        <span className={styles.date}>{date}</span>
      </div>
      {release.name && release.name !== release.tag_name && (
        <div className={styles.releaseName}>{release.name}</div>
      )}
      {release.body && (
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{__html: parseMarkdown(release.body)}}
        />
      )}
    </div>
  );
}

export default function Changelog(): ReactNode {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(API_URL)
      .then(r => {
        if (!r.ok) throw new Error(`GitHub API returned ${r.status}`);
        return r.json();
      })
      .then((data: Release[]) => {
        setReleases(data.filter(r => !r.tag_name.includes('rc')));
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <Layout title="Changelog" description="mdcat release history">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Changelog</h1>
          <p className={styles.subtitle}>
            Release history pulled from{' '}
            <a href="https://github.com/dunkinfrunkin/mdcat/releases" target="_blank" rel="noopener noreferrer">
              GitHub Releases
            </a>
          </p>
        </div>

        <div className={styles.timeline}>
          {loading && [1, 2, 3].map(i => <ReleaseSkeleton key={i} />)}
          {error && <div className={styles.error}>Failed to load releases: {error}</div>}
          {releases.map(r => <ReleaseCard key={r.tag_name} release={r} />)}
        </div>
      </div>
    </Layout>
  );
}
