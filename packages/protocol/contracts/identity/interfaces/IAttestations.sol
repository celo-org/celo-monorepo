pragma solidity ^0.5.3;


interface IAttestations {

  function initialize(address, uint256, address[] calldata, uint256[] calldata) external;

  function setAttestationRequestFee(address, uint256) external;
  function request(bytes32, uint256, address) external;
  function reveal(bytes32, bytes calldata, address, bool) external;
  function complete(bytes32, uint8, bytes32, bytes32) external;
  function revoke(bytes32, uint256) external;
  function withdraw(address) external;

  function setAttestationExpirySeconds(uint256) external;

  function setAccountDataEncryptionKey(bytes calldata) external;
  function setMetadataURL(string calldata) external;
  function setWalletAddress(address) external;
  function setAccount(bytes calldata, address) external;

  function getDataEncryptionKey(address) external view returns (bytes memory);
  function getWalletAddress(address) external view returns (address);
  function getMetadataURL(address) external view returns (string memory);

  function getAttestationRequestFee(address) external view returns (uint256);

  function lookupAccountsForIdentifier(bytes32) external view returns (address[] memory);

  function getAttestationStats(
    bytes32,
    address
  )
    external
    view
    returns (uint64, uint64);

  function getAttestationState(
    bytes32,
    address,
    address
  )
    external
    view
    returns (uint8, uint128);

  function getAttestationRequestFeeToken(address) external view returns (address);
  function getMostRecentAttestationRequest(address) external view returns (uint256);
}
