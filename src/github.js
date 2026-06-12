import { fetchAllPages, fetchJson, graphql, restUrl } from "./http.js";

function normalizeLogin(login) {
  return String(login || "").trim();
}

function isSameLogin(a, b) {
  return normalizeLogin(a).toLowerCase() === normalizeLogin(b).toLowerCase();
}

export async function getAccount(login, { token = "" } = {}) {
  const target = normalizeLogin(login);
  if (!target) throw new Error("getAccount requires a login.");

  const { data } = await fetchJson(restUrl(`/users/${encodeURIComponent(target)}`), { token });
  return data;
}

export async function listOwnerRepositories(account, { token = "" } = {}) {
  const login = normalizeLogin(account.login);
  const isOrg = account.type === "Organization";

  const url = isOrg
    ? restUrl(`/orgs/${encodeURIComponent(login)}/repos`, {
        type: "public",
        sort: "pushed",
        direction: "desc",
        per_page: 100,
      })
    : restUrl(`/users/${encodeURIComponent(login)}/repos`, {
        type: "owner",
        sort: "pushed",
        direction: "desc",
        per_page: 100,
      });

  const repos = await fetchAllPages(url, { token });

  return repos.filter((repo) => repo?.owner?.login && isSameLogin(repo.owner.login, login));
}

export function filterRepositories(repos, { includeForks = false, includeArchived = true } = {}) {
  return repos.filter((repo) => {
    if (!includeForks && repo.fork) return false;
    if (!includeArchived && repo.archived) return false;
    return !repo.disabled;
  });
}

async function getRepositoryLanguages(owner, repoName, { token = "" } = {}) {
  const { data } = await fetchJson(
    restUrl(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/languages`),
    { token },
  );
  return data || {};
}

export async function collectLanguageBytes(repos, { token = "", maxRepos = 100 } = {}) {
  const languageBytes = new Map();
  const selectedRepos = repos
    .filter((repo) => repo.language || repo.size > 0)
    .sort((a, b) => {
      const aTime = new Date(a.pushed_at || a.updated_at || a.created_at || 0).getTime();
      const bTime = new Date(b.pushed_at || b.updated_at || b.created_at || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, maxRepos);

  for (const repo of selectedRepos) {
    try {
      const languages = await getRepositoryLanguages(repo.owner.login, repo.name, { token });
      for (const [language, bytes] of Object.entries(languages)) {
        languageBytes.set(language, (languageBytes.get(language) || 0) + Number(bytes || 0));
      }
    } catch (error) {
      console.warn(`Warning: failed to fetch languages for ${repo.full_name}: ${error.message}`);
    }
  }

  return Object.fromEntries(languageBytes.entries());
}

export async function getCurrentYearContributions(account, { token = "", allowFailure = true } = {}) {
  if (account.type !== "User") {
    return null;
  }

  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0)).toISOString();
  const to = now.toISOString();

  const query = `
    query CurrentYearContributions($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
          }
          totalCommitContributions
          totalIssueContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalRepositoryContributions
          restrictedContributionsCount
        }
      }
    }
  `;

  try {
    const data = await graphql(
      query,
      {
        login: account.login,
        from,
        to,
      },
      { token },
    );

    const collection = data?.user?.contributionsCollection;
    if (!collection) return null;

    return {
      year: now.getUTCFullYear(),
      totalContributions: collection.contributionCalendar.totalContributions,
      commits: collection.totalCommitContributions,
      issues: collection.totalIssueContributions,
      pullRequests: collection.totalPullRequestContributions,
      pullRequestReviews: collection.totalPullRequestReviewContributions,
      repositories: collection.totalRepositoryContributions,
      restricted: collection.restrictedContributionsCount,
      from,
      to,
    };
  } catch (error) {
    if (!allowFailure) throw error;
    console.warn(`Warning: contribution stats unavailable: ${error.message}`);
    return null;
  }
}
