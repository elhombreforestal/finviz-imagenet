import Database from "better-sqlite3";

const DB_PATH = process.env.SQLITE_PATH || "/data/app.db";

type TupleRow = { name: string; size: number };

// O(1) complexity due to Record-based children storage, vs O(n) for array-based.
type TreeNode = {
  name: string;
  size?: number;
  children?: Record<string, TreeNode>;
};

// output as array tree (for frontend)
type OutputTreeNode = {
  name: string;
  size?: number;
  children?: OutputTreeNode[];
};

function buildTree(rows: TupleRow[]) {
  const root: TreeNode = { name: "__root__", children: {} };

  for (const row of rows) {
    const parts = row.name.split(" > ").map((s) => s.trim()).filter(Boolean);

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      current.children ||= {};
      current.children[key] ||= { name: key, children: {} };
      current = current.children[key];

      // size belongs to the full path node
      if (i === parts.length - 1) {
        current.size = row.size;
      }
    }
  }

  const toArray = (node: TreeNode): OutputTreeNode => {
    const childrenObj = node.children || {};
    const childrenArr = Object.values(childrenObj).map(toArray);
    const out: OutputTreeNode = { name: node.name };
    if (typeof node.size === "number") out.size = node.size;
    if (childrenArr.length) out.children = childrenArr;
    return out;
  };

  const roots = Object.values(root.children || {});
  if (roots.length === 1) return toArray(roots[0]);
  return { name: "root", children: roots.map(toArray) };
}

export async function GET() {
  const db = new Database(DB_PATH, { readonly: true });

  const rows = db
    .prepare(`SELECT name, size FROM tuples ORDER BY name ASC`)
    .all() as TupleRow[];

  db.close();

  const tree = buildTree(rows);
  return Response.json(tree);
}