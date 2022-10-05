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

# Simplify Proposal's externaCall invocation to 'true' (ok because wrapped in a require, and choosing not to care about side effect - should be ECF)
perl -0777 -i -pe 's/function externalCall\(/function external_call2\(address destination, uint256 value, uint256 dataLength, bytes memory data\) private returns \(bool\) { return true; }
function  external_Call\(/g' contracts/governance/Proposals.sol
perl -0777 -i -pe 's/externalCall/external_call2/g' contracts/governance/Proposals.sol
