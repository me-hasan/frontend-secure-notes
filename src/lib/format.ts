/** Mongo ids are 24 chars; showing the tail keeps the rows readable without hiding the identity. */
export function shortId(id: string): string {
  return id.length > 8 ? `…${id.slice(-6)}` : id;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}
