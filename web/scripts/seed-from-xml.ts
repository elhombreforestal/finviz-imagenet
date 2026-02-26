import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { XMLParser } from "fast-xml-parser";

const DB_PATH = process.env.SQLITE_PATH ?? "/data/app.db";
const XML_PATH = process.env.XML_PATH ?? path.join(process.cwd(), "data", "structure_released.xml");

type TupleRow = { name: string; size: number };

type SynsetNode = {
  "@_words"?: string;
  synset?: SynsetNode[];
};

type ParsedXml = {
  ImageNetStructure?: {
    synset?: SynsetNode[];
  };
};

function createSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=NORMAL;

    CREATE TABLE IF NOT EXISTS tuples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      size INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS tuples_name_idx ON tuples(name);
  `);
}

function hasData(db: Database.Database): boolean {
  const row = db.prepare(`SELECT COUNT(1) AS c FROM tuples`).get() as { c: number };
  return row.c > 0;
}

/**
 * Parses ImageNetStructure XML into linear tuples.
 * size = number of descendant <synset> nodes.
 */
function parseXmlToTuples(xmlText: string): TupleRow[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Force synset always array (avoids "object vs array" edge cases)
    isArray: (name) => name === "synset",
  });

  const obj = parser.parse(xmlText) as ParsedXml;
  const root = obj?.ImageNetStructure;
  if (!root) throw new Error("Invalid XML: missing <ImageNetStructure> root.");

  const topSynsets: SynsetNode[] = root.synset ?? [];
  const out: TupleRow[] = [];

  const fetchNode = (node: SynsetNode, pathWords: string[]): number => {
    const words = String(node?.["@_words"] ?? "").trim();
    const nextPath = words ? [...pathWords, words] : [...pathWords];

    const children: SynsetNode[] = node?.synset ?? [];

    let subtreeCount = 1; // vcetne aktualniho nodu
    for (const child of children) subtreeCount += fetchNode(child, nextPath);

    if (words) {
      out.push({
        name: nextPath.join(" > "),
        size: subtreeCount - 1, // jen vsichni potomci
      });
    }

    return subtreeCount;
  };

  for (const s of topSynsets) fetchNode(s, []);
  return out;
}

export function seedFromXml() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  createSchema(db);

  if (hasData(db)) {
    console.log(`[seed] tuples already present, skipping. DB=${DB_PATH}`);
    db.close();
    return;
  }

  console.log(`[seed] reading XML... ${XML_PATH}`);
  const xmlText = fs.readFileSync(XML_PATH, "utf8");
  const tuples = parseXmlToTuples(xmlText);

  console.log(`[seed] inserting tuples... count=${tuples.length}`);
  const insert = db.prepare(`INSERT INTO tuples (name, size) VALUES (?, ?)`);
  const insertMany = db.transaction((rows: TupleRow[]) => {
    for (const r of rows) insert.run(r.name, r.size);
  });

  insertMany(tuples);

  console.log(`[seed] done. inserted=${tuples.length}`);
  db.close();
}

seedFromXml();