export declare class StaticNodeUtils {
    static getStaticNodesGoogleStorageBucketName(): string;
    /**
     * Fetches the static nodes (as JSON data) from Google Storage.
     * If the network is not working, the method will reject the returned promise
     * along with the response data from Google api.
     * @param networkName Name of the network to fetch config for
     */
    static getStaticNodesAsync(networkName: string): Promise<string>;
}
