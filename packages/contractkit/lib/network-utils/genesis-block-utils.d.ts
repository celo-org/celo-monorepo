export declare const GenesisBlocksGoogleStorageBucketName = "genesis_blocks";
export declare class GenesisBlockUtils {
    /**
     * Fetches the genesis block (as JSON data) from Google Storage.
     * If the network is not working, the method will reject the returned promise
     * along with the response data from Google api.
     * @param networkName Name of the network to fetch genesis block for
     */
    static getGenesisBlockAsync(networkName: string): Promise<string>;
    static getChainIdFromGenesis(genesis: string): number;
}
