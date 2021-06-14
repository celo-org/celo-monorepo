export declare type Address = string;
export declare enum CeloContract {
    Accounts = "Accounts",
    Attestations = "Attestations",
    BlockchainParameters = "BlockchainParameters",
    DoubleSigningSlasher = "DoubleSigningSlasher",
    DowntimeSlasher = "DowntimeSlasher",
    Election = "Election",
    EpochRewards = "EpochRewards",
    Escrow = "Escrow",
    Exchange = "Exchange",
    FeeCurrencyWhitelist = "FeeCurrencyWhitelist",
    Freezer = "Freezer",
    GasPriceMinimum = "GasPriceMinimum",
    GoldToken = "GoldToken",
    Governance = "Governance",
    LockedGold = "LockedGold",
    MultiSig = "MultiSig",
    Random = "Random",
    Registry = "Registry",
    Reserve = "Reserve",
    SortedOracles = "SortedOracles",
    StableToken = "StableToken",
    TransferWhitelist = "TransferWhitelist",
    Validators = "Validators"
}
export declare const ProxyContracts: string[];
export declare type CeloToken = CeloContract.GoldToken | CeloContract.StableToken;
export declare const AllContracts: CeloContract[];
export declare const NULL_ADDRESS: string;
