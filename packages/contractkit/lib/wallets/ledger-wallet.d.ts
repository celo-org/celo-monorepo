import { Address } from '../base';
import { RemoteWallet } from './remote-wallet';
import { Signer } from './signers/signer';
import { Wallet } from './wallet';
export declare const CELO_BASE_DERIVATION_PATH: string;
export declare enum AddressValidation {
    initializationOnly = 0,
    everyTransaction = 1,
    firstTransactionPerAddress = 2,
    never = 3
}
export declare function newLedgerWalletWithSetup(transport: any, derivationPathIndexes?: number[], baseDerivationPath?: string, ledgerAddressValidation?: AddressValidation): Promise<LedgerWallet>;
export declare class LedgerWallet extends RemoteWallet implements Wallet {
    readonly derivationPathIndexes: number[];
    readonly baseDerivationPath: string;
    readonly transport: any;
    readonly ledgerAddressValidation: AddressValidation;
    private ledger;
    /**
     * @param derivationPathIndexes number array of "address_index" for the base derivation path.
     * Default: Array[0..9].
     * Example: [3, 99, 53] will retrieve the derivation paths of
     * [`${baseDerivationPath}/3`, `${baseDerivationPath}/99`, `${baseDerivationPath}/53`]
     * @param baseDerivationPath base derivation path. Default: "44'/52752'/0'/0"
     * @param transport Transport to connect the ledger device
     */
    constructor(derivationPathIndexes?: number[], baseDerivationPath?: string, transport?: any, ledgerAddressValidation?: AddressValidation);
    protected loadAccountSigners(): Promise<Map<Address, Signer>>;
    private generateNewLedger;
    private retrieveAccounts;
    private retrieveAppConfiguration;
}
