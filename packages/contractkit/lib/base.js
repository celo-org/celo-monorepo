"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CeloContract;
(function (CeloContract) {
    CeloContract["Accounts"] = "Accounts";
    CeloContract["Attestations"] = "Attestations";
    CeloContract["BlockchainParameters"] = "BlockchainParameters";
    CeloContract["DoubleSigningSlasher"] = "DoubleSigningSlasher";
    CeloContract["DowntimeSlasher"] = "DowntimeSlasher";
    CeloContract["Election"] = "Election";
    CeloContract["EpochRewards"] = "EpochRewards";
    CeloContract["Escrow"] = "Escrow";
    CeloContract["Exchange"] = "Exchange";
    CeloContract["FeeCurrencyWhitelist"] = "FeeCurrencyWhitelist";
    CeloContract["Freezer"] = "Freezer";
    CeloContract["GasPriceMinimum"] = "GasPriceMinimum";
    CeloContract["GoldToken"] = "GoldToken";
    CeloContract["Governance"] = "Governance";
    CeloContract["LockedGold"] = "LockedGold";
    CeloContract["MultiSig"] = "MultiSig";
    CeloContract["Random"] = "Random";
    CeloContract["Registry"] = "Registry";
    CeloContract["Reserve"] = "Reserve";
    CeloContract["SortedOracles"] = "SortedOracles";
    CeloContract["StableToken"] = "StableToken";
    CeloContract["TransferWhitelist"] = "TransferWhitelist";
    CeloContract["Validators"] = "Validators";
})(CeloContract = exports.CeloContract || (exports.CeloContract = {}));
exports.ProxyContracts = [
    'AccountsProxy',
    'AttestationsProxy',
    'BlockchainParametersProxy',
    'DoubleSigningSlasherProxy',
    'DowntimeSlasherProxy',
    'ElectionProxy',
    'EpochRewardsProxy',
    'EscrowProxy',
    'ExchangeProxy',
    'FeeCurrencyWhitelistProxy',
    'FreezerProxy',
    'GasPriceMinimumProxy',
    'GoldTokenProxy',
    'GovernanceApproverMultiSigProxy',
    'GovernanceProxy',
    'LockedGoldProxy',
    'ReserveProxy',
    'ReserveSpenderMultiSigProxy',
    'StableTokenProxy',
    'SortedOraclesProxy',
    'RegistryProxy',
];
exports.AllContracts = Object.keys(CeloContract).map(function (k) { return CeloContract[k]; });
exports.NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
//# sourceMappingURL=base.js.map