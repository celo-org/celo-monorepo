#!/usr/bin/env bash
set -euo pipefail

# Baklava: V2
# OPCM=0xd29841fbcff24eb5157f2abe7ed0b9819340159a
# DWI=0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796
# OPI=0xbed463769920dac19a7e2adf47b6c6bb6480bd97
# SCI=0x911ea44d22eb903515378625da3a0e09d2e1b074
# LCDMI=0x3d5a67747de7e09b0d71f5d782c8b45f6307b9fd
# LEBI=0x276d3730f219f7ec22274f7263180b8452b46d47
# LSBI=0xaf38504abc62f28e419622506698c5fa3ca15eda
# OMEFI=0x5493f4677a186f64805fe7317d6993ba4863988f
# DGFI=0x4bba758f006ef09402ef31724203f316ab74e4a0
# ASRI=0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2
# SUI=0x4da82a327773965b8d4d85fa3db8249b387458e7
# PVI=0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c

# Baklava: V3
# OPCM=0xdd07cb5e4b2e89a618f8d3a08c8ff753acfe1c68
# DWI=0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796
# OPI=0x215a5ff85308a72a772f09b520da71d3520e9ac7
# SCI=0x9c61c5a8ff9408b83ac92571278550097a9d2bb5
# LCDMI=0x807124f75ff2120b2f26d7e6f9e39c03ee9de212
# LEBI=0x7ae1d3bd877a4c5ca257404ce26be93a02c98013
# LSBI=0x28841965b26d41304905a836da5c0921da7dbb84
# OMEFI=0x6a52641d87a600ba103ccdfbe3eb02ac7e73c04a
# DGFI=0x4bba758f006ef09402ef31724203f316ab74e4a0
# ASRI=0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2
# SUI=0x4da82a327773965b8d4d85fa3db8249b387458e7
# PVI=0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c

# Alfajores: V2
# OPCM=0x643e6bcf2708bca3847d30719d94f405c5700c6a
# DWI=0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796
# OPI=0xbed463769920dac19a7e2adf47b6c6bb6480bd97
# SCI=0x911ea44d22eb903515378625da3a0e09d2e1b074
# LCDMI=0x3d5a67747de7e09b0d71f5d782c8b45f6307b9fd
# LEBI=0x276d3730f219f7ec22274f7263180b8452b46d47
# LSBI=0xaf38504abc62f28e419622506698c5fa3ca15eda
# OMEFI=0x5493f4677a186f64805fe7317d6993ba4863988f
# DGFI=0x4bba758f006ef09402ef31724203f316ab74e4a0
# ASRI=0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2
# SUI=0x4da82a327773965b8d4d85fa3db8249b387458e7
# PVI=0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c

# Alfajores: V3
# OPCM=0xaeded1bdf59805ed6298da57b0cb974dcc5feb48
# DWI=0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796
# OPI=0x215a5ff85308a72a772f09b520da71d3520e9ac7
# SCI=0x9c61c5a8ff9408b83ac92571278550097a9d2bb5
# LCDMI=0x807124f75ff2120b2f26d7e6f9e39c03ee9de212
# LEBI=0x7ae1d3bd877a4c5ca257404ce26be93a02c98013
# LSBI=0x28841965b26d41304905a836da5c0921da7dbb84
# OMEFI=0x6a52641d87a600ba103ccdfbe3eb02ac7e73c04a
# DGFI=0x4bba758f006ef09402ef31724203f316ab74e4a0
# ASRI=0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2
# SUI=0x4da82a327773965b8d4d85fa3db8249b387458e7
# PVI=0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c

# Mainnet: V2
# OPCM=0x597f110a3bee7f260b1657ab63c36d86b3740f36
# DWI=0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796
# OPI=0xbed463769920dac19a7e2adf47b6c6bb6480bd97
# SCI=0x911ea44d22eb903515378625da3a0e09d2e1b074
# LCDMI=0x3d5a67747de7e09b0d71f5d782c8b45f6307b9fd
# LEBI=0x276d3730f219f7ec22274f7263180b8452b46d47
# LSBI=0xaf38504abc62f28e419622506698c5fa3ca15eda
# OMEFI=0x5493f4677a186f64805fe7317d6993ba4863988f
# DGFI=0x4bba758f006ef09402ef31724203f316ab74e4a0
# ASRI=0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2
# SUI=0x4da82a327773965b8d4d85fa3db8249b387458e7
# PVI=0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c

