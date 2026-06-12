import assert from "node:assert/strict";
import test from "node:test";
import { aggregateStats } from "../src/stats.js";

test("aggregateStats sums only selected repositories but reports all owned repository policy counts", () => {
  const account = {
    login: "octocat",
    id: 1,
    type: "User",
    name: "Octocat",
    html_url: "https://github.com/octocat",
    avatar_url: "https://example.com/avatar.png",
    created_at: "2008-01-01T00:00:00Z",
    followers: 10,
    following: 2,
    public_repos: 3,
    public_gists: 1,
  };

  const repos = [
    {
      name: "a",
      full_name: "octocat/a",
      owner: { login: "octocat" },
      html_url: "https://github.com/octocat/a",
      stargazers_count: 5,
      forks_count: 2,
      watchers_count: 5,
      open_issues_count: 1,
      size: 100,
      language: "JavaScript",
      fork: false,
      archived: false,
      disabled: false,
      pushed_at: "2026-01-01T00:00:00Z",
    },
    {
      name: "b",
      full_name: "octocat/b",
      owner: { login: "octocat" },
      html_url: "https://github.com/octocat/b",
      stargazers_count: 7,
      forks_count: 3,
      watchers_count: 7,
      open_issues_count: 4,
      size: 200,
      language: "Python",
      fork: true,
      archived: false,
      disabled: false,
      pushed_at: "2026-02-01T00:00:00Z",
    },
  ];

  const selectedRepos = repos.filter((repo) => !repo.fork);
  const stats = aggregateStats(account, repos, selectedRepos, { JavaScript: 800, Python: 200 }, null, {
    includeForks: false,
    includeArchived: true,
    topLanguageCount: 2,
    topRepoCount: 2,
  });

  assert.equal(stats.repositoryPolicy.allOwnedRepoCount, 2);
  assert.equal(stats.repositoryPolicy.selectedRepoCount, 1);
  assert.equal(stats.repositoryPolicy.sourceRepoCount, 1);
  assert.equal(stats.repositoryPolicy.forkedRepoCount, 1);
  assert.equal(stats.totals.stars, 5);
  assert.equal(stats.totals.forks, 2);
  assert.equal(stats.languages[0].name, "JavaScript");
  assert.equal(Math.round(stats.languages[0].percent), 80);
});
