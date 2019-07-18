const mnemonic = require('./truffle.js').networks.development.mnemonic
const datadir = '.datadir'

module.exports = {
  datadir,
  copyPackages: ['openzeppelin-solidity'],
  testrpcOptions: '-d -m "' + mnemonic + '" -g 0 --db ' + datadir,
  port: 8545,
  skipFiles: [
    // Need custom precompiles
    'common/GoldToken.sol',
    'identity/Attestations.sol',

    // Proxies
    'common/GasCurrencyWhitelistProxy.sol',
    'common/GoldTokenProxy.sol',
    'common/MultiSigProxy.sol',
    'common/RegistryProxy.sol',
    'common/ValidatorsProxy.sol',
    'governance/BondedDepositsProxy.sol',
    'identity/AttestationsProxy.sol',
    'identity/EscrowProxy.sol',
    'stability/ExchangeProxy.sol',
    'stability/MedianatorProxy.sol',
    'stability/OracleProxy.sol',
    'stability/ReserveProxy.sol',
    'stability/StableTokenProxy.sol',

    // Test contracts
    'common/test/GetSetV0.sol',
    'common/test/GetSetV1.sol',
    'common/test/HasInitializer.sol',
    'common/test/MsgSenderCheck.sol',
    'governance/test/MockBondedDeposits.sol',
    'governance/test/MockElection.sol',
    'governance/test/MockGovernance.sol',
    'governance/test/SortedListTest.sol',
    'stability/test/FractionUtilTest.sol',
    'stability/test/MockGoldToken.sol',
    'stability/test/MockReserve.sol',
    'stability/test/MockStableToken.sol',
    'stability/test/SortedFractionMedianListTest.sol',
  ],
}
