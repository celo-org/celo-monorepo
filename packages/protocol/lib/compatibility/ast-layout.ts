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
// a struct may grow and compares the enums and value types its members use; the layout
// diff only reports what else changed about a variable.
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
 * type, since neither changes the storage they take. Enums carry their members and user
 * defined value types their underlying type, since changing either changes what the
 * stored values mean.
 */
export const canonicalType = (id: string, types: StorageLayout['types']): string => {
  const { head, args, tail } = parseTypeId(id)
  const type = types[id]
  const name = type ? declaredName(type.label) : args[0]
  switch (head) {
    case 't_struct':
      return `t_struct<${name}>`
    case 't_enum':
      return `t_enum<${name}:${type && type.members ? (type.members as string[]).join(',') : ''}>`
    case 't_userDefinedValueType': {
      const underlying = type && type.underlying ? canonicalType(type.underlying, types) : ''
      return `t_userDefinedValueType<${name}:${underlying}>`
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

const ENUM_TYPE = /t_enum<([^:<>]*):([^<>]*)>/g

const enumMembers = (type: string): string[][] =>
  [...type.matchAll(ENUM_TYPE)].map((match) => (match[2] === '' ? [] : match[2].split(',')))

/**
 * Whether a struct member of the old type can hold the new type. The types must be the
 * same, except that enums anywhere in them may gain members at the end: the values already
 * stored keep their meaning, which is not true when members are removed or reordered.
 */
const isCompatibleMemberType = (oldType: string, newType: string): boolean => {
  if (oldType === newType) {
    return true
  }
  if (oldType.replace(ENUM_TYPE, 't_enum<$1>') !== newType.replace(ENUM_TYPE, 't_enum<$1>')) {
    return false
  }
  const newEnums = enumMembers(newType)
  return enumMembers(oldType).every(
    (members, i) =>
      newEnums[i].length <= 256 && members.every((member, j) => newEnums[i][j] === member)
  )
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

        if (!isCompatibleMemberType(oldMember.type, newMember.type)) {
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

      if (!isCompatibleMemberType(oldMember.type, newMember.type)) {
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

type StructUse = 'variable' | 'member' | 'array element' | 'mapping value'

/**
 * How the layout's state variables reach each struct: held directly, as a member of
 * another struct, as an array element or as a mapping value.
 */
const structUses = (layout: StorageLayout): Map<string, Set<StructUse>> => {
  const uses = new Map<string, Set<StructUse>>()
  const visit = (id: string, use: StructUse, visiting: Set<string>) => {
    const { head, args } = parseTypeId(id)
    if (head === 't_struct') {
      const type = layout.types[id]
      const name = declaredName(type ? type.label : args[0])
      if (!uses.has(name)) {
        uses.set(name, new Set())
      }
      uses.get(name).add(use)
      if (visiting.has(id) || !type || !type.members) {
        return
      }
      visiting.add(id)
      ;(type.members as { type: string }[]).forEach((member) => visit(member.type, 'member', visiting))
      visiting.delete(id)
    } else if (head === 't_mapping') {
      visit(args[1], 'mapping value', visiting)
    } else if (head === 't_array') {
      visit(args[0], 'array element', visiting)
    }
  }
  layout.storage.forEach((variable) => visit(variable.type, 'variable', new Set()))
  return uses
}

// A struct may only grow when every use of it is as a mapping value: each value has its own
// hashed slot range, so new members land in slots nothing used. Held directly, inside
// another struct or in an array, a longer struct shifts whatever is stored after it.
const isStructExpandable = (uses: Map<string, Set<StructUse>>, structLabel: string) => {
  const structUse = uses.get(structLabel)
  return structUse !== undefined && [...structUse].every((use) => use === 'mapping value')
}

const generateStructsCompatibilityReport = (
  oldLayout: StorageLayout,
  newLayout: StorageLayout
): { compatible: boolean; errors: any[]; expanded?: boolean } => {
  const oldStructs = structDefinitions(oldLayout)
  const newStructs = structDefinitions(newLayout)
  const oldUses = structUses(oldLayout)
  let compatible = true
  let errors = []
  let expanded: boolean

  Object.keys(newStructs).forEach((name) => {
    const oldType = oldStructs[name]
    const newType = newStructs[name]
    if (oldType === undefined || newType === undefined) {
      return
    }
    const structReport = compareStructDefinitions(oldType, newType, isStructExpandable(oldUses, name))
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
