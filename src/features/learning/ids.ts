const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True for ids that refer to real database rows. The public demo uses
 * readable ids such as "demo-quantum", which must never be read or written.
 */
export function isPersistableId(id: string | null | undefined): id is string {
  return !!id && UUID_RE.test(id);
}
