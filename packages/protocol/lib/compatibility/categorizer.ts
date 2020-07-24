import {
  Change,
  ChangeVisitor,
  ContractKindChange, DeployedBytecodeChange, MethodAddedChange,
  MethodMutabilityChange, MethodParametersChange, MethodRemovedChange,
  MethodReturnChange, MethodVisibilityChange, NewContractChange,
  Visibility
} from '@celo/protocol/lib/compatibility/ast-code'

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
 *    Mutability, Params, Return Params, Method Removed, Contract type,
 *    Visibility changes
 *  Minor:
 *    Method Added, New Contract, Visibility (from Public to External) changes
 *  Patch:
 *    Bytecode (implementation) changes
 */
export class DefaultCategorizer implements Categorizer {
  onMethodMutability = (_change: MethodMutabilityChange): ChangeType => ChangeType.Major
  onMethodParameters = (_change: MethodParametersChange): ChangeType => ChangeType.Major
  onMethodReturn = (_change: MethodReturnChange): ChangeType => ChangeType.Major
  onMethodRemoved = (_change: MethodRemovedChange): ChangeType => ChangeType.Major
  onContractKind = (_change: ContractKindChange): ChangeType => ChangeType.Major

  onMethodAdded = (_change: MethodAddedChange): ChangeType => ChangeType.Minor
  onNewContract = (_change: NewContractChange): ChangeType => ChangeType.Minor
  onMethodVisibility = (change: MethodVisibilityChange): ChangeType => {
    if (change.oldValue === Visibility.EXTERNAL && change.newValue === Visibility.PUBLIC) {
      // Broader visibility, minor change
      return ChangeType.Minor
    }
    return ChangeType.Major
  }
  onDeployedBytecode = (_change: DeployedBytecodeChange): ChangeType => ChangeType.Patch
}