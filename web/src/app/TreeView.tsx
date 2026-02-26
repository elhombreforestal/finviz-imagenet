"use client";

import { useEffect, useMemo, useState } from "react";
import { Tree } from "react-arborist";

type ApiNode = {
  name: string;
  size?: number;
  children?: ApiNode[];
};

type UiNode = {
  id: string;
  name: string;
  size?: number;
  children?: UiNode[];
};

function toUiTree(node: ApiNode, parentId = ""): UiNode {
  const id = parentId ? `${parentId}/${node.name}` : node.name;
  return {
    id,
    name: node.name,
    size: node.size,
    children: node.children?.map((c) => toUiTree(c, id)),
  };
}

export default function TreeView() {
  const [root, setRoot] = useState<ApiNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tree")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setRoot)
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  const data = useMemo<UiNode[] | null>(() => {
    if (!root) return null;
    return [toUiTree(root)];
  }, [root]);

  if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ height: "100vh", width: "100vw", padding: 12, boxSizing: "border-box" }}>
      <div style={{ marginBottom: 8, fontFamily: "system-ui", fontSize: 14 }}>
        Tree view (virtualized). Expand nodes. Showing node size (descendants).
      </div>

      <Tree
        data={data}
        openByDefault={false}
        width={"100%"}
        height={window.innerHeight - 60}
        indent={18}
        rowHeight={26}
      >
        {({ node, style, dragHandle }) => (
  <div
    ref={dragHandle}
    style={{
      ...style,
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: "system-ui",
      fontSize: 13,
      paddingLeft: 6,
      boxSizing: "border-box",
      cursor: "pointer",
      userSelect: "none",
    }}
    onClick={(e) => {      
      node.select();
      if (!node.isLeaf) node.toggle();
    }}
  >    
    <span
      onClick={(e) => {
        e.stopPropagation();
        if (!node.isLeaf) node.toggle();
      }}
      style={{ width: 18, display: "inline-block", textAlign: "center" }}
      aria-hidden
    >
      {node.isLeaf ? "•" : node.isOpen ? "▾" : "▸"}
    </span>

    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {node.data.name}
    </span>

    {typeof node.data.size === "number" && (
      <span style={{ marginLeft: "auto", opacity: 0.7 }}>
        {node.data.size}
      </span>
    )}
  </div>
)}
      </Tree>
    </div>
  );
}