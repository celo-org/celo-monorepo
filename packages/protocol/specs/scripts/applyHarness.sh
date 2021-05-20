# Private to internal to enable harnessing
perl -0777 -i -pe 's/private/internal/g' contracts/governance/Governance.sol

# Simplify FixidityLib.multiply
perl -0777 -i -pe 's/function multiply\(Fraction memory x, Fraction memory y\) internal pure returns \(Fraction memory\) \{/
function multiply\(Fraction memory x, Fraction memory y\)    internal     pure returns \(Fraction memory\) \{    
    uint tmp = x.value * y.value;
    require \(tmp\/x.value == y.value\);
    return Fraction\(tmp \/ FIXED1_UINT\);
\}
function multiplyOld\(Fraction memory x, Fraction memory y\) private pure returns \(Fraction memory\) \{/g' contracts/common/FixidityLib.sol

# Simplify _isProposalPassing
perl -0777 -i -pe 's/function _isProposalPassing\(Proposals.Proposal storage proposal\) internal view returns \(bool\) /

function _isProposalPassing\(Proposals.Proposal storage proposal\)    internal     view returns \(bool\) {
    return proposal.votes.yes > proposal.votes.no;
}

function _isProposalPassingOld\(Proposals.Proposal storage proposal\) private view returns \(bool\)/g' contracts/governance/Governance.sol





# Simplify ExtractFunctionSignature
#perl -0777 -i -pe 's/function extractFunctionSignature\(bytes memory input\) internal pure returns \(bytes4\)/
#function extractFunctionSignature2\(bytes calldata input\) external view returns \(bytes4 res\) \{ 
#    bytes memory input_ = input;
#    bytes32 x;
#    assembly \{
#      let d := add\(input_, 32\)
#      x := mload\(d\)
#    }
#    res = bytes4\(x\);
#  \}
#function extractFunctionSignature\(bytes memory input\)     internal     pure returns \(bytes4\)/g' contracts/common/ExtractFunctionSignature.sol

#perl -0777 -i -pe 's/extractFunctionSignature\(/extractFunctionSignature2\(/g' contracts/governance/Governance.sol