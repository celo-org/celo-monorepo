pragma solidity ^0.5.3;

interface IAccounts {
  function isAccount(address) external view returns (bool);
  function activeVoteSignerToAccount(address) external view returns (address);
  function voteSignerToAccount(address) external view returns (address);
  function activeValidationSignerToAccount(address) external view returns (address);
  function validationSignerToAccount(address) external view returns (address);
  function getValidationSigner(address) external view returns (address);
  function activeAttesttationSignerToAccount(address) external view returns (address);
  function attestationSignerToAccount(address) external view returns (address);
  function getAttestationSigner(address) external view returns (address);

  function setAccountDataEncryptionKey(bytes calldata) external;
  function setMetadataURL(string calldata) external;
  function setName(string calldata) external;
  function setWalletAddress(address) external;
  function setAccount(string calldata, bytes calldata, address) external;

  function getDataEncryptionKey(address) external view returns (bytes memory);
  function getWalletAddress(address) external view returns (address);
  function getMetadataURL(address) external view returns (string memory);
  function batchGetMetadataURL(address[] calldata)
    external
    view
    returns (uint256[] memory, bytes memory);
  function getName(address) external view returns (string memory);
}
