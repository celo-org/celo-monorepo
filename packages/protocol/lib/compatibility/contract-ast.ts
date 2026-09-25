import { BuildArtifacts } from '@celo/protocol/lib/compatibility/build-artifacts'
import { getContractName } from '@celo/protocol/lib/compatibility/internal'
import type { ContractDefinition, FunctionDefinition, SourceUnit } from 'solidity-ast'
import { ASTDereferencer, astDereferencer } from 'solidity-ast/utils'

// The exact compiler an artifact was built with. Foundry runs solc once per version, so
// this identifies the run; a build set groups every patch version of one language
// generation, and ids from different runs can collide.
const compilerRun = (artifact: any): string =>
  artifact.metadata && artifact.metadata.compiler ? artifact.metadata.compiler.version : ''

/**
 * Collects the AST of the artifact's source file and of everything it imports,
 * transitively.
 *
 * Node ids are only unique within one solc run, and a build can compile the same file in
 * several runs. Each import is therefore resolved among the artifacts of the run that
 * compiled the artifact, to the AST whose SourceUnit id the import directive points at.
 */
const collectImportClosure = (
  root: SourceUnit,
  run: string,
  artifacts: BuildArtifacts
): SourceUnit[] => {
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
        .filter((artifact) => compilerRun(artifact) === run)
        .map((artifact) => artifact.ast as SourceUnit)
        .find((ast) => ast.id === node.sourceUnit)
      if (imported === undefined) {
        // A file declaring no contract, interface or library produces no artifact, so its
        // AST is not available; the retired SDK skipped such imports the same way. Should a
        // check ever need a node from it, the dereferencer throws rather than guessing.
        continue
      }
      closure.set(imported.id, imported)
      pending.push(imported)
    }
  }
  return [...closure.values()]
}

const dereferencers = new WeakMap<BuildArtifacts, Map<string, ASTDereferencer>>()

/**
 * An AST dereferencer over the artifact's source file and its imports, cached per build
 * and source file since every contract of a file shares both. Each contract's artifact
 * carries its own parsed copy of the file's AST, so the cache is keyed by the compiler
 * run, the file and the id solc gave it in that run, not by the AST object.
 */
export const dereferencerFor = (artifact: any, artifacts: BuildArtifacts): ASTDereferencer => {
  let perBuild = dereferencers.get(artifacts)
  if (perBuild === undefined) {
    perBuild = new Map()
    dereferencers.set(artifacts, perBuild)
  }
  const root: SourceUnit = artifact.ast
  const run = compilerRun(artifact)
  const key = `${run}|${root.absolutePath}#${root.id}`
  let deref = perBuild.get(key)
  if (deref === undefined) {
    const sources: { [path: string]: { ast: SourceUnit; id: number } } = {}
    collectImportClosure(root, run, artifacts).forEach((ast) => {
      sources[`${ast.absolutePath}#${ast.id}`] = { ast, id: ast.id }
    })
    deref = astDereferencer({ sources } as any)
    perBuild.set(key, deref)
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
