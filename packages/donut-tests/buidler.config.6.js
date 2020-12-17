usePlugin('@nomiclabs/buidler-ethers')

module.exports = {
  defaultNetwork: 'espresso',
  networks: {
    espresso: {
      timeout: 60 * 1000,
      url: 'http://localhost:8545',
      gas: 6000000,
    },
  },
  solc: {
    version: '0.6.8',
  },
}
