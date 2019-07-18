import * as Lint from 'tslint'
import * as ts from 'typescript'

export class Rule extends Lint.Rules.AbstractRule {
  public static FAILURE_STRING = 'arrow functions forbidden in global scope, use named function'

  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithFunction(sourceFile, walk)
  }
}

// @ts-ignore
function walk(ctx: Lint.WalkContext) {
  return ts.forEachChild(ctx.sourceFile, function cb(node): void {
    if (ts.isArrowFunction(node) && isGlobalScopeArrowFunction(node)) {
      ctx.addFailureAtNode(node, Rule.FAILURE_STRING)
    }
    return ts.forEachChild(node, cb)
  })
}

function isGlobalScopeArrowFunction(node: ts.Node) {
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

function checkParentChainType(types: ts.SyntaxKind[], node: ts.Node) {
  let temp = node
  for (const t of types) {
    if (!temp || !(temp.kind === t)) {
      return false
    }
    temp = temp.parent
  }
  return true
}
