import { BuildArtifacts } from '@celo/protocol/lib/compatibility/build-artifacts'
import { ContractAST } from '@celo/protocol/lib/compatibility/contract-ast'
import { Artifact, getArtifactByName, getContractName } from '@celo/protocol/lib/compatibility/internal'
import {
  StorageLayout,
  extractStorageLayout,
  getStorageUpgradeReport,
  withValidationDefaults,
} from '@openzeppelin/upgrades-core'

/**
 * Storage layout of a contract, inherited variables included, most basic contract first.
 *
 * Built from the AST alone, the way the release builds have always been compared: tags
 * built before a `storageLayout` compiler output was requested carry no slot data, and
 * comparing an old build without it against a new build with it would not be like for like.
 */
export const getLayout = (artifact: Artifact, artifacts: BuildArtifacts): StorageLayout => {
  const contractAST = new ContractAST(artifact, artifacts)
  const decodeSrc = (node: { src: string }) => `${artifact.ast.absolutePath}:${node.src}`
  const layout: StorageLayout = { storage: [], types: {} }
  contractAST.getLinearizedBaseContracts().forEach((contract) => {
    const own = extractStorageLayout(contract, decodeSrc, contractAST.deref)
    layout.storage.push(...own.storage)
    Object.assign(layout.types, own.types)
  })
  return layout
}

export interface ASTStorageCompatibilityReport {
  contract: string
  compatible: boolean
  errors: string[]
  expanded?: boolean
}

// Minimal view of upgrades-core's storage operations; only the fields read here.
interface LayoutField {
  label: string
  type: { item: { label: string } }
}

interface TypeChange {
  kind: string
  inner?: TypeChange
}

interface LayoutOperation {
  kind: string
  original?: LayoutField
  updated?: LayoutField
  change?: TypeChange
}

// Renaming a variable to deprecated_<name>, or to anything starting with ignoreRenaming_,
// keeps its slot and marks it unused; the storage is untouched.
const isAllowedRename = (original: string, updated: string) =>
  `deprecated_${original}` === updated || updated.slice(0, 15) === 'ignoreRenaming_'

// Struct members are checked by generateStructsCompatibilityReport, which also decides when
// a struct may grow; the layout diff only reports what else changed about a variable.
const isStructMembersChange = (change: TypeChange | undefined): boolean =>
  change !== undefined &&
  (change.kind === 'struct members' ||
    ((change.kind === 'mapping value' || change.kind === 'array value') &&
      isStructMembersChange(change.inner)))

const isIncompatible = (operation: LayoutOperation) => {
  switch (operation.kind) {
    case 'rename':
      return !isAllowedRename(operation.original.label, operation.updated.label)
    case 'typechange':
      return !isStructMembersChange(operation.change)
    default:
      return true
  }
}

const operationToDescription = (operation: LayoutOperation) => {
  const { original, updated } = operation
  switch (operation.kind) {
    case 'typechange':
      return `variable ${updated.label} had type ${original.type.item.label}, now has type ${updated.type.item.label}`
    case 'insert':
      return `variable ${updated.label} was inserted`
    case 'delete':
      return `variable ${original.label} was removed`
    case 'rename':
      return `variable ${updated.label} was renamed from ${original.label}`
    case 'replace':
      return `variable ${updated.label} was replaced from ${original.label}`
    case 'layoutchange':
      return `variable ${updated.label} moved to a different storage position`
    default:
      return `variable ${(updated || original).label} has an incompatible storage change (${operation.kind})`
  }
}

const generateLayoutCompatibilityReport = (oldLayout: StorageLayout, newLayout: StorageLayout) => {
  const report = getStorageUpgradeReport(oldLayout, newLayout, withValidationDefaults({}))
  const incompatibilities = (report.ops as LayoutOperation[]).filter(isIncompatible)
  return {
    compatible: incompatibilities.length === 0,
    errors: incompatibilities.map(operationToDescription),
  }
}

interface StructMember {
  label: string
  type: string
}

