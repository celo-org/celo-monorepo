import {
  ChangeType, ChangeVisitor,
  ContractTypeChange, DeployedBytecodeChange, MethodAddedChange,
  MethodMutabilityChange, MethodParametersChange, MethodRemovedChange,
  MethodReturnChange, MethodVisibilityChange, NewContractChange,
  VISIBILITY_EXTERNAL, VISIBILITY_PUBLIC
} from '@celo/protocol/lib/backward/ast-code'

/**
 * @returns the assigned {@link ChangeType} for each {@link Change}
 */
export interface Categorizer extends ChangeVisitor<ChangeType> {}

/**
 * Default implementation of {@link Categorizer}, where:
 *  Major:
 *    Mutability, Params, Return Params, Method Removed, Contract type,
 *    Visibilty changes
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
  onContractType = (_change: ContractTypeChange): ChangeType => ChangeType.Major

  onMethodAdded = (_change: MethodAddedChange): ChangeType => ChangeType.Minor
  onNewContract = (_change: NewContractChange): ChangeType => ChangeType.Minor
  onMethodVisibility = (change: MethodVisibilityChange): ChangeType => {
    if (change.oldValue === VISIBILITY_PUBLIC && change.newValue === VISIBILITY_EXTERNAL) {
      // Broader visibility, minor change
      return ChangeType.Minor
    }
    return ChangeType.Major
  }
  onDeployedBytecode = (_change: DeployedBytecodeChange): ChangeType => ChangeType.Patch
}