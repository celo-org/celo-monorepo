import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";

module.exports = {
  solidity: {
    version: "0.6.8",
  },
  networks: {
    coverage: {
      url: "http://localhost:8555",
    },
  },
};
