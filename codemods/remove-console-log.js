/**
 * jscodeshift transform to remove `console.log(...)` calls that are used as standalone statements.
 *
 * - Deletes ExpressionStatements whose callee is `console.log`.
 * - Leaves other console methods (warn, error, info) untouched.
 * - Does not alter comments.
 */

module.exports = function removeConsoleLog(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Remove standalone `console.log(...)` statements
  root
    .find(j.ExpressionStatement, {
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'console' },
          property: { type: 'Identifier', name: 'log' },
        },
      },
    })
    .remove();

  return root.toSource({ quote: 'single', reuseWhitespace: true });
};


