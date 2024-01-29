/* eslint-disable max-classes-per-file: 0 */
/**
 * A code change detected from an old to a new version of a contract.
 */
export interface Change {
  getContract(): string
  accept<T>(visitor: ChangeVisitor<T>): T
}

/**
 * Visitor pattern implementation for the {@link Change} hierarchy.
 */
export interface ChangeVisitor<T> {
  onMethodMutability(change: MethodMutabilityChange): T
  onMethodReturn(change: MethodReturnChange): T
  onMethodVisibility(change: MethodVisibilityChange): T
  onMethodAdded(change: MethodAddedChange): T
  onMethodRemoved(change: MethodRemovedChange): T
  onContractKind(change: ContractKindChange): T
  onNewContract(change: NewContractChange): T
  onDeployedBytecode(change: DeployedBytecodeChange): T
  onLibraryLinking(change: LibraryLinkingChange): T
}

/**
 * Abstract implementation for the {@link Change} interface.
 */
abstract class ContractChange implements Change {
  type: string
  constructor(private readonly contract: string) {
    this.contract = contract
  }
  getContract() {
    return this.contract
  }

  abstract accept<T>(visitor: ChangeVisitor<T>): T
}

/**
 * A 'New Contract' change detected during the compatibility report. A
 * contract was found in the new folder that was not present in the old
 * folder. The id which is used to do this comparison is the name of the
 * contract, therefore not only adding a contract, but a name change
 * would produce this change.
 */
export class NewContractChange extends ContractChange {
  type = "NewContract"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onNewContract(this)
  }
}

/**
 * Abstract class providing standard 'old value => new value' functionality
 * for {@link ContractChange}
 */
abstract class ContractValueChange extends ContractChange {
  constructor(
    contract: string,
    public readonly oldValue: string,
    public readonly newValue: string) {
    super(contract)
  }
}

/**
 * The deployedBytecode field in the built json artifact has changed, with
 * the exception of metadata, from the old folder to the new one. This is
 * due to an implementation change.
 *
 * To avoid false positives, compile both old and new folders in the same
 * full path.
 */
export class DeployedBytecodeChange extends ContractChange {
  type = "DeployedBytecode"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onDeployedBytecode(this)
  }
}

/**
 * The Kind of a contract changed. Kind examples are
 * 'contract' or 'library'.
 */
export class ContractKindChange extends ContractValueChange {
  type = "ContractKind"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onContractKind(this)
  }
}

/**
 * Abstract implementation for the {@link Change} interface for
 * method changes.
 *
 * Since we use the {@link signature} as the id of the method, it's
 * the same value for the old and the new contract.
 */
abstract class MethodChange extends ContractChange {
  constructor(contract: string, private readonly signature: string) {
    super(contract)
  }
  getSignature() {
    return this.signature
  }
}

/**
 * A new method was found in the new version of the contract.
 */
export class MethodAddedChange extends MethodChange {
  type = "MethodAdded"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodAdded(this)
  }
}

/**
 * A method from the old version is not present in the new version.
 */
export class MethodRemovedChange extends MethodChange {
  type = "MethodRemoved"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodRemoved(this)
  }
}

/**
 * Abstract class providing standard 'old value => new value' functionality
 * for {@link MethodChange}
 */
abstract class MethodValueChange extends MethodChange {
  constructor(contract: string, signature: string,
    public readonly oldValue: string,
    public readonly newValue: string) {
    super(contract, signature)
  }
}

/**
 * The visibility (public/external) of a method changed.
 */
export class MethodVisibilityChange extends MethodValueChange {
  type = "MethodVisibility"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodVisibility(this)
  }
}

/**
 * The mutability (payable/pure/view...) of a method changed.
 */
export class MethodMutabilityChange extends MethodValueChange {
  type = "MethodMutability"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodMutability(this)
  }
}

/**
 * The return parameters of a method changed.
 */
export class MethodReturnChange extends MethodValueChange {
  type = "MethodReturn"
  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onMethodReturn(this)
  }
}

export class LibraryLinkingChange extends ContractChange {
  type = 'LibraryLinkingChange'

  constructor(contract: string, private readonly dependency: string) {
    super(contract)
  }

  getDependency() {
    return this.dependency
  }

  accept<T>(visitor: ChangeVisitor<T>): T {
    return visitor.onLibraryLinking(this)
  }
}
