// Keep the documentation framework's reset and utilities out of the product UI.
module.exports = () => ({
  postcssPlugin: "commons-docs-scope",
  OnceExit(root, { postcss }) {
    if (!root.source.input.file.endsWith("/docs/docs.css")) return;
    root.walkAtRules("layer", (rule) => {
      if (rule.nodes) rule.replaceWith(rule.nodes);
      else rule.remove();
    });
    root.walkRules((rule) => {
      rule.selector = rule.selector.replace(/:root|:host/g, ":scope");
    });
    const scope = postcss.atRule({ name: "scope", params: "(:root:has(.commons-docs))" });
    for (const node of [...root.nodes]) {
      if (node.type === "atrule" && ["property", "keyframes"].includes(node.name)) continue;
      scope.append(node);
    }
    root.append(scope);
  },
});
module.exports.postcss = true;
