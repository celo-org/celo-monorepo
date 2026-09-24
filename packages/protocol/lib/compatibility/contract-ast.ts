import { BuildArtifacts } from '@celo/protocol/lib/compatibility/build-artifacts'
import { getContractName } from '@celo/protocol/lib/compatibility/internal'
import type { ContractDefinition, FunctionDefinition, SourceUnit } from 'solidity-ast'
import { ASTDereferencer, astDereferencer } from 'solidity-ast/utils'

/**
 * Collects the AST of the artifact's source file and of everything it imports,
 * transitively.
 *
 * Node ids are only unique within one solc run, and a build can compile the same file in
 * several runs. Each import is therefore resolved to the AST whose SourceUnit id is the one
 * the import directive points at, so every AST in the closure comes from the run that
 * compiled the artifact.
 */
const collectImportClosure = (root: SourceUnit, artifacts: BuildArtifacts): SourceUnit[] => {
  const closure = new Map<number, SourceUnit>([[root.id, root]])
  const pending: SourceUnit[] = [root]
  while (pending.length > 0) {
    const unit = pending.pop()
    for (const node of unit.nodes) {
      if (node.nodeType !== 'ImportDirective' || closure.has(node.sourceUnit)) {
        continue
      }
      const imported = artifacts
        .getArtifactsFromSourcePath(node.absolutePath)
        .map((artifact) => artifact.ast as SourceUnit)
        .find((ast) => ast.id === node.sourceUnit)
      if (imported === undefined) {
        // A file declaring no contract, interface or library produces no artifact. Nothing
        // the compatibility checks resolve (contracts, their state variables and the types
        // those use) can live there without also being imported by a file that does.
        continue
      }
      closure.set(imported.id, imported)
      pending.push(imported)
    }
  }
  return [...closure.values()]
}

const dereferencers = new WeakMap<BuildArtifacts, Map<SourceUnit, ASTDereferencer>>()

/**
 * An AST dereferencer over the artifact's source file and its imports, cached per build
 * and source file since every contract of a file shares both.
 */
export const dereferencerFor = (artifact: any, artifacts: BuildArtifacts): ASTDereferencer => {
  let perBuild = dereferencers.get(artifacts)
  if (perBuild === undefined) {
    perBuild = new Map()
    dereferencers.set(artifacts, perBuild)
  }
  const root: SourceUnit = artifact.ast
  let deref = perBuild.get(root)
  if (deref === undefined) {
    const sources: { [path: string]: { ast: SourceUnit; id: number } } = {}
    collectImportClosure(root, artifacts).forEach((ast) => {
      sources[`${ast.absolutePath}#${ast.id}`] = { ast, id: ast.id }
    })
    deref = astDereferencer({ sources } as any)
    perBuild.set(root, deref)
  }
  return deref
}

/**
 * AST queries about one contract of a build.
 *
 * Mirrors the ContractAST helper of the retired @openzeppelin/upgrades SDK, which the
 * code-compatibility report was written against, including which functions count as
 * methods and how their selectors are spelled.
 */
export class ContractAST {
  readonly deref: ASTDereferencer

  constructor(private readonly artifact: any, artifacts: BuildArtifacts) {
    this.deref = dereferencerFor(artifact, artifacts)
  }

  getContractNode(): ContractDefinition {
    const name = getContractName(this.artifact)
    return this.artifact.ast.nodes.find(
      (node: any) => node.nodeType === 'ContractDefinition' && node.name === name
    )
  }

  /** The contract and its ancestors, most basic first unless `mostDerivedFirst`. */
  getLinearizedBaseContracts(mostDerivedFirst = false): ContractDefinition[] {
    const contracts = this.getContractNode().linearizedBaseContracts.map((id) =>
      this.deref('ContractDefinition', id)
    )
    return mostDerivedFirst ? contracts : contracts.reverse()
  }

  getMethods(): any[] {
    return ([] as any[])
      .concat(...this.getLinearizedBaseContracts().map((contract) => contract.nodes))
      .filter(
        (node: any) =>
          node.nodeType === 'FunctionDefinition' && node.name !== '' && node.name !== 'isConstructor'
      )
      .map((node: FunctionDefinition) => {
        const inputs = node.parameters.parameters.map(({ name, typeDescriptions }) => ({
          name,
          type: typeDescriptions.typeString,
        }))
        const selector = `${node.name}(${inputs.map(({ type }) => type).join(',')})`
        return { selector, inputs, ...node }
      })
  }
}