interface StructDefinition {
  label: string
  members: StructMember[]
}

// Splits a solc type identifier as normalized by upgrades-core, e.g.
// t_mapping(t_address,t_struct(Validator)123_storage), into head, arguments and tail.
const parseTypeId = (id: string): { head: string; args: string[]; tail: string } => {
  const open = id.indexOf('(')
  if (open === -1) {
    return { head: id, args: [], tail: '' }
  }
  const args: string[] = []
  let depth = 0
  let start = open + 1
  let close = open
  for (let i = open; i < id.length; i++) {
    if (id[i] === '(') {
      depth++
    } else if (id[i] === ')') {
      depth--
      if (depth === 0) {
        close = i
        break
      }
    } else if (id[i] === ',' && depth === 1) {
      args.push(id.slice(start, i))
      start = i + 1
    }
  }
  args.push(id.slice(start, close))
  return { head: id.slice(0, open), args, tail: id.slice(close + 1) }
}

const declaredName = (label: string) => label.replace(/^(struct|enum) /, '')

/**
 * A type identifier without the AST ids solc embeds in it, so that the same type compares
 * equal across two builds. Contract types count as addresses and function types as one
 * type, since neither changes the storage they take.
 */
export const canonicalType = (id: string, types: StorageLayout['types']): string => {
  const { head, args, tail } = parseTypeId(id)
  switch (head) {
    case 't_struct':
    case 't_enum':
    case 't_userDefinedValueType': {
      const name = types[id] ? declaredName(types[id].label) : args[0]
      return `${head}<${name}>`
    }
    case 't_contract':
      return 't_address'
    case 't_mapping':
      return `t_mapping<${canonicalType(args[0], types)},${canonicalType(args[1], types)}>`
    case 't_array': {
      const length = /^(\d+|dyn)/.exec(tail)[1]
      return `t_array:${length}<${canonicalType(args[0], types)}>`
    }
    default:
      return head.startsWith('t_function') ? 't_function' : id.replace(/_storage(_ptr)?$/, '')
  }
}

const structDefinitions = (layout: StorageLayout): { [name: string]: StructDefinition } => {
  const structs: { [name: string]: StructDefinition } = {}
  Object.entries(layout.types).forEach(([id, type]) => {
    if (id.startsWith('t_struct(') && type.members !== undefined) {
      const label = declaredName(type.label)
      structs[label] = {
        label,
        members: (type.members as { label: string; type: string }[]).map((member) => ({
          label: member.label,
          type: canonicalType(member.type, layout.types),
        })),
      }
    }
  })
  return structs
}

const compareStructDefinitions = (
  oldType: StructDefinition,
  newType: StructDefinition,
  structExpandable: boolean
) => {
  if (structExpandable && oldType.members.length < newType.members.length) {
    const expandableErrors = oldType.members
      .map((oldMember, i) => {
        const newMember = newType.members[i]

        if (oldMember.label !== newMember.label && `deprecated_${oldMember.label}` !== newMember.label) {
          return `struct ${newType.label} had ${oldMember.label} in slot ${i}, now has ${newMember.label}`
        }

        if (oldMember.type !== newMember.type) {
          return `struct ${newType.label}'s member ${newMember.label} changed type from ${oldMember.type} to ${newMember.type}`
        }
      })
      .filter((error) => error)

    if (expandableErrors.length === 0) {
      return {
        same: true,
        expanded: true,
        errors: [],
      }
    }
  }

  if (oldType.members.length !== newType.members.length) {
    return {
      same: false,
      errors: [`struct ${newType.label} has changed members`],
    }
  }

  const memberErrors = newType.members
    .map((newMember, i) => {
      const oldMember = oldType.members[i]
      if (oldMember.label !== newMember.label && `deprecated_${oldMember.label}` !== newMember.label) {
        return `struct ${newType.label} had ${oldMember.label} in slot ${i}, now has ${newMember.label}`
      }

      if (oldMember.type !== newMember.type) {
        return `struct ${newType.label}'s member ${newMember.label} changed type from ${oldMember.type} to ${newMember.type}`
      }

      return ''
    })
    .filter((error) => error !== '')

  return {
    same: memberErrors.length === 0,
    errors: memberErrors,
  }
}

