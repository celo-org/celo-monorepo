interface AddressWithNetwork {
    address: string;
    networkId: string;
}
export declare function parseAddress(addressLike: string): AddressWithNetwork;
export {};
