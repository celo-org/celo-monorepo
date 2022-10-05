
// dequeue invariant
ghost votedFor(address,uint256) returns bool { // voter to proposal id voted for
    init_state axiom forall address v. forall address p. !votedFor(v, p);
}

ghost dequeuedArray(uint256) returns uint256;

hook Sstore dequeued[INDEX uint256 i] uint256 id STORAGE {
    havoc dequeuedArray assuming (forall uint256 j. j != i => dequeuedArray@new(j) == dequeuedArray@old(j) && dequeuedArray@new(i) == id);
}

hook Sload uint256 id dequeued[INDEX uint256 i] STORAGE {
    require dequeuedArray(i) == id;
}

hook Sstore voters[KEY address x].(offset 96)/*referendumVotes*/[KEY uint256 indx].(offset 32)/*proposal ID */ uint256 id STORAGE {
    require 0 <= x && x <= max_uint160;
    havoc votedFor assuming votedFor@new(x,id) == true
        && (forall address y. forall uint z. (y != x || z != id => votedFor@new(y,z) == votedFor@old(y,z)));
} 

invariant referendumVotesAreConsistent(address v, uint i, env e) 
    getVotedId(v,i) != 0 => (proposalExists(e, getVotedId(v,i)) => votedFor(v,getVotedId(v,i))) {
    preserved {
        requireInvariant referendumVoteIDIsLessThanOrEqCounter(v);
    }
}

