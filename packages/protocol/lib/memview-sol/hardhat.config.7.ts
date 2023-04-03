import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";

module.exports = {
  solidity: {
    version: "0.7.6",
  },
  networks: {
    coverage: {
      url: "http://localhost:8555",
    },
  },
};
