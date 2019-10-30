pragma solidity ^0.5.3;


interface IAccounts {
  function isAccount(address) external view returns (bool);
  function getAccountFromActiveVoteSigner(address) external view returns (address);
  function voteSignerToAccount(address) external view returns (address);
  function getAccountFromActiveValidationSigner(address) external view returns (address);
  function validationSignerToAccount(address) external view returns (address);
  function getValidationSigner(address) external view returns (address);
  function getAccountFromActiveAttestationSigner(address) external view returns (address);
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
  function getName(address) external view returns (string memory);
}