// A struct may only grow when no state variable holds it directly, i.e. it lives in
// mappings or arrays, where every instance gets its own hashed slot range.
const isStructExpandable = (structLabel: string, oldLayout: StorageLayout) =>
  !oldLayout.storage.some(
    (variable) => canonicalType(variable.type, oldLayout.types) === `t_struct<${structLabel}>`
  )

const generateStructsCompatibilityReport = (
  oldLayout: StorageLayout,
  newLayout: StorageLayout
): { compatible: boolean; errors: any[]; expanded?: boolean } => {
  const oldStructs = structDefinitions(oldLayout)
  const newStructs = structDefinitions(newLayout)
  let compatible = true
  let errors = []
  let expanded: boolean

  Object.keys(newStructs).forEach((name) => {
    const oldType = oldStructs[name]
    const newType = newStructs[name]
    if (oldType === undefined || newType === undefined) {
      return
    }
    const structReport = compareStructDefinitions(oldType, newType, isStructExpandable(name, oldLayout))
    if (!structReport.same) {
      compatible = false
      errors = errors.concat(structReport.errors)
    }
    expanded = expanded || structReport.expanded
  })

  return {
    compatible,
    errors,
    expanded,
  }
}

export const generateCompatibilityReport = (
  oldArtifact: Artifact,
  oldArtifacts: BuildArtifacts,
  newArtifact: Artifact,
  newArtifacts: BuildArtifacts
): { contract: string; compatible: boolean; errors: any[]; expanded?: boolean } => {
  const oldLayout = getLayout(oldArtifact, oldArtifacts)
  const newLayout = getLayout(newArtifact, newArtifacts)
  const layoutReport = generateLayoutCompatibilityReport(oldLayout, newLayout)
  const structsReport = generateStructsCompatibilityReport(oldLayout, newLayout)

  if (!layoutReport.compatible) {
    console.log(getContractName(newArtifact), 'layoutReport incompatible', JSON.stringify(layoutReport.errors))
  }

  if (!structsReport.compatible) {
    console.log(getContractName(newArtifact), 'structsReport incompatible', JSON.stringify(structsReport.errors))
  }

  return {
    contract: getContractName(newArtifact),
    compatible: layoutReport.compatible && structsReport.compatible,
    errors: layoutReport.errors.concat(structsReport.errors),
    expanded: structsReport.expanded,
  }
}

export const reportLayoutIncompatibilities = (
  oldArtifactsSet: BuildArtifacts[],
  newArtifactsSets: BuildArtifacts[]
): ASTStorageCompatibilityReport[] => {
  let out: ASTStorageCompatibilityReport[] = []
  for (const newArtifacts of newArtifactsSets) {
    const reports = newArtifacts
      .listArtifacts()
      .filter((newArtifact: any) => {
        // TODO this code looks very repeated from ast-code.ts
        // Matches Foundry core contracts
        const foundryCoreContractPathPattern = /^contracts(-0\.8)?\//
        // Matches Foundry test resource contracts
        const foundryTestContractPathPattern = /^test-ts/
        const path = newArtifact.ast.absolutePath
        return foundryCoreContractPathPattern.test(path) || foundryTestContractPathPattern.test(path)
      })
      .map((newArtifact: any) => {
        for (const oldArtifacts of oldArtifactsSet) {
          const oldArtifact: any = getArtifactByName(getContractName(newArtifact), oldArtifacts)
          if (oldArtifact !== undefined) {
            return generateCompatibilityReport(oldArtifact, oldArtifacts, newArtifact, newArtifacts)
          }
        }

        // Generate an empty report for new contracts, which are, by definition, backwards
        // compatible.
        return {
          contract: getContractName(newArtifact),
          compatible: true,
          errors: [],
        }
      })

    out = [...out, ...reports]
  }
  return out
}
