import "solidity-coverage";
import "@nomiclabs/hardhat-ethers";

module.exports = {
  solidity: {
    version: "0.5.10",
  },
  networks: {
    coverage: {
      url: "http://localhost:8555",
    },
  },
};
