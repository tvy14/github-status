import {
  escapeXml,
  formatBytesFromKB,
  formatDate,
  formatNumber,
  progressBar,
  svgDocument,
  text,
  truncate,
} from "./svg.js";

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, Number(value || 0)));
}

function easeOutCubic(value) {
  const t = clamp(value);
  return 1 - (1 - t) ** 3;
}

function metricProgress(animationProgress, index) {
  const start = 0.08 + index * 0.07;
  return easeOutCubic((animationProgress - start) / 0.58);
}

function formatAnimatedNumber(value, progress) {
  return formatNumber(Math.round(Number(value || 0) * clamp(progress)));
}

function scoreProfile(stats) {
  const contributions = stats.contributions?.totalContributions || 0;
  return (
    stats.totals.stars * 2 +
    stats.totals.forks * 3 +
    stats.owner.followers * 4 +
    contributions * 2 +
    stats.repositoryPolicy.selectedRepoCount * 5
  );
}

function profileGrade(stats) {
  const score = scoreProfile(stats);
  if (score >= 16000) return { label: "S", progress: 0.96 };
  if (score >= 8000) return { label: "A++", progress: 0.88 };
  if (score >= 4500) return { label: "A+", progress: 0.8 };
  if (score >= 2200) return { label: "A", progress: 0.72 };
  if (score >= 900) return { label: "B+", progress: 0.62 };
  return { label: "B", progress: 0.54 };
}

function iconPath(name) {
  const paths = {
    star: '<path d="M7 1.4 8.9 5.1l4.1.6-3 2.9.7 4.1L7 10.8 3.3 12.7l.7-4.1-3-2.9 4.1-.6L7 1.4Z"/>',
    fork: '<circle cx="4" cy="3.2" r="1.6"/><circle cx="10" cy="3.2" r="1.6"/><circle cx="7" cy="11" r="1.6"/><path d="M4 4.8v1.7c0 1.5 1.2 2.7 2.7 2.7H7M10 4.8v1.7c0 1.5-1.2 2.7-2.7 2.7H7"/>',
    issue: '<circle cx="7" cy="7" r="5.4"/><path d="M7 3.8v4.2"/><path d="M7 10.4h.1"/>',
    users: '<circle cx="5.2" cy="4.7" r="2.1"/><path d="M1.8 12c.5-2 1.7-3.1 3.4-3.1 1.8 0 3 1.1 3.4 3.1"/><circle cx="10.3" cy="5.6" r="1.6"/><path d="M9.6 9.1c1.4.1 2.3 1 2.7 2.7"/>',
    pulse: '<path d="M1.5 8h2.2l1.2-4.5 2.2 7.3 1.5-5h3.9"/>',
    repo: '<rect x="2.5" y="1.8" width="9" height="10.4" rx="1.3"/><path d="M5 4.2h4"/><path d="M5 6.7h4"/><path d="M5 9.2h2.4"/>',
  };
  return paths[name] || paths.star;
}

function icon(name, x, y) {
  return `<g transform="translate(${x} ${y})" stroke="#0969da" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">${iconPath(name)}</g>`;
}

function statRow({ name, label, value, x, y, index, animationProgress }) {
  const progress = metricProgress(animationProgress, index);
  const opacity = (0.38 + progress * 0.62).toFixed(2);

  return `
    <g opacity="${opacity}">
      ${icon(name, x, y - 11)}
      ${text(x + 25, y, label, "stat-label")}
      ${text(x + 218, y, formatAnimatedNumber(value, progress), "stat-value", 'text-anchor="end"')}
    </g>`;
}

