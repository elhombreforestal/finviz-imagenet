import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Child = { id: number; name: string; path: string; size: number; hasChildren: boolean };

const SEP = " > ";

function escapeLike(s: string) {
  // escape % and _ for LIKE
  return s.replace(/[%_\\]/g, (m) => "\\" + m);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = (url.searchParams.get("path") ?? "").trim();

  const db = getDb();

  // If path is empty, children are the top-level nodes (no SEP inside name).
  
  if (!path) {
    // top-level nodes are names without separator
    const rows = db
      .prepare(
        `
        SELECT id, name, size
        FROM tuples
        WHERE instr(name, ?) = 0
        ORDER BY size DESC
        `
      )
      .all(SEP) as { id: number; name: string; size: number }[];

    const result: Child[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      path: r.name,
      size: r.size,
      hasChildren: r.size > 0,
    }));

    return NextResponse.json(result);
  }

  const prefix = path + SEP;
  const likePrefix = escapeLike(prefix) + "%";

  // Children = exactly one segment deeper:
  // remainder = substr(name, length(prefix)+1)
  // child segment = if remainder contains SEP => take up to SEP, else whole remainder
  // Then we group by child segment to dedupe.
  const rows = db
    .prepare(
      `
      WITH candidates AS (
        SELECT
          name,
          size,
          substr(name, length(?) + 1) AS remainder
        FROM tuples
        WHERE name LIKE ? ESCAPE '\\'
      ),
      direct_children AS (
        SELECT
          CASE
            WHEN instr(remainder, ?) = 0 THEN remainder
            ELSE substr(remainder, 1, instr(remainder, ?) - 1)
          END AS child_name
        FROM candidates
      )
      SELECT
        t.id AS id,
        dc.child_name AS child_name,
        t.name AS full_path,
        t.size AS size
      FROM (SELECT DISTINCT child_name FROM direct_children WHERE child_name <> '') dc
      JOIN tuples t
        ON t.name = (? || ? || dc.child_name)
      ORDER BY t.size DESC
      `
    )
    .all(prefix, likePrefix, SEP, SEP, path, SEP) as { id: number; child_name: string; full_path: string; size: number }[];

  
  // size>0 should mean descendants exist
  const result: Child[] = rows.map((r) => ({
    id: r.id,
    name: r.child_name,
    path: r.full_path,
    size: r.size,
    hasChildren: r.size > 0,
  }));

  return NextResponse.json(result);
}