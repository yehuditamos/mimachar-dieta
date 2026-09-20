import 'server-only';
import { neon } from '@neondatabase/serverless';
import type { Group, Row } from './store';
function sql() {
  const connection = process.env.DATABASE_URL;
  if (!connection) throw new Error('Database environment is incomplete');
  return neon(connection);
}
export async function findByInvite(invite: string): Promise<Row | null> {
  const rows = await sql()`SELECT id, invite, state::text AS state, revision FROM diet_groups WHERE invite=${invite}`;
  return (rows[0] as Row) || null;
}
export async function findForUser(uid: string): Promise<Row | null> {
  const member = JSON.stringify({members:[{uid}]});
  const rows = await sql()`SELECT id, invite, state::text AS state, revision FROM diet_groups WHERE state @> ${member}::jsonb ORDER BY created_at DESC LIMIT 1`;
  return (rows[0] as Row) || null;
}
export async function createGroup(row: Row): Promise<Row> {
  const rows = await sql()`INSERT INTO diet_groups (id,invite,state,revision) VALUES (${row.id},${row.invite},${row.state}::jsonb,0) ON CONFLICT ((state->>'owner')) DO UPDATE SET revision=diet_groups.revision RETURNING id,invite,state::text AS state,revision`;
  return rows[0] as Row;
}
export async function saveGroup(row: Row, group: Group): Promise<boolean> {
  const rows = await sql()`UPDATE diet_groups SET state=${JSON.stringify(group)}::jsonb,revision=revision+1 WHERE id=${row.id} AND revision=${row.revision} RETURNING revision`;
  return rows.length === 1;
}
