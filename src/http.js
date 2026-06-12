const REST_BASE_URL = "https://api.github.com";
const GRAPHQL_URL = "https://api.github.com/graphql";
const API_VERSION = "2022-11-28";

function buildHeaders(token, extra = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    ...extra,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseNextUrl(linkHeader) {
  if (!linkHeader) return "";
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return "";
}

function describeRateLimit(response) {
  const limit = response.headers.get("x-ratelimit-limit");
  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  if (!limit && !remaining && !reset) return "";

  let resetText = "unknown";
  if (reset) {
    const resetDate = new Date(Number(reset) * 1000);
    if (!Number.isNaN(resetDate.getTime())) resetText = resetDate.toISOString();
  }

  return ` Rate limit: remaining=${remaining ?? "unknown"}, limit=${limit ?? "unknown"}, reset=${resetText}.`;
}

export function restUrl(path, params = {}) {
  const url = new URL(path.startsWith("http") ? path : `${REST_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function fetchJson(url, { token = "", method = "GET", body } = {}) {
  const headers = buildHeaders(token);
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseText = await response.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = responseText;
    }
  }

  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? data.message : responseText;
    throw new Error(`GitHub API ${method} ${url} failed: ${response.status} ${response.statusText}. ${message}.${describeRateLimit(response)}`);
  }

  return {
    data,
    nextUrl: parseNextUrl(response.headers.get("link")),
    headers: response.headers,
  };
}

export async function fetchAllPages(url, { token = "", maxPages = 100 } = {}) {
  const results = [];
  let nextUrl = url;
  let page = 0;

  while (nextUrl) {
    page += 1;
    if (page > maxPages) {
      throw new Error(`Pagination exceeded maxPages=${maxPages} for ${url}`);
    }

    const { data, nextUrl: newNextUrl } = await fetchJson(nextUrl, { token });
    if (!Array.isArray(data)) {
      throw new Error(`Expected paginated array from ${nextUrl}`);
    }
    results.push(...data);
    nextUrl = newNextUrl;
  }

  return results;
}

export async function graphql(query, variables, { token = "" } = {}) {
  if (!token) {
    throw new Error("GraphQL contribution stats require GITHUB_TOKEN or GH_TOKEN.");
  }

  const { data } = await fetchJson(GRAPHQL_URL, {
    token,
    method: "POST",
    body: { query, variables },
  });

  if (data?.errors?.length) {
    const errors = data.errors.map((error) => error.message).join("; ");
    throw new Error(`GitHub GraphQL query failed: ${errors}`);
  }

  return data?.data ?? null;
}
