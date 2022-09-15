import { CeloTx } from '@celo/connect';
import { RemoteWallet } from '@celo/wallet-remote';
import { PairingTypes, SessionTypes } from '@walletconnect/types';
import { WalletConnectWalletOptions } from './types';
import { WalletConnectSigner } from './wc-signer';
export declare class WalletConnectWallet extends RemoteWallet<WalletConnectSigner> {
    private initOptions;
    private connectOptions;
    private client?;
    private pairing?;
    private pairingProposal?;
    private session?;
    constructor({ init, connect }: WalletConnectWalletOptions);
    /**
     * Pulled out to allow mocking
     */
    private getWalletConnectClient;
    /**
     * Get the URI needed for out of band session establishment
     */
    getUri(): Promise<string | void>;
    onSessionProposal: (sessionProposal: SessionTypes.Proposal) => void;
    onSessionCreated: (session: SessionTypes.Created) => void;
    onSessionUpdated: (session: SessionTypes.Update) => void;
    onSessionDeleted: () => void;
    onPairingProposal: (pairingProposal: PairingTypes.Proposal) => void;
    onPairingCreated: (pairing: PairingTypes.Created) => void;
    onPairingUpdated: (pairing: PairingTypes.Update) => void;
    onPairingDeleted: () => void;
    loadAccountSigners(): Promise<Map<string, WalletConnectSigner>>;
    /**
     * Gets the signer based on the 'from' field in the tx body
     * @param txParams Transaction to sign
     * @dev overrides WalletBase.signTransaction
     */
    signTransaction(txParams: CeloTx): Promise<import("@celo/connect").EncodedTransaction>;
    close: () => Promise<void>;
}
