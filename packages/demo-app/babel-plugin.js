/**
 * @typedef {import('@babel/core')} Babel
 */

/**
 * @param {Babel}
 */
module.exports = function ({ types: t }) {
  return {
    visitor: {
      JSXOpeningElement(path, state) {
        // Check if the element already has a "data-location" attribute
        const hasDataLocation = path.node.attributes.some(
          (attr) =>
            t.isJSXAttribute(attr) && attr.name.name === "data-reshaper-loc",
        );

        if (!hasDataLocation) {
          // Get the source file path and location
          const location = path.node.loc;
          const filePath = state.file.opts.filename || "unknown";
          const line = location.start.line;
          const column = location.start.column;

          // Create the "data-location" attribute
          const dataLocationAttr = t.jsxAttribute(
            t.jsxIdentifier("data-reshaper-loc"),
            t.stringLiteral(`${filePath}#${line}:${column}`),
          );

          // Add the attribute to the element
          path.node.attributes.push(dataLocationAttr);
        }
      },
    },
  };
};