export function renderStatsCard(stats, options = {}) {
  const width = 560;
  const height = 286;
  const animationProgress = options.animationProgress == null ? 1 : clamp(options.animationProgress);
  const ownerName = stats.owner.displayName || stats.owner.login;
  const title = `${ownerName}'s GitHub Stats`;
  const subtitle = `@${stats.owner.login} · updated ${formatDate(stats.generatedAt)}`;
  const latestPush = formatDate(stats.totals.latestPushAt);
  const contributionLabel = stats.contributions ? `Contributions ${stats.contributions.year}` : "Contributions";
  const contributionTotal = stats.contributions?.totalContributions || 0;
  const grade = profileGrade(stats);
  const ringProgress = grade.progress * easeOutCubic((animationProgress - 0.08) / 0.74);
  const ringX = 436;
  const ringY = 128;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ringProgress);

  const rows = [
    { name: "star", label: "Total Stars", value: stats.totals.stars },
    { name: "fork", label: "Total Forks", value: stats.totals.forks },
    { name: "issue", label: "Open Issues", value: stats.totals.openIssues },
    { name: "users", label: "Followers", value: stats.owner.followers },
    { name: "pulse", label: contributionLabel, value: contributionTotal },
    { name: "repo", label: "Selected Repos", value: stats.repositoryPolicy.selectedRepoCount },
  ];

  const children = `
    ${text(28, 38, title, "title")}
    ${text(28, 60, subtitle, "subtitle")}

    ${rows.map((row, index) => statRow({ ...row, x: 32, y: 94 + index * 26, index, animationProgress })).join("\n")}

    <circle cx="${ringX}" cy="${ringY}" r="${radius}" stroke="#d8dee4" stroke-width="8"/>
    <circle cx="${ringX}" cy="${ringY}" r="${radius}" stroke="#0969da" stroke-width="8" stroke-linecap="round"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"
      transform="rotate(-90 ${ringX} ${ringY})"/>
    ${text(ringX, ringY + 9, grade.label, "grade", 'text-anchor="middle"')}
    ${text(ringX, ringY + radius + 29, "PROFILE GRADE", "grade-caption", 'text-anchor="middle"')}

    ${text(328, 244, `Latest push ${latestPush}`, "footer")}
    ${text(28, 264, `Source repos: ${formatNumber(stats.repositoryPolicy.sourceRepoCount)} · forked repos: ${formatNumber(stats.repositoryPolicy.forkedRepoCount)} · storage: ${formatBytesFromKB(stats.totals.sizeKB)}`, "footer")}
  `;

  return svgDocument({ width, height, children, label: title });
}

export function renderLanguagesCard(stats) {
  const width = 560;
  const rowHeight = 29;
  const height = 92 + Math.max(1, stats.languages.length) * rowHeight;
  const ownerName = stats.owner.displayName || stats.owner.login;
  const title = `${ownerName}'s Top Languages`;
  const subtitle = `Detailed language bytes from ${stats.repositoryPolicy.selectedRepoCount} selected repositories`;

  const rows = stats.languages.length
    ? stats.languages
        .map((language, index) => {
          const y = 93 + index * rowHeight;
          return `
            ${text(28, y, truncate(language.name, 22), "label")}
            ${progressBar({ x: 185, y: y - 10, width: 290, percent: language.percent })}
            ${text(490, y, `${language.percent.toFixed(1)}%`, "small")}
          `;
        })
        .join("\n")
    : text(28, 95, "No language data available", "label");

  const children = `
    ${text(28, 38, title, "title")}
    ${text(28, 60, subtitle, "subtitle")}
    ${rows}
  `;

  return svgDocument({ width, height, children, label: title });
}

export function renderTopReposCard(stats) {
  const width = 560;
  const rowHeight = 55;
  const height = 92 + Math.max(1, stats.topRepos.length) * rowHeight;
  const ownerName = stats.owner.displayName || stats.owner.login;
  const title = `${ownerName}'s Top Repositories`;
  const subtitle = "Ranked by stars, forks, watchers, and recent activity";

  const rows = stats.topRepos.length
    ? stats.topRepos
        .map((repo, index) => {
          const y = 100 + index * rowHeight;
          const badges = [
            repo.language ? repo.language : "Unknown",
            `★ ${formatNumber(repo.stars)}`,
            `⑂ ${formatNumber(repo.forks)}`,
            repo.archived ? "archived" : "active",
          ].join(" · ");
          return `
            ${text(28, y, truncate(repo.name, 36), "repo")}
            ${text(28, y + 21, truncate(repo.description || badges, 72), "desc")}
            ${text(28, y + 39, badges, "small")}
          `;
        })
        .join("\n")
    : text(28, 95, "No repositories available", "label");

  const children = `
    ${text(28, 38, title, "title")}
    ${text(28, 60, subtitle, "subtitle")}
    ${rows}
  `;

  return svgDocument({ width, height, children, label: title });
}

export function renderSummaryMarkdown(stats) {
  const lines = [
    `# Generated GitHub stats for ${stats.owner.login}`,
    "",
    `Generated at: ${stats.generatedAt}`,
    "",
    `- Selected repositories: ${stats.repositoryPolicy.selectedRepoCount}`,
    `- Source repositories: ${stats.repositoryPolicy.sourceRepoCount}`,
    `- Forked repositories: ${stats.repositoryPolicy.forkedRepoCount}`,
    `- Total stars: ${stats.totals.stars}`,
    `- Total forks: ${stats.totals.forks}`,
  ];

  if (stats.contributions) {
    lines.push(`- ${stats.contributions.year} contributions: ${stats.contributions.totalContributions}`);
  }

  lines.push("", "This file is generated by GitHub Actions.");
  return `${lines.map(escapeXml).join("\n")}\n`;
}
