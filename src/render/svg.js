export function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function formatNumber(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}m`;
  if (Math.abs(number) >= 10_000) return `${Math.round(number / 1_000)}k`;
  if (Math.abs(number) >= 1_000) return `${(number / 1_000).toFixed(1)}k`;
  return String(number);
}

export function formatBytesFromKB(kb) {
  const bytes = Number(kb || 0) * 1024;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatDate(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toISOString().slice(0, 10);
}

export function svgDocument({ width, height, children, label = "GitHub statistics card" }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(label)}">
  <title>${escapeXml(label)}</title>
  <style>
    .title { font: 700 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0969da; }
    .subtitle { font: 500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #57606a; }
    .label { font: 600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #57606a; }
    .value { font: 700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0969da; }
    .stat-label { font: 700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #57606a; }
    .stat-value { font: 800 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0969da; }
    .grade { font: 800 27px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0969da; }
    .grade-caption { font: 700 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #57606a; letter-spacing: 0.4px; }
    .footer { font: 600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #57606a; }
    .small { font: 500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #57606a; }
    .repo { font: 700 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0969da; }
    .desc { font: 500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #57606a; }
  </style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="#ffffff" stroke="#d0d7de"/>
  ${children}
</svg>`;
}

export function text(x, y, content, className, extra = "") {
  return `<text x="${x}" y="${y}" class="${escapeXml(className)}" ${extra}>${escapeXml(content)}</text>`;
}

export function metricCell({ x, y, label, value }) {
  return `
    ${text(x, y, label, "label")}
    ${text(x, y + 25, value, "value")}`;
}

export function truncate(value, maxLength) {
  const textValue = String(value ?? "");
  if (textValue.length <= maxLength) return textValue;
  return `${textValue.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function progressBar({ x, y, width, percent }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));
  const filledWidth = Math.max(2, (width * safePercent) / 100);
  return `
    <rect x="${x}" y="${y}" width="${width}" height="8" rx="4" fill="#eaeef2"/>
    <rect x="${x}" y="${y}" width="${filledWidth.toFixed(2)}" height="8" rx="4" fill="#0969da"/>`;
}
