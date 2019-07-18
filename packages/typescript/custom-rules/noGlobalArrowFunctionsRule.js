'use strict'
exports.__esModule = true
var tslib_1 = require('tslib')
var Lint = require('tslint')
var ts = require('typescript')
var Rule = /** @class */ (function(_super) {
  tslib_1.__extends(Rule, _super)
  function Rule() {
    return (_super !== null && _super.apply(this, arguments)) || this
  }
  Rule.prototype.apply = function(sourceFile) {
    return this.applyWithFunction(sourceFile, walk)
  }
  Rule.FAILURE_STRING = 'arrow functions forbidden in global scope, use named function'
  return Rule
})(Lint.Rules.AbstractRule)
exports.Rule = Rule
// @ts-ignore
function walk(ctx) {
  return ts.forEachChild(ctx.sourceFile, function cb(node) {
    if (ts.isArrowFunction(node) && isGlobalScopeArrowFunction(node)) {
      ctx.addFailureAtNode(node, Rule.FAILURE_STRING)
    }
    return ts.forEachChild(node, cb)
  })
}
function isGlobalScopeArrowFunction(node) {
  return checkParentChainType(
    [
      ts.SyntaxKind.ArrowFunction,
      ts.SyntaxKind.VariableDeclaration,
      ts.SyntaxKind.VariableDeclarationList,
      ts.SyntaxKind.VariableStatement,
      ts.SyntaxKind.SourceFile,
    ],
    node
  )
}
function checkParentChainType(types, node) {
  var temp = node
  for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
    var t = types_1[_i]
    if (!temp || !(temp.kind === t)) {
      return false
    }
    temp = temp.parent
  }
  return true
}
