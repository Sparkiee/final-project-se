export function stripHTML(html) {
  return html.replace(/<[^>]*>?/gm, "");
}