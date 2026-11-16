type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
};

export function remarkHtmlBreaks() {
  return (tree: MarkdownNode) => {
    const walk = (parent: MarkdownNode) => {
      if (!parent.children) return;
      parent.children = parent.children.flatMap((node) => {
        if (
          node.type === "html" &&
          /^(?:\s*<br\s*\/?\s*>\s*)+$/i.test(node.value || "")
        ) {
          const breaks = (node.value!.match(/<br\s*\/?\s*>/gi) || []).map(
            () => ({ type: "break" }),
          );
          return ["root", "blockquote", "listItem"].includes(parent.type)
            ? [{ type: "paragraph", children: breaks }]
            : breaks;
        }
        walk(node);
        return [node];
      });
    };
    walk(tree);
  };
}
