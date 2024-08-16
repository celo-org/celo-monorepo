interface IBlocker {
    function isBlocked() external view returns (bool);
}


interface IEpochManager is IBlocker {
    function getCurrentEpoch() external view returns (uint256);
    function getElected() external view returns (address[] memory);
    function getElectedAtEpoch(
        uint256 epoch
    ) external view returns (address[] memory);
    function getFirstBlockAtEpoch(
        uint256 epoch
    ) external view returns (uint256);
    function getLastBlockAtEpoch(uint256 epoch) external view returns (uint256);

    function initializeSystem(
        uint256 firstEpochNumber,
        uint256 firstEpochBlock,
        uint256 firstEpochTimestamp, // TODO: do we need END timestamp?
        address[] memory firstElected
    ) external;
    function startNextEpochProcess() external;
    function finishNextEpochProcess() external;
    function isOnEpochProcess() external view returns (bool);
}

contract EpochManager is IEpochManager {
    struct epoch {
        uint256 firstBlock;
        uint256 lastBlock;
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 rewardsBlock;
    }

    // the length of an epoch in seconds
    uint256 epochTimeLength public;

    uint256 public firstKnownEpoch;
    uint256 public currentEpoch;
    address[] public elected;

    struct epochProcessState {
        bool started;     // TODO maybe a enum for future updates
        uint256 maxRewardsValidator;
        uint256 rewardsVoter;
        uint256 rewardsCommunity;
        uint256 rewardsCarbonFund;
        // map the groups and their processed status
        mapping (address => uint256) public processedGroups;
        // total number of groups that need to be processed
        uint256 toProcessGroups
    }

    epochProcessState public epochProcessing;
    mapping(uint256 => epoch) public epochs;
    mapping(address => uint256) public validatorPendingPayments;

    function initializeSystem(
        uint256 firstEpochNumber,
        uint256 firstEpochBlock,
        address[] memory firstElected
    ) external {
        // TODO can only be called once!
        firstKnownEpoch = firstEpochNumber;
        currentEpoch = firstEpochNumber;
        epochs[firstEpochNumber].firstBlock = firstEpochBlock;
        epochs[firstEpochNumber].elected = firstElected;
    }

    function getCurrentEpoch() external view returns (uint256) {
        return currentEpoch;
    }

    function getElected() external view returns (address[] memory) {
        return elected;
    }

    function getFirstBlockAtEpoch(
        uint256 epoch
    ) external view returns (uint256) {
        return epochs[epoch].firstBlock;
    }

    function getLastBlockAtEpoch(
        uint256 epoch
    ) external view returns (uint256) {
        return epochs[epoch].lastBlock;
    }

    function isOnEpochProcess() external view returns (bool) {
        return epochProcessing.started;
    }

    function isTimeForNextEpoch() external view returns (bool) {
        return block.timestamp >= epochs[currentEpoch].startTimestamp + epochTimeLength;
    }

    function isBlocked() external view returns (bool) {
        return isOnEpochProcess();
    }

    // TODO maybe "freezeEpochRewards" "prepareForNextEpoch" 
    function startNextEpochProcess() external noReentrancy {
        require(isReadyToStartEpoch(), "Epoch is not ready to start");
        require(!isOnEpochProcess(), "Epoch process is already started");
        epochProcesssing.started = true;

        epochs[currentEpoch].rewardsBlock = block.number;

        // calculate rewards        
        epochRewards.updateTargetVotingYielddistributeCeloEpochPayments();

        (
            uint256 maxRewardsValidator, 
            uint256 rewardsVoter, 
            uint256 rewardsCommunity, 
            uint256 rewardsCarbonFund
        ) = epochrewads.calculateTargetEpochRewards();
        epochProcessing.maxRewardsValidator = maxRewardsValidator;
        epochProcessing.rewardsVoter = rewardsVoter;
        epochProcessing.rewardsCommunity = rewardsCommunity;
        epochProcessing.rewardsCarbonFund = rewardsCarbonFund;

        allocateValidatorsRewards();

        emit EpochProcessingStarted(epochNumber)

    }

    function finishNextEpochProcess(address[] groups, uint16[] leassers, uint16 greaters) external noReentrancy {
        require(isOnEpochProcess(), "Epoch process is not started");

        // finalize epoch
        // TODO last block should be the block before and timestamp from previous block
        epochs[currentEpoch].endTimestamp = block.timestamp;
        epochs[currentEpoch].lastBlock = block.number;

        // start new epoch
        currentEpoch++;
        epochs[currentEpoch].firstBlock = block.number;
        epochs[currentEpoch].startTimestamp = block.timestamp;

        // O(elected)
        for (uint i =0; i < elected.length; i++) {
            address group = validators.getGroup(elected[i]);
            if (epochProcessing.processedGroups[group] == 0) {
                epochProcessing.toProcessGroups++;
                epochProcessing.processedGroups[group] = 1;
            }
        }

        require(epochProcessing.toProcessGroups == groups.length, "number of groups does not match")

        // O(groups)
        for (uint i = 0; i < groups.length; i++) {
            // checks that group is acutally from elected group
            require(epochProcessing.processedGroups[groups[i]] == 1, "group not processed")
            // by doing this, we avoid processing a group twice
            delete epochProcessing.processedGroups[groups[i]];
            
            // TODO what happens to uptime?
            // TODO when checking what group the validator is member off, it should be done using membershipHistory, with function getMembershipInLastEpoch or similar
		    uint256 epochRewards = getElection().getGroupEpochRewards(groups[i], epochProcessing.rewardsVoter, uptimes);
		    getElection().distributeEpochRewards(groups[i], epochRewards, lessers[i] , greaters[i]);
        }

        celoDistributionSchedule.mint(address(CommunityFund), epochProcessing.rewardsCommunity)
	celoDistributionSchedule.mint(address(Carbon), epochProcessing.rewardsCarbonFund)


        // run elections
        elected = getElection().electValidators()

        // TODO check how to nullify stuct
        epochProcesssing.started = false;
        epochProcessing = new epochProcessState();
    }

    function allocateValidatorsRewards() {
        uint256 totalRewards = 0;
        for (uint i = 0; i < elected.length; i++) {
            uint256 validatorScore = scoreManager.getValidatorScore(elected[i]);
            uint256 validatorReward = validators.computeEpochReward(elected[i], validatorScore, epochProcessing.maxRewardsValidator);
            validatorPendingPayments[elected[i]] += validatorReward;
            totalRewards += validatorReward;
        }

	    // Mint all cUSD required for payment and the corresponding CELO	
	    StablToken.mint(address(this), totalRewards)
	    // this should have a setter for the oracle.	
	    CELOequivalent = IOracle(oracleAddress).getRate()*totalRewards
	    // this is not a mint anymore
        distributionSchedule.mintCelo(address(reserve), CELOequivalent)
    }
}




