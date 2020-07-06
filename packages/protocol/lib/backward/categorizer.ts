import {
  ChangeType, ChangeVisitor,
  ContractTypeChange, DeployedBytecodeChange, MethodAddedChange,
  MethodMutabilityChange, MethodParametersChange, MethodRemovedChange,
  MethodReturnChange, MethodVisibilityChange, NewContractChange,
  VISIBILITY_EXTERNAL, VISIBILITY_PUBLIC
} from '@celo/protocol/lib/backward/ast-code'

export interface Categorizer extends ChangeVisitor<ChangeType> {}

export class DefaultCategorizer implements Categorizer {
  visitMethodMutability = (_change: MethodMutabilityChange): ChangeType => ChangeType.Major
  visitMethodParameters = (_change: MethodParametersChange): ChangeType => ChangeType.Major
  visitMethodReturn = (_change: MethodReturnChange): ChangeType => ChangeType.Major
  visitMethodRemoved = (_change: MethodRemovedChange): ChangeType => ChangeType.Major
  visitContractType = (_change: ContractTypeChange): ChangeType => ChangeType.Major

  visitMethodAdded = (_change: MethodAddedChange): ChangeType => ChangeType.Minor
  visitNewContract = (_change: NewContractChange): ChangeType => ChangeType.Minor
  visitMethodVisibility = (change: MethodVisibilityChange): ChangeType => {
    if (change.oldValue === VISIBILITY_PUBLIC && change.newValue === VISIBILITY_EXTERNAL) {
      // Broader visibility, minor change
      return ChangeType.Minor
    }
    return ChangeType.Major
  }
  visitDeployedBytecode = (_change: DeployedBytecodeChange): ChangeType => ChangeType.Patch
}