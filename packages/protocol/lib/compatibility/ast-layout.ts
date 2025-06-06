import { Contract as Web3Contract } from '@celo/connect';
import { Artifact, TypeInfo } from '@celo/protocol/lib/compatibility/internal';
import {
  BuildArtifacts,
  Operation,
  StorageLayoutInfo,
  Contract as ZContract,
  compareStorageLayouts,
  getStorageLayout
} from '@openzeppelin/upgrades';
const Web3 = require('web3')

const web3 = new Web3(null)

// getStorageLayout needs an oz-sdk Contract class instance. This class is a
// subclass of Contract from web3-eth-contract, with an added .schema member and
// several methods.
//
// Couldn't find an easy way of getting one just from contract artifacts. But
// for getStorageLayout we really only need .schema.ast and .schema.contractName.
const addSchemaForLayoutChecking = (web3Contract: Web3Contract, artifact: any): ZContract => {
  // @ts-ignore
  const contract = web3Contract as Contract
  // @ts-ignore
  contract.schema = {}
  contract.schema.ast = artifact.ast
  contract.schema.contractName = artifact.contractName
  return contract
}

const makeZContract = (artifact: any): ZContract => {
  const contract = new web3.eth.Contract(artifact.abi)

  return addSchemaForLayoutChecking(contract, artifact)
}

export const getLayout = (artifact: Artifact, artifacts: BuildArtifacts) => {
  const contract = makeZContract(artifact)

  return getStorageLayout(contract, artifacts)
}

const selectIncompatibleOperations = (diff: Operation[]) =>
  diff.filter(operation => operation.action !== 'append'
    && !(operation.action === 'rename' && (((`deprecated_${operation.original.label}` === operation.updated.label) || (`ignoreRenaming_`  === operation.updated.label.slice(0, 15))) && operation.original.type === operation.updated.type)))

export interface ASTStorageCompatibilityReport {
  contract: string
  compatible: boolean
  errors: string[]
  expanded?: boolean
}

const operationToDescription = (operation: Operation) => {
  let message: string

  const updated = operation.updated
  const original = operation.original

  switch (operation.action) {
    case 'typechange':
      message = `variable ${updated.label} had type ${original.type}, now has type ${updated.type}`
      break
    case 'insert':
      message = `variable ${updated.label} was inserted`
      break
    case 'pop':
      message = `variable ${original.label} was removed`
      break
    case 'delete':
      message = `variable ${original.label} was removed`
      break
    case 'rename':
      message = `variable ${updated.label} was renamed from ${original.label}`
      break
    case 'replace':
      message = `variable ${updated.label} was replaced from ${original.label}`
      break
    case 'append':
      message = `variable ${updated.label} was appended`

    default:
      message = `unknown operation ${operation.action}`
  }

  return message
}

const generateLayoutCompatibilityReport = (oldLayout: StorageLayoutInfo, newLayout: StorageLayoutInfo) => {
  const diff = compareStorageLayouts(oldLayout, newLayout)
  const incompatibilities = selectIncompatibleOperations(diff)
  if (incompatibilities.length === 0) {
    return {
      compatible: true,
      errors: []
    }
  } else {
    return {
      compatible: false,
      errors: incompatibilities.map(operationToDescription)
    }
  }
}