# Mainnet: V3
# OPCM_CONTAINER=0x75a66e525fba131313ba986aa7c70f8e756d40a7
# OPCM_GTA=0x20d62d912b6b05e350441a2e7364c9bbe35870b3
# OPCM_DEPLOYER=0x8bf5c8c0d9b6a721fc70324a982df562bdd3ce70
# OPCM_UPGRADER=0xe565acc3c822d5d8298d9c7213a88dddc0ee93e1
# OPCM=0x2e8cd74af534f5eeb53f889d92fd4220546a15e7
# DWI=0x1e121e21e1a11ae47c0efe8a7e13ae3eb4923796
# OPI=0x215a5ff85308a72a772f09b520da71d3520e9ac7
# SCI=0x9c61c5a8ff9408b83ac92571278550097a9d2bb5
# LCDMI=0x807124f75ff2120b2f26d7e6f9e39c03ee9de212
# LEBI=0x7ae1d3bd877a4c5ca257404ce26be93a02c98013
# LSBI=0x28841965b26d41304905a836da5c0921da7dbb84
# OMEFI=0x6a52641d87a600ba103ccdfbe3eb02ac7e73c04a
# DGFI=0x4bba758f006ef09402ef31724203f316ab74e4a0
# ASRI=0x7b465370bb7a333f99edd19599eb7fb1c2d3f8d2
# SUI=0x4da82a327773965b8d4d85fa3db8249b387458e7
# PVI=0x37e15e4d6dffa9e5e320ee1ec036922e563cb76c

# Require env vars
[ -z "${NETWORK:-}" ] && echo "Need to set the NETWORK via env" && exit 1;
[ -z "${VERSION:-}" ] && echo "Need to set the VERSION via env" && exit 1;

# Check network
case $NETWORK in
  "mainnet")
    echo "Detected network: $NETWORK"
    BLOCKSCOUT_URL=https://eth.blockscout.com/api/
    CHAIN_ID=1
    ;;
  "holesky")
    echo "Detected network: $NETWORK"
    BLOCKSCOUT_URL=https://eth-holesky.blockscout.com/api/
    CHAIN_ID=17000
    ;;
  *)
    echo "Unsupported network: $NETWORK" && exit 1
    ;;
esac

# Check version
case $VERSION in
  "v2"|"v3")
    echo "Detected supported version: $VERSION"
    ;;
  *)
    echo "Invalid version: $VERSION" && exit 1
    ;;
esac

verify() {
    CONSTRUCTOR_SIG=${3:-}
    if [ "${BLOCKSCOUT_API_KEY:-}" ]; then
        echo ">>> [Blockscout] $2"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$BLOCKSCOUT_API_KEY \
                --verifier-url=$BLOCKSCOUT_URL \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$BLOCKSCOUT_API_KEY \
                --verifier-url=$BLOCKSCOUT_URL \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --watch
        fi
    fi
    if [ "${ETHERSCAN_API_KEY:-}" ]; then
        echo ">>> [Etherscan] $2"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$ETHERSCAN_API_KEY \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --etherscan-api-key=$ETHERSCAN_API_KEY \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --watch
        fi
    fi
    if [ "${TENDERLY_URL:-}" ] && [ "${TENDERLY_API_KEY:-}" ]; then
        echo ">>> [Tenderly] $2"
        if [ -z ${CONSTRUCTOR_SIG:-} ]; then
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --verifier-url=$TENDERLY_URL \
                --etherscan-api-key=$TENDERLY_API_KEY \
                --watch
        else
            forge verify-contract $1 $2 \
                --chain-id $CHAIN_ID \
                --verifier-url=$TENDERLY_URL \
                --etherscan-api-key=$TENDERLY_API_KEY \
                --constructor-args $(cast abi-encode $CONSTRUCTOR_SIG ${@:4}) \
                --watch
        fi
    fi
}

