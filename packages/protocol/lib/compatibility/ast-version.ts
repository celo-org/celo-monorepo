/* eslint-disable max-classes-per-file: 0 */
import { Artifact, getContractName } from '@celo/protocol/lib/compatibility/internal';
import { ContractVersion, ContractVersionChecker, ContractVersionCheckerIndex, ContractVersionDelta, ContractVersionDeltaIndex, ContractVersionIndex, DEFAULT_VERSION_STRING } from '@celo/protocol/lib/compatibility/version';
import { EVM } from '@ethereumjs/evm'
import { Address, hexToBytes } from '@ethereumjs/util'
import { BuildArtifacts } from '@celo/protocol/lib/compatibility/build-artifacts'
import { toFunctionSelector } from 'viem'
import { isLibrary } from './report';

/**
 * A mapping {contract name => {@link ContractVersion}}.
 */
export class ASTContractVersions {
  static fromArtifacts = async (artifactsSet: BuildArtifacts[], newLinking: boolean): Promise<ASTContractVersions> => {
    const contracts = {}

    for (const artifacts of artifactsSet) {
      await Promise.all(artifacts.listArtifacts().filter(c => !isLibrary(getContractName(c), [artifacts])).map(async (artifact) => {
        contracts[getContractName(artifact)] = await getContractVersion(artifact, newLinking)
      }))
    }

    return new ASTContractVersions(contracts)
  }

  constructor(public readonly contracts: ContractVersionIndex) { }
}

/**
 * Gets the version of a contract by calling Contract.getVersionNumber() on
 * the contract deployed bytecode.
 *
 * If `newLinking` is true, expects `__$<hash>$__` style linking. Otherwise, `__<LibraryName>____`
 * style.
 *
 * If the contract version cannot be retrieved, returns version 1.1.0.0 by default.
 */
// Reading a version runs the contract's own bytecode, so this EVM has to understand every
// opcode the contracts are built with. cancun is the newest hardfork @ethereumjs/common 4.x
// marks final; its prague entry is a draft that still carries EIP-3074 (AUTH/AUTHCALL), which
// mainnet Prague dropped. solc emits no new opcodes for prague, so any evm_version up to and
// including prague in foundry.toml reads correctly on cancun.
const VERSION_CHECK_HARDFORK = 'cancun'

export async function getContractVersion(artifact: Artifact, newLinking: boolean): Promise<ContractVersion> {
  const evm = await EVM.create()
  evm.common.setHardfork(VERSION_CHECK_HARDFORK)
  // @ts-ignore
  const bytecode = artifact.deployedBytecode.object || artifact.deployedBytecode
  const data = toFunctionSelector('getVersionNumber()')
  const nullAddress = '0000000000000000000000000000000000000000'
  const compilerLinkRegex = newLinking ? /__\$[a-f0-9]{34}\$__/g : /__[A-Za-z0-9_]{36}__/g
  const linkedBytecode = bytecode.split(compilerLinkRegex).join(nullAddress)
  const result = await evm.runCall({
    to: Address.zero(),
    caller: Address.zero(),
    code: hexToBytes(linkedBytecode),
    isStatic: true,
    data: hexToBytes(data),
  })
  const exceptionError = result.execResult.exceptionError
  if (exceptionError === undefined) {
    const value = Buffer.from(result.execResult.returnValue)
    if (value.length === 4 * 32) {
      return ContractVersion.fromGetVersionNumberReturnValue(value)
    }
  } else if (`${exceptionError.error}`.includes('invalid opcode')) {
    // A contract without getVersionNumber reverts, which is what the default below is for.
    // An opcode this VM does not implement means the build targets an EVM version it does
    // not support, and every version would silently read as the default instead.
    throw new Error(
      `Cannot read the version of ${getContractName(artifact)}: its bytecode uses an opcode ` +
        `the version checker's EVM does not implement (${exceptionError.error}). The build ` +
        `targets an EVM version newer than that EVM supports.`
    )
  }
  // If we can't fetch the version number, assume default version.
  return ContractVersion.fromString(DEFAULT_VERSION_STRING)
}

export class ASTContractVersionsChecker {
  static create = async (oldArtifactsSet: BuildArtifacts[], newArtifactsSet: BuildArtifacts[], expectedVersionDeltas: ContractVersionDeltaIndex, newLinking: boolean): Promise<ASTContractVersionsChecker> => {
    const oldVersions = await ASTContractVersions.fromArtifacts(oldArtifactsSet, newLinking)
    const newVersions = await ASTContractVersions.fromArtifacts(newArtifactsSet, newLinking)
    const contracts = {}
    Object.keys(newVersions.contracts).map((contract: string) => {
      const versionDelta = expectedVersionDeltas[contract] === undefined ? ContractVersionDelta.fromChanges(false, false, false, false) : expectedVersionDeltas[contract]
      const oldVersion = oldVersions.contracts[contract] === undefined ? null : oldVersions.contracts[contract]
      contracts[contract] = new ContractVersionChecker(oldVersion, newVersions.contracts[contract], versionDelta)
    })
    return new ASTContractVersionsChecker(contracts)
  }

  constructor(public readonly contracts: ContractVersionCheckerIndex) { }

  /**
   * @return a new {@link ASTContractVersionsChecker} with the same contracts
   * excluding all those whose names match the {@param exclude} parameters.
   */
  excluding = (exclude: RegExp): ASTContractVersionsChecker => {
    const included = (contract: string): boolean => {
      if (exclude != null) {
        return !exclude.test(contract)
      }
      return true
    }
    const contracts = {}
    Object.keys(this.contracts).filter(included).map((contract: string) => {
      contracts[contract] = this.contracts[contract]
    })
    return new ASTContractVersionsChecker(contracts)
  }


  public mismatches = (): ASTContractVersionsChecker => {
    const mismatches = {}
    Object.keys(this.contracts).map((contract: string) => {
      if (!this.contracts[contract].matches()) {
        mismatches[contract] = this.contracts[contract]
      }
    })
    return new ASTContractVersionsChecker(mismatches)
  }

  public isEmpty = (): boolean => {
    return Object.keys(this.contracts).length === 0
  }
}
