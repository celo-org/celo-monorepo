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
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = require("firebase-admin");
const celoEnv_1 = require("./celoEnv");
const types_1 = require("./types");
function getVerifier(id) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Getting verifier from db');
        if (!id) {
            console.error('Invalid verifier id', id);
            return null;
        }
        return (yield firebase_admin_1.database()
            .ref(`/${celoEnv_1.CELO_ENV}/mobileVerifiers/${id}`)
            .once('value')).val();
    });
}
exports.getVerifier = getVerifier;
function getActiveVerifiers() {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Getting all active verifiers from db');
        return (yield firebase_admin_1.database()
            .ref(`/${celoEnv_1.CELO_ENV}/mobileVerifiers`)
            .orderByChild('isVerifying')
            .equalTo(true)
            .once('value')).val();
    });
}
exports.getActiveVerifiers = getActiveVerifiers;
function incrementVerifierAttemptCount(id) {
    console.info('Incrementing attempt count for verifier', id);
    if (!id) {
        console.error('Invalid verifier id', id);
        return;
    }
    return firebase_admin_1.database()
        .ref(`/${celoEnv_1.CELO_ENV}/mobileVerifiers/${id}/attemptCount`)
        .transaction((currentCount) => {
        return (currentCount || 0) + 1;
    });
}
exports.incrementVerifierAttemptCount = incrementVerifierAttemptCount;
function setVerifierProperties(id, props) {
    console.info('Updating properties in db for verifier:', id);
    if (!id) {
        console.error('Invalid verifier id');
        return;
    }
    if (!props) {
        console.error('Invalid verifier updates');
        return;
    }
    return firebase_admin_1.database()
        .ref(`/${celoEnv_1.CELO_ENV}/mobileVerifiers/${id}`)
        .update(props);
}
exports.setVerifierProperties = setVerifierProperties;
function saveMessage(phoneNumber, address, smsText, verifierCandidates) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = {
            phoneNum: phoneNumber,
            message: smsText,
            verifierId: null,
            verifierCandidates,
            address,
            startTime: Date.now(),
            finishTime: null,
            messageState: types_1.MessageState.DISPATCHING,
        };
        console.info('Saving new message to db');
        const result = yield firebase_admin_1.database()
            .ref(`/${celoEnv_1.CELO_ENV}/messages`)
            .push(message);
        if (result.key) {
            return result.key;
        }
        else {
            throw new Error('Unable to save message');
        }
    });
}
exports.saveMessage = saveMessage;
function deleteMessage(id) {
    console.info('Deleting message from db', id);
    if (!id) {
        console.error('Invalid message id', id);
        return;
    }
    return firebase_admin_1.database()
        .ref(`/${celoEnv_1.CELO_ENV}/messages/${id}`)
        .remove();
}
exports.deleteMessage = deleteMessage;
function isMessageSent(id) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Checking if message is sent', id);
        if (!id) {
            console.error('Invalid message id', id);
            return false;
        }
        const message = yield firebase_admin_1.database()
            .ref(`/${celoEnv_1.CELO_ENV}/messages/${id}`)
            .once('value');
        if (!message || !message.val()) {
            console.warn('Message is null, returning isSent false.');
            return false;
        }
        return message.val().messageState >= types_1.MessageState.SENT;
    });
}
exports.isMessageSent = isMessageSent;
function getMessagesForPhoneNumber(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Getting messages for phone number from db');
        if (!phoneNumber) {
            console.error('Invalid message phone number', phoneNumber);
            return null;
        }
        return (yield firebase_admin_1.database()
            .ref(`/${celoEnv_1.CELO_ENV}/messages`)
            .orderByChild('phoneNum')
            .equalTo(phoneNumber)
            .once('value')).val();
    });
}
exports.getMessagesForPhoneNumber = getMessagesForPhoneNumber;
function getMessagesForState(messageState) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Getting messages from db of state:', messageState);
        return (yield firebase_admin_1.database()
            .ref(`/${celoEnv_1.CELO_ENV}/messages`)
            .orderByChild('messageState')
            .equalTo(messageState)
            .once('value')).val();
    });
}
exports.getMessagesForState = getMessagesForState;
function setMessageState(id, messageState) {
    console.info(`Updating state for message ${id} to ${messageState} in db`);
    if (!id) {
        console.error('Invalid message id', id);
        return;
    }
    return firebase_admin_1.database()
        .ref(`/${celoEnv_1.CELO_ENV}/messages/${id}`)
        .update({ messageState });
}
exports.setMessageState = setMessageState;
function tryAcquireRewardsLock() {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Trying to acquire rewards lock');
        try {
            const result = yield firebase_admin_1.database()
                .ref(`/${celoEnv_1.CELO_ENV}/rewards/isRewarding`)
                .transaction((isRewarding) => {
                if (isRewarding) {
                    // abort tx
                    return;
                }
                return true;
            });
            return result.committed;
        }
        catch (error) {
            console.error('Error trying to acquire lock', error);
            // Due to a known issue with FB DB transactions, it can sometimes happen that the tx
            // above claims to fail but the lock was actually set. We release the lock here
            // to cover that case.
            // https://groups.google.com/forum/#!topic/firebase-talk/OZTz5xqAQYE
            yield releaseRewardsLock();
            return false;
        }
    });
}
exports.tryAcquireRewardsLock = tryAcquireRewardsLock;
function releaseRewardsLock() {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Releasing rewards lock');
        yield firebase_admin_1.database()
            .ref(`/${celoEnv_1.CELO_ENV}/rewards/isRewarding`)
            .set(false);
        console.info('Done releasing lock');
    });
}
exports.releaseRewardsLock = releaseRewardsLock;
//# sourceMappingURL=database.js.map