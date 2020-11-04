import {
  Change,
  ChangeVisitor,
  ContractKindChange, DeployedBytecodeChange, LibraryLinkingChange,
  MethodAddedChange, MethodMutabilityChange, MethodParametersChange,
  MethodRemovedChange, MethodReturnChange, MethodVisibilityChange, NewContractChange
} from '@celo/protocol/lib/compatibility/change'

/**
 * Change type categories according to semantic versioning standards
 */
export enum ChangeType { Patch, Minor, Major }

/**
 * @returns the assigned {@link ChangeType} for each {@link Change}
 */
export interface Categorizer extends ChangeVisitor<ChangeType> {}

/**
 * @returns a mapping of {ChangeType => Change[]} according to the {@link categorizer} used
 */
export function categorize(changes: Change[], categorizer: Categorizer): Change[][] {
  const byCategory = []
  for (const ct of Object.values(ChangeType)) {
    byCategory[ct] = []
  }
  changes.map(c => byCategory[c.accept(categorizer)].push(c))
  return byCategory
}

/**
 * Default implementation of {@link Categorizer}, where:
 *  Major:
 *    New contract, Mutability, Params, Return Params, Method Removed, Contract type changes
 *  Minor:
 *    Method Added
 *  Patch:
 *    Visibility, Bytecode (implementation) changes
 */
export class DefaultCategorizer implements Categorizer {
  onNewContract = (_change: NewContractChange): ChangeType => ChangeType.Major
  onMethodMutability = (_change: MethodMutabilityChange): ChangeType => ChangeType.Major
  onMethodParameters = (_change: MethodParametersChange): ChangeType => ChangeType.Major
  onMethodReturn = (_change: MethodReturnChange): ChangeType => ChangeType.Major
  onMethodRemoved = (_change: MethodRemovedChange): ChangeType => ChangeType.Major
  onContractKind = (_change: ContractKindChange): ChangeType => ChangeType.Major

  onMethodAdded = (_change: MethodAddedChange): ChangeType => ChangeType.Minor
  // Changing between public and external visibility has no impact.
  onMethodVisibility = (_change: MethodVisibilityChange): ChangeType => ChangeType.Patch
  onDeployedBytecode = (_change: DeployedBytecodeChange): ChangeType => ChangeType.Patch

  onLibraryLinking = (_change: LibraryLinkingChange): ChangeType => ChangeType.Patch
}