if [ $VERSION = "v3" ]; then
    verify $OPCM_CONTAINER OPContractsManagerContractsContainer "constructor((address,address,address,address,address,address,address,address,address),(address,address,address,address,address,address,address,address,address,address,address,address))" "(0x765c6637a370595845F637739279C353484a26A6,0xA643EA8ee60D92f615eC70AF0248c449bBCEcF4d,0x2Fa0D0f6d92061344Db35132379dB419bD1c56f7,0xA5d36DEaf2267B267278a4a1458deFe0d65620eb,0x7096758bDD076a4cC42255c278F2Cb216D6D8ce3,0x2E5A428E3C65080D51e9c0d581DDa85cE8489189,0xc10A417e3A00B3e6cC70bbB998b6ad3689CeBBB9,0x011d2556c6b858f5f5Fa69f33f0Cd8D52dE0E222,0xbbcC9cdDA0B1ea8058B45FA4DC56E43BA69890e1)" "(0x4da82a327773965b8d4D85Fa3dB8249b387458E7,0x37E15e4d6DFFa9e5E320Ee1eC036922E563CB76C,0x7aE1d3BD877a4C5CA257404ce26BE93A02C98013,0x215A5fF85308A72A772F09B520dA71D3520e9aC7,0x9c61C5a8FF9408B83ac92571278550097A9d2BB5,0x6A52641d87a600bA103CcdfbE3EB02Ac7E73C04A,0x807124F75FF2120b2f26D7e6f9e39C03ee9DE212,0x28841965B26d41304905A836Da5C0921DA7dBB84,0x4bbA758F006Ef09402eF31724203F316ab74e4a0,0x7b465370BB7A333f99edd19599EB7Fb1c2D3F8D2,0x1e121E21E1A11Ae47C0EFE8A7E13ae3eb4923796,0xaA59A0777648BC75cd10364083e878c1cCd6112a)"
    verify $OPCM_GTA OPContractsManagerGameTypeAdder "constructor(address)" $OPCM_CONTAINER
    verify $OPCM_DEPLOYER OPContractsManagerDeployer "constructor(address)" $OPCM_CONTAINER
    verify $OPCM_UPGRADER OPContractsManagerUpgrader "constructor(address)" $OPCM_CONTAINER
    verify $OPCM OPContractsManager "constructor(address,address,address,address,address,address,string,address)" $OPCM_GTA $OPCM_DEPLOYER $OPCM_UPGRADER "0x95703e0982140D16f8ebA6d158FccEde42f04a4C" "0x1b6dEB2197418075AB314ac4D52Ca1D104a8F663" "0x783A434532Ee94667979213af1711505E8bFE374" "celo-contracts/v3.0.0" "0x4092A77bAF58fef0309452cEaCb09221e556E112"
else
    verify $OPCM OPContractsManager "constructor(address,address,address,string,(address,address,address,address,address,address,address,address,address),(address,address,address,address,address,address,address,address,address,address,address,address),address)" "0x95703e0982140D16f8ebA6d158FccEde42f04a4C" "0x1b6dEB2197418075AB314ac4D52Ca1D104a8F663" "0x783A434532Ee94667979213af1711505E8bFE374" "celo-contracts/v2.0.0" "(0x765c6637a370595845F637739279C353484a26A6,0xA643EA8ee60D92f615eC70AF0248c449bBCEcF4d,0x2Fa0D0f6d92061344Db35132379dB419bD1c56f7,0xA5d36DEaf2267B267278a4a1458deFe0d65620eb,0x7096758bDD076a4cC42255c278F2Cb216D6D8ce3,0x2E5A428E3C65080D51e9c0d581DDa85cE8489189,0xc10A417e3A00B3e6cC70bbB998b6ad3689CeBBB9,0x011d2556c6b858f5f5Fa69f33f0Cd8D52dE0E222,0xbbcC9cdDA0B1ea8058B45FA4DC56E43BA69890e1)" "(0x4da82a327773965b8d4D85Fa3dB8249b387458E7,0x37E15e4d6DFFa9e5E320Ee1eC036922E563CB76C,0x276d3730f219f7ec22274f7263180b8452B46d47,0xBeD463769920dAc19a7E2aDf47B6C6Bb6480bD97,0x911EA44d22EB903515378625dA3a0E09D2E1B074,0x5493f4677A186f64805fe7317D6993ba4863988F,0x3d5a67747dE7E09b0d71F5d782c8b45f6307B9Fd,0xAF38504abC62F28e419622506698C5Fa3ca15EDA,0x4bbA758F006Ef09402eF31724203F316ab74e4a0,0x7b465370BB7A333f99edd19599EB7Fb1c2D3F8D2,0x1e121E21E1A11Ae47C0EFE8A7E13ae3eb4923796,0xaA59A0777648BC75cd10364083e878c1cCd6112a)" "0x4092A77bAF58fef0309452cEaCb09221e556E112"
fi
verify $DWI DelayedWETH "constructor(uint256)" 604800
verify $OPI OptimismPortal2 "constructor(uint256,uint256)" 604800 302400
verify $SCI SystemConfig
verify $LCDMI L1CrossDomainMessenger
verify $LEBI L1ERC721Bridge
verify $LSBI L1StandardBridge
verify $OMEFI OptimismMintableERC20Factory
verify $DGFI DisputeGameFactory
verify $ASRI AnchorStateRegistry
verify $SUI SuperchainConfig
verify $PVI ProtocolVersions
