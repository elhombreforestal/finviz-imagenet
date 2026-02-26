"use client";

import * as React from "react";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";

type Child = {
  id: number;
  name: string;
  path: string;
  size: number;
  hasChildren: boolean;
};

function NodeLabel({ name, size }: { name: string; size: number }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%", pr: 1 }}>
      <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name}
      </Typography>
      <Box sx={{ ml: "auto" }}>
        {size > 0 && <Chip label={size} size="small" color="info" variant="outlined" sx={{ minWidth: 56, justifyContent: "center" }} />}
      </Box>
    </Box>
  );
}

export default function Page() {
  const [root, setRoot] = React.useState<Child | null>(null);

  // cache: path -> children[]
  const [childrenByPath, setChildrenByPath] = React.useState<Record<string, Child[]>>({});
  const [loadingPath, setLoadingPath] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const idToPathRef = React.useRef<Record<string, string>>({});

  // Load top-level nodes once; pick the first as root
  React.useEffect(() => {
    fetch("/api/tree/children")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((top: Child[]) => {
        if (!top.length) throw new Error("No root nodes returned.");
        setRoot(top[0]); // ImageNet root should be the biggest
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);

  const loadChildren = React.useCallback(async (path: string) => {
    if (childrenByPath[path]) return; // already loaded
    setLoadingPath(path);
    try {
      const res = await fetch(`/api/tree/children?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const kids = (await res.json()) as Child[];
      setChildrenByPath((m) => ({ ...m, [path]: kids }));
    } finally {
      setLoadingPath((p) => (p === path ? null : p));
    }
  }, [childrenByPath]);

  const renderNode = (node: Child) => {
    idToPathRef.current[String(node.id)] = node.path;
    const loadedKids = childrenByPath[node.path];
    const isLoading = loadingPath === node.path;

    return (
      <TreeItem
        key={node.id}
        itemId={String(node.id)}
        label={<NodeLabel name={node.name} size={node.size} />}
        onClick={() => {          
          if (node.hasChildren) loadChildren(node.path);
        }}
      >
        {isLoading && (
          <TreeItem
            itemId={`${node.path}::__loading`}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
                <CircularProgress size={14} />
                <Typography variant="body2">Loading…</Typography>
              </Box>
            }
          />
        )}

        {(loadedKids ?? []).map(renderNode)}

        {/* Placeholder so expand arrow shows even before children are loaded */}
        {!loadedKids && node.hasChildren && !isLoading && (
          <TreeItem itemId={`${node.path}::__placeholder`} label={<Typography variant="body2">Expand to load…</Typography>} />
        )}
      </TreeItem>
    );
  };

  if (error) return <Box sx={{ p: 3 }}>Error: {error}</Box>;
  if (!root) return <Box sx={{ p: 3 }}>Loading root…</Box>;

  return (
    <Box sx={{ p: 2, height: "100%" }}>
      <SimpleTreeView
        //load children when node is expanded
        onExpandedItemsChange={(_, expanded) => {
          const newest = expanded[expanded.length - 1];
          if (!newest) return;

          const path = idToPathRef.current[newest];
          if (path) loadChildren(path);
        }}
      >
        {renderNode(root)}
      </SimpleTreeView>
    </Box>
  );
}