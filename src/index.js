import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getConfig } from "./env.js";
import {
  collectLanguageBytes,
  filterRepositories,
  getAccount,
  getCurrentYearContributions,
  listOwnerRepositories,
} from "./github.js";
import { aggregateStats } from "./stats.js";
import { renderLanguagesCard, renderStatsCard, renderTopReposCard } from "./render/cards.js";
import { renderAnimatedStatusGif } from "./render/gif.js";

// Additional accounts whose public repos are merged into the language stats
const ADDITIONAL_ACCOUNTS = ["aiwireless-535100"];

async function writeOutputFiles(outputDir, stats) {
  await mkdir(outputDir, { recursive: true });

  const files = {
    "stats.svg": renderStatsCard(stats),
    "languages.svg": renderLanguagesCard(stats),
    "top-repos.svg": renderTopReposCard(stats),
    "stats.json": `${JSON.stringify(stats, null, 2)}\n`,
    "status.gif": await renderAnimatedStatusGif(stats),
  };

  for (const [fileName, content] of Object.entries(files)) {
    await writeFile(join(outputDir, fileName), content);
  }
}

async function main() {
  const config = getConfig();

  console.log(`Generating GitHub stats for: ${config.targetLogin}`);
  console.log(`Additional accounts: ${ADDITIONAL_ACCOUNTS.join(", ")}`);
  console.log(`Output directory: ${config.outputDir}`);

  const account = await getAccount(config.targetLogin, { token: config.token });
  const allOwnedRepos = await listOwnerRepositories(account, { token: config.token });
  const selectedRepos = filterRepositories(allOwnedRepos, {
    includeForks: config.includeForks,
    includeArchived: config.includeArchived,
  });

  const languageBytes = await collectLanguageBytes(selectedRepos, {
    token: config.token,
    maxRepos: config.maxLanguageRepos,
  });

  // Merge language bytes from additional public accounts
  for (const login of ADDITIONAL_ACCOUNTS) {
    try {
      console.log(`Merging languages from: ${login}`);
      const additionalAccount = await getAccount(login, { token: config.token });
      const additionalAllRepos = await listOwnerRepositories(additionalAccount, { token: config.token });
      const additionalRepos = filterRepositories(additionalAllRepos, {
        includeForks: config.includeForks,
        includeArchived: config.includeArchived,
      });
      const additionalBytes = await collectLanguageBytes(additionalRepos, {
        token: config.token,
        maxRepos: config.maxLanguageRepos,
      });
      for (const [lang, bytes] of Object.entries(additionalBytes)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
      console.log(`  merged: ${Object.keys(additionalBytes).join(", ")}`);
    } catch (error) {
      console.warn(`Warning: skipping ${login}: ${error.message}`);
    }
  }

  const contributions = await getCurrentYearContributions(account, {
    token: config.token,
    allowFailure: config.allowGraphqlFailure,
  });

  const stats = aggregateStats(account, allOwnedRepos, selectedRepos, languageBytes, contributions, config);
  await writeOutputFiles(config.outputDir, stats);

  console.log(`Done. Repos scanned: ${stats.repositoryPolicy.selectedRepoCount}`);
  console.log(`Stars: ${stats.totals.stars} | Forks: ${stats.totals.forks}`);
  if (stats.contributions) {
    console.log(`${stats.contributions.year} contributions: ${stats.contributions.totalContributions}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
