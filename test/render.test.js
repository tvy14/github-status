import assert from "node:assert/strict";
import test from "node:test";
import { renderLanguagesCard, renderStatsCard, renderTopReposCard } from "../src/render/cards.js";
import { renderAnimatedStatusGif, statusGifAnimationProgress } from "../src/render/gif.js";

const stats = {
  generatedAt: "2026-05-03T00:00:00.000Z",
  owner: {
    login: "octocat",
    displayName: "Octocat",
    followers: 10,
    following: 2,
  },
  repositoryPolicy: {
    selectedRepoCount: 2,
    sourceRepoCount: 2,
    forkedRepoCount: 0,
    archivedRepoCount: 0,
  },
  totals: {
    stars: 42,
    forks: 9,
    openIssues: 3,
    sizeKB: 1000,
    latestPushAt: "2026-05-01T00:00:00.000Z",
  },
  contributions: {
    year: 2026,
    totalContributions: 123,
    pullRequests: 4,
    issues: 5,
    pullRequestReviews: 6,
  },
  languages: [
    { name: "JavaScript", bytes: 900, percent: 90 },
    { name: "Python", bytes: 100, percent: 10 },
  ],
  topRepos: [
    {
      name: "hello-world",
      description: "Test repo",
      language: "JavaScript",
      stars: 42,
      forks: 9,
      archived: false,
    },
  ],
};

test("renderStatsCard returns valid SVG text", () => {
  const svg = renderStatsCard(stats);
  assert.match(svg, /<svg/);
  assert.match(svg, /Octocat&apos;s GitHub Stats/);
  assert.match(svg, /Selected Repos/);
  assert.match(svg, /PROFILE GRADE/);
});

test("renderLanguagesCard returns language rows", () => {
  const svg = renderLanguagesCard(stats);
  assert.match(svg, /JavaScript/);
  assert.match(svg, /90\.0%/);
});

test("renderTopReposCard returns repository rows", () => {
  const svg = renderTopReposCard(stats);
  assert.match(svg, /hello-world/);
  assert.match(svg, /★ 42/);
});

test("renderAnimatedStatusGif returns animated GIF bytes", async () => {
  const gif = await renderAnimatedStatusGif(stats, { frameCount: 4, delay: 30, finalDelay: 60 });
  assert.ok(Buffer.isBuffer(gif));
  assert.equal(gif.subarray(0, 3).toString("ascii"), "GIF");
});

test("renderAnimatedStatusGif uses completed stats as the first GIF frame", () => {
  assert.deepEqual(statusGifAnimationProgress(4), [1, 0, 1 / 3, 2 / 3, 1]);
});
