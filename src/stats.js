function sumBy(items, selector) {
  return items.reduce((total, item) => total + Number(selector(item) || 0), 0);
}

function maxDate(values) {
  const timestamps = values
    .map((value) => new Date(value || 0).getTime())
    .filter((value) => Number.isFinite(value) && value > 0);
  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function languagePercentages(languageBytes, count) {
  const entries = Object.entries(languageBytes || {})
    .map(([name, bytes]) => ({ name, bytes: Number(bytes || 0) }))
    .filter((item) => item.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes);

  const totalBytes = entries.reduce((total, item) => total + item.bytes, 0);
  if (totalBytes <= 0) return [];

  return entries.slice(0, count).map((item) => ({
    ...item,
    percent: (item.bytes / totalBytes) * 100,
  }));
}

function topRepositories(repos, count) {
  return repos
    .map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description || "",
      language: repo.language || "",
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      openIssues: repo.open_issues_count || 0,
      pushedAt: repo.pushed_at || repo.updated_at || repo.created_at || null,
      archived: Boolean(repo.archived),
      fork: Boolean(repo.fork),
      score: (repo.stargazers_count || 0) * 3 + (repo.forks_count || 0) * 2 + (repo.watchers_count || 0),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.pushedAt || 0).getTime() - new Date(a.pushedAt || 0).getTime();
    })
    .slice(0, count);
}

export function aggregateStats(account, allOwnedRepos, selectedRepos, languageBytes, contributions, options = {}) {
  const topLanguageCount = options.topLanguageCount ?? 8;
  const topRepoCount = options.topRepoCount ?? 6;
  const now = new Date();

  const sourceRepos = allOwnedRepos.filter((repo) => !repo.fork);
  const forkedRepos = allOwnedRepos.filter((repo) => repo.fork);
  const archivedRepos = allOwnedRepos.filter((repo) => repo.archived);

  return {
    generatedAt: now.toISOString(),
    owner: {
      login: account.login,
      id: account.id,
      type: account.type,
      displayName: account.name || account.login,
      bio: account.bio || "",
      company: account.company || "",
      location: account.location || "",
      blog: account.blog || "",
      profileUrl: account.html_url,
      avatarUrl: account.avatar_url,
      createdAt: account.created_at,
      followers: account.followers || 0,
      following: account.following || 0,
      publicRepos: account.public_repos || allOwnedRepos.length,
      publicGists: account.public_gists || 0,
    },
    repositoryPolicy: {
      includeForks: Boolean(options.includeForks),
      includeArchived: Boolean(options.includeArchived),
      selectedRepoCount: selectedRepos.length,
      allOwnedRepoCount: allOwnedRepos.length,
      sourceRepoCount: sourceRepos.length,
      forkedRepoCount: forkedRepos.length,
      archivedRepoCount: archivedRepos.length,
    },
    totals: {
      stars: sumBy(selectedRepos, (repo) => repo.stargazers_count),
      forks: sumBy(selectedRepos, (repo) => repo.forks_count),
      watchers: sumBy(selectedRepos, (repo) => repo.watchers_count),
      openIssues: sumBy(selectedRepos, (repo) => repo.open_issues_count),
      sizeKB: sumBy(selectedRepos, (repo) => repo.size),
      latestPushAt: maxDate(selectedRepos.map((repo) => repo.pushed_at)),
    },
    contributions,
    languages: languagePercentages(languageBytes, topLanguageCount),
    topRepos: topRepositories(selectedRepos, topRepoCount),
  };
}
