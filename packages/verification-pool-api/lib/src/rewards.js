"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const config_1 = require("./config");
const database_1 = require("./database");
const signing_utils_1 = require("./signing-utils");
const types_1 = require("./types");
const REWARDS_TIMEOUT = 1000 * 60 * 60; // 1 hour
function distributeAllPendingRewards() {
    return __awaiter(this, void 0, void 0, function* () {
        const sentMessages = yield database_1.getMessagesForState(types_1.MessageState.SENT);
        if (!sentMessages || Object.keys(sentMessages).length === 0) {
            console.info('No pending rewards.');
            return;
        }
        // Iterate through all sent messages and find the rewardable ones
        const pendingRewardsMessages = [];
        for (const id of Object.keys(sentMessages)) {
            const message = sentMessages[id];
            if (!message.verifierId || message.verifierId.toLowerCase() === 'twilio') {
                console.warn('Message sent by twilio or was improperly claimed');
                database_1.deleteMessage(id);
                continue;
            }
            if (isMessageExpired(message)) {
                console.warn(`Rewards expired for message ${id}`);
                // TODO(Rossy) Consider deleting this messages instead of leaving them in DB
                database_1.setMessageState(id, types_1.MessageState.EXPIRED);
                continue;
            }
            const verificationInfo = yield getVerificationInfo(message);
            if (!verificationInfo || !verificationInfo.isCompleted) {
                console.info('Verification not completed. skipping.', id);
                continue;
            }
            const rewardToken = yield config_1.getTokenType(verificationInfo.rewardsTokenAddress);
            if (!rewardToken) {
                console.error('Unable to resolve token type. skipping', id);
                continue;
            }
            pendingRewardsMessages.push(Object.assign(Object.assign({}, message), { id, rewardToken }));
        }
        if (!pendingRewardsMessages.length) {
            console.info('No rewardable messages found.');
            return;
        }
        const goldTx = yield withdrawRewardsIfPresent((yield config_1.getGoldToken()).options.address, types_1.TokenType.GOLD);
        const stableTx = yield withdrawRewardsIfPresent((yield config_1.getStableToken()).options.address, types_1.TokenType.DOLLAR);
        if (goldTx === null && stableTx === null) {
            console.info('No tokens to withdraw.');
        }
        // TODO: Make sure our balance is high enough to pay out.
        let distributeRewardsPromises = [];
        const verifierToMessages = getVerifierToMessagesMap(pendingRewardsMessages);
        // Iterate through all verifiers and pay out rewards for their messages
        for (const [verifierId, messages] of verifierToMessages) {
            const verifierInfo = yield getVerifierInfo(verifierId);
            if (!verifierInfo) {
                console.warn(`Could not find verifier ${verifierId}`);
                continue;
            }
            // Lookup will return 0 if the user is not yet verified.
            if (new bignumber_js_1.default(verifierInfo.address).isZero()) {
                console.info(`Verifier ${verifierId} not verified, so no rewards distributed.`);
                continue;
            }
            // We set the resolved verifier address so the app can use it
            // and we reset the attemptCount back to 0
            database_1.setVerifierProperties(verifierId, { address: verifierInfo.address, attemptCount: 0 });
            distributeRewardsPromises = distributeRewardsPromises.concat(distributeRewardsForVerifier(verifierInfo.address, verifierInfo.phoneNum, messages));
        }
        yield Promise.all(distributeRewardsPromises);
        console.info('Done distributing rewards');
    });
}
exports.distributeAllPendingRewards = distributeAllPendingRewards;
function deleteRewardedMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        const rewardedMessages = yield database_1.getMessagesForState(types_1.MessageState.REWARDED);
        if (!rewardedMessages || Object.keys(rewardedMessages).length === 0) {
            console.info('No rewarded messages to delete.');
            return;
        }
        console.info('Deleting expired rewarded messages');
        yield Promise.all(Object.keys(rewardedMessages).map((id) => {
            return isMessageExpired(rewardedMessages[id]) ? database_1.deleteMessage(id) : undefined;
        }));
        console.info('Done deleting expired rewarded messages.');
    });
}
exports.deleteRewardedMessages = deleteRewardedMessages;
function getVerifierInfo(verifierId) {
    return __awaiter(this, void 0, void 0, function* () {
        const verifer = yield database_1.getVerifier(verifierId);
        if (!verifer) {
            return null;
        }
        // @ts-ignore
        const verifierPhoneHash = config_1.web3.utils.soliditySha3({ type: 'string', value: verifer.phoneNum });
        const verifierAddress = yield (yield config_1.getAttestations()).methods.lookup(verifierPhoneHash).call();
        return {
            address: verifierAddress,
            phoneNum: verifer.phoneNum,
        };
    });
}
// TODO use SDK or abe-utils for this
const verificationCodeRegex = new RegExp(/(.* |^)([a-zA-Z0-9=_-]{87,88}:[0-9]+:[0-9]+:[a-zA-Z0-9=_-]{27,28})($| .*)/);
function extractVerificationCodeFromMessage(message) {
    const matches = message.match(verificationCodeRegex);
    if (!matches || matches.length < 3) {
        return null;
    }
    return matches[2];
}
function getVerificationInfo(message) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO(asa): Use parseVerificationSms from SDK.
        const code = extractVerificationCodeFromMessage(message.message);
        if (!code) {
            console.error('Could not extract code from verification message');
            return null;
        }
        const messagePieces = code.split(':');
        const requestIndex = new bignumber_js_1.default(messagePieces[1]);
        const verificationIndex = new bignumber_js_1.default(messagePieces[2]).toNumber();
        // @ts-ignore soliditySha3 can take an object
        const requesterPhoneHash = config_1.web3.utils.soliditySha3({ type: 'string', value: message.phoneNum });
        // TODO(asa): Use parseVerificationRequest from SDK
        const verificationRequest = yield (yield config_1.getAttestations()).methods
            .getVerificationRequest(requesterPhoneHash, message.address, requestIndex)
            .call();
        if (verificationRequest[3][verificationIndex]) {
            console.info('Verification', requestIndex.toString(), verificationIndex.toString(), 'for', message.phoneNum, message.address, 'completed, eligible to distribute rewards.');
        }
        return {
            rewardsTokenAddress: verificationRequest[2],
            isCompleted: verificationRequest[3][verificationIndex],
        };
    });
}
function getVerifierToMessagesMap(pendingRewardsMessages) {
    const verifierToMessages = new Map();
    for (const message of pendingRewardsMessages) {
        if (!message.verifierId) {
            continue;
        }
        if (!(message.verifierId in verifierToMessages)) {
            verifierToMessages.set(message.verifierId, new Set());
        }
        verifierToMessages.get(message.verifierId).add(message);
    }
    return verifierToMessages;
}
function distributeRewardsForVerifier(verifierAddress, verifierPhoneNum, messages) {
    if (!messages || !messages.size) {
        console.info('No messages to distribute for.');
        return null;
    }
    // Group messages by their reward token
    const tokenToMessages = new Map();
    for (const m of messages) {
        if (!tokenToMessages.has(m.rewardToken)) {
            tokenToMessages.set(m.rewardToken, []);
        }
        tokenToMessages.get(m.rewardToken).push(m);
    }
    const distributionPromises = [];
    for (const [token, tokenMessages] of tokenToMessages) {
        distributionPromises.push(distributeRewardsForToken(token, verifierAddress, verifierPhoneNum, tokenMessages));
    }
    return distributionPromises;
}
function distributeRewardsForToken(token, verifierAddress, verifierPhoneNum, messages) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!messages || !messages.length) {
            console.info('No messages to distribute for.');
            return null;
        }
        const tokenContract = yield config_1.getTokenContract(token);
        const attestationsContract = yield config_1.getAttestations();
        if (!tokenContract) {
            console.warn('Token contract is null');
            return null;
        }
        const rewardAmount = new bignumber_js_1.default((yield attestationsContract.methods.getIncentive(tokenContract.options.address).call())[1]).multipliedBy(messages.length);
        // TODO: Reward amount should be human readable.
        console.info(`Distributing ${rewardAmount.valueOf()} ${token} to ${verifierPhoneNum} for ${messages.length} verifications`);
        const txcomment = messages.map((m) => m.id).join(',');
        try {
            yield sendTransaction(tokenContract.options.address, tokenContract.methods.transferWithComment(verifierAddress, rewardAmount, txcomment));
            return Promise.all(messages.map((m) => database_1.setMessageState(m.id, types_1.MessageState.REWARDED)));
        }
        catch (err) {
            console.error(`Unable to distribute token rewards for ${verifierPhoneNum}`, err);
            return null;
        }
    });
}
function withdrawRewardsIfPresent(tokenAddress, tokenType) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Attempting to withdraw rewards for token', tokenType);
        const addressBasedEncryption = yield config_1.getAttestations();
        const pendingRewards = yield addressBasedEncryption.methods
            .pendingWithdrawals(tokenAddress, config_1.poolAddress)
            .call();
        if (new bignumber_js_1.default(pendingRewards).isZero()) {
            console.info('No rewards found for token', tokenType);
            return null;
        }
        console.info(`Withdrawing ${pendingRewards} tokens`);
        return sendTransaction(addressBasedEncryption.options.address, addressBasedEncryption.methods.withdraw(tokenAddress));
    });
}
function sendTransaction(address, tx, value = new bignumber_js_1.default(0)) {
    return __awaiter(this, void 0, void 0, function* () {
        const estimatedGas = yield tx.estimateGas({ from: config_1.poolAddress, value });
        // TODO(asa): Set gasPrice.
        const txObj = {
            from: config_1.poolAddress,
            to: address,
            gas: estimatedGas,
            data: tx.encodeABI(),
            chainId: config_1.networkid,
            value: value.toString(),
        };
        const signedTx = yield signing_utils_1.signTransaction(config_1.web3, txObj, config_1.poolPrivateKey);
        // @ts-ignore
        return config_1.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    });
}
function isMessageExpired(message) {
    return message.finishTime && Date.now() - message.finishTime > REWARDS_TIMEOUT;
}
//# sourceMappingURL=rewards.js.map