const compareStructDefinitions = (oldType: TypeInfo, newType: TypeInfo, structExpandable: boolean) => {
  if (oldType.kind !== 'struct') {
    return {
      same: false,
      errors: [`${newType.label} wasn't a struct type, now is`]
    }
  }

  if (structExpandable && oldType.members.length < newType.members.length) {
    const expandableErrors = oldType.members.map((oldMember, i) => {
      const newMember = newType.members[i]

      if (oldMember.label !== newMember.label && `deprecated_${oldMember.label}` !== newMember.label) {
        return `struct ${newType.label} had ${oldMember.label} in slot ${i}, now has ${newMember.label}`
      }

      if (oldMember.type !== newMember.type) {
        return `struct ${newType.label}'s member ${newMember.label} changed type from ${oldMember.type} to ${newMember.type}`
      }
    }).filter(error => error)

    if (expandableErrors.length === 0) {
      return {
        same: true,
        expanded: true,
        errors: []
      }
    }
  }

  if (oldType.members.length !== newType.members.length) {
    return {
      same: false,
      errors: [`struct ${newType.label} has changed members`]
    }
  }

  const memberErrors = newType.members.map((newMember, i) => {
    const oldMember = oldType.members[i]
    if (oldMember.label !== newMember.label && `deprecated_${oldMember.label}` !== newMember.label) {
      return `struct ${newType.label} had ${oldMember.label} in slot ${i}, now has ${newMember.label}`
    }

    if (oldMember.type !== newMember.type) {
      return `struct ${newType.label}'s member ${newMember.label} changed type from ${oldMember.type} to ${newMember.type}`
    }

    return ''
  }).filter(error => error !== '')

  return {
    same: memberErrors.length === 0,
    errors: memberErrors
  }
}

// Struct is expandable only if used in mappings or arrays
const isStructExpandable = (oldType: TypeInfo, oldLayout: StorageLayoutInfo) => {
  const structString = `t_struct<${oldType.label}>`
  return !oldLayout.storage.some(storage => storage.type === structString)
}

const generateStructsCompatibilityReport = (oldLayout: StorageLayoutInfo, newLayout: StorageLayoutInfo): { compatible: boolean, errors: any[], expanded?: boolean } => {
  let compatible = true
  let errors = []
  let expanded: boolean

  Object.keys(newLayout.types).forEach(typeName => {
    const newType = newLayout.types[typeName]
    const oldType = oldLayout.types[typeName]

    if (newType.kind === 'struct' && oldType !== undefined) {
      const structExpandable = isStructExpandable(oldType, oldLayout)
      const structReport = compareStructDefinitions(oldType, newType, structExpandable)
      if (!structReport.same) {
        compatible = false
        errors = errors.concat(structReport.errors)
      }
      expanded = structReport.expanded
    }
  })

  return {
    compatible,
    errors,
    expanded
  }
}

export const generateCompatibilityReport = (oldArtifact: Artifact, oldArtifacts: BuildArtifacts,
  newArtifact: Artifact, newArtifacts: BuildArtifacts)
  : { contract: string, compatible: boolean, errors: any[], expanded?: boolean } => {
  const oldLayout = getLayout(oldArtifact, oldArtifacts)
  const newLayout = getLayout(newArtifact, newArtifacts)
  const layoutReport = generateLayoutCompatibilityReport(oldLayout, newLayout)
  const structsReport = generateStructsCompatibilityReport(oldLayout, newLayout)

  if (!layoutReport.compatible) {
    console.log(newArtifact.contractName, "layoutReport incompatible", JSON.stringify(layoutReport.errors));
  }

  if (!structsReport.compatible) {
    console.log(newArtifact.contractName, "structsReport incompatible", JSON.stringify(structsReport.errors));
  }

  return {
    contract: newArtifact.contractName,
    compatible: layoutReport.compatible && structsReport.compatible,
    errors: layoutReport.errors.concat(structsReport.errors),
    expanded: structsReport.expanded
  }
}

export const reportLayoutIncompatibilities = (oldArtifactsSet: BuildArtifacts[], newArtifactsSets: BuildArtifacts[]): ASTStorageCompatibilityReport[] => {
  let out: ASTStorageCompatibilityReport[] = []
  for (const newArtifacts of newArtifactsSets) {
    const reports = newArtifacts.listArtifacts().map((newArtifact) => {

      for (const oldArtifacts of oldArtifactsSet) {
        const oldArtifact = oldArtifacts.getArtifactByName(newArtifact.contractName)
        if (oldArtifact !== undefined) {
          return generateCompatibilityReport(oldArtifact, oldArtifacts, newArtifact, newArtifacts)
        }
      }

      // Generate an empty report for new contracts, which are, by definition, backwards
      // compatible.
      return {
        contract: newArtifact.contractName,
        compatible: true,
        errors: []
      }
    })

    out = [...out, ...reports]
  }
  return out
}
