import { resolve } from "node:path";

function readBoolean(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const value = String(raw).trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(value)) return true;
  if (["0", "false", "no", "n", "off"].includes(value)) return false;
  throw new Error(`Invalid boolean environment variable ${name}=${raw}`);
}

function readInteger(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid integer environment variable ${name}=${raw}`);
  }
  return value;
}

function readOwnerFromRepository(repository) {
  if (!repository) return "";
  const [owner] = String(repository).split("/");
  return owner || "";
}

export function getConfig() {
  const targetLogin =
    process.env.TARGET_LOGIN ||
    process.env.GITHUB_REPOSITORY_OWNER ||
    readOwnerFromRepository(process.env.GITHUB_REPOSITORY);

  if (!targetLogin) {
    throw new Error(
      "No target login was found. Set TARGET_LOGIN or run inside GitHub Actions so GITHUB_REPOSITORY_OWNER is available.",
    );
  }

  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";

  return {
    targetLogin,
    token,
    outputDir: resolve(process.cwd(), process.env.OUTPUT_DIR || "generated"),
    includeForks: readBoolean("INCLUDE_FORKS", false),
    includeArchived: readBoolean("INCLUDE_ARCHIVED", true),
    maxLanguageRepos: readInteger("MAX_LANGUAGE_REPOS", 100, { min: 0, max: 500 }),
    topLanguageCount: readInteger("TOP_LANGUAGE_COUNT", 8, { min: 1, max: 20 }),
    topRepoCount: readInteger("TOP_REPO_COUNT", 6, { min: 1, max: 20 }),
    allowGraphqlFailure: readBoolean("ALLOW_GRAPHQL_FAILURE", true),
  };
}
