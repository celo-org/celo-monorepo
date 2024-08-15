/**
 * @notice Returns a list of elected validators with seats allocated to groups via the D'Hondt
 *   method.
 * @return The list of elected validators.
 */
function electValidator() external view returns (address[] memory) {
    return electNValidator(electableValidators.min, electableValidators.max);
}

/**
 * @notice Returns a list of elected validators with seats allocated to groups via the D'Hondt
 *   method.
 * @return The list of elected validators.
 * @dev See https://en.wikipedia.org/wiki/D%27Hondt_method#Allocation for more information.
 */
function electNValidator(
    uint256 minElectableValidators,
    uint256 maxElectableValidators
) public view returns (address[] memory) {
    // Groups must have at least `electabilityThreshold` proportion of the total votes to be
    // considered for the election.
    uint256 requiredVotes = electabilityThreshold
        .multiply(FixidityLib.newFixed(getTotalVotes()))
        .fromFixed();
    // Only consider groups with at least `requiredVotes` but do not consider more groups than the
    // max number of electable validators.
    uint256 numElectionGroups = votes.total.eligible.numElementsGreaterThan(
        requiredVotes,
        maxElectableValidators
    );
    address[] memory electionGroups = votes.total.eligible.headN(
        numElectionGroups
    );
    uint256[] memory numMembers = getValidators().getGroupsNumMembers(
        electionGroups
    );
    // Holds the number of members elected for each of the eligible validator groups.
    uint256[] memory numMembersElected = new uint256[](electionGroups.length);
    uint256 totalNumMembersElected = 0;

    uint256[] memory keys = new uint256[](electionGroups.length);
    FixidityLib.Fraction[]
        memory votesForNextMember = new FixidityLib.Fraction[](
            electionGroups.length
        );
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
        keys[i] = i;
        votesForNextMember[i] = FixidityLib.newFixed(
            votes.total.eligible.getValue(electionGroups[i])
        );
    }

    // Assign a number of seats to each validator group.
    while (
        totalNumMembersElected < maxElectableValidators &&
        electionGroups.length > 0
    ) {
        uint256 groupIndex = keys[0];
        // All electable validators have been elected.
        if (votesForNextMember[groupIndex].unwrap() == 0) break;
        // All members of the group have been elected
        if (numMembers[groupIndex] <= numMembersElected[groupIndex]) {
            votesForNextMember[groupIndex] = FixidityLib.wrap(0);
        } else {
            // Elect the next member from the validator group
            numMembersElected[groupIndex] = numMembersElected[groupIndex].add(
                1
            );
            totalNumMembersElected = totalNumMembersElected.add(1);
            // If there are already n elected members in a group, the votes for the next member
            // are total votes of group divided by n+1
            votesForNextMember[groupIndex] = FixidityLib
                .newFixed(
                    votes.total.eligible.getValue(electionGroups[groupIndex])
                )
                .divide(
                    FixidityLib.newFixed(numMembersElected[groupIndex].add(1))
                );
        }
        Heap.heapifyDown(keys, votesForNextMember);
    }
    require(
        totalNumMembersElected >= minElectableValidators,
        "Not enough elected validators"
    );
    // Grab the top validators from each group that won seats.
    address[] memory electedValidators = new address[](totalNumMembersElected);
    totalNumMembersElected = 0;
    for (uint256 i = 0; i < electionGroups.length; i = i.add(1)) {
        // We use the validating delegate if one is set.
        address[] memory electedGroupValidators = getValidators()
            .getTopGroupValidators(electionGroups[i], numMembersElected[i]);
        for (uint256 j = 0; j < electedGroupValidators.length; j = j.add(1)) {
            electedValidators[totalNumMembersElected] = electedGroupValidators[
                j
            ];
            totalNumMembersElected = totalNumMembersElected.add(1);
        }
    }
    return electedValidators;
}
