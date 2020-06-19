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
const async_1 = require("@celo/utils/lib/async");
const firebase_admin_1 = require("firebase-admin");
const google_libphonenumber_1 = require("google-libphonenumber");
const sleep_promise_1 = __importDefault(require("sleep-promise"));
const config_1 = require("./config");
const database_1 = require("./database");
const SMS_LENGTH_LIMIT = 160;
const NUM_VERIFIERS_TO_WAKE = 3;
const MAX_VERIFIER_ATTEMPT_COUNT = 20;
const phoneUtil = google_libphonenumber_1.PhoneNumberUtil.getInstance();
function sendSmsCode(address, phoneNumber, message) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Attempting to send sms verification code.');
        message = getFormattedMessage(message);
        if (config_1.alwaysUseTwilio) {
            console.info('Config set to always use Twilio');
            yield sendViaTextProvider(phoneNumber, message);
            return 'Twilio';
        }
        const verifiers = yield getRandomActiveVerifiers(NUM_VERIFIERS_TO_WAKE, phoneNumber);
        if (verifiers === null || verifiers.length === 0) {
            console.info('No suitable verifiers found. Using Twilio');
            yield sendViaTextProvider(phoneNumber, message);
            return 'Twilio';
        }
        const veriferIds = verifiers.map((v) => v.id).join(',');
        const messageId = yield database_1.saveMessage(phoneNumber, address, message, veriferIds);
        yield triggerVerifiersSendSms(verifiers, messageId);
        yield sleep_promise_1.default(config_1.smsAckTimeout);
        const messageSent = yield database_1.isMessageSent(messageId);
        if (messageSent) {
            console.info('Message was sent by verifier.');
            return messageId;
        }
        else {
            console.info('SMS timeout reached and message was not yet sent. Sending via Text provider');
            yield database_1.deleteMessage(messageId);
            yield sendViaTextProvider(phoneNumber, message);
            return 'Twilio';
        }
    });
}
exports.sendSmsCode = sendSmsCode;
function getFormattedMessage(message) {
    // Add app signature to enable SMS retriever API
    message = `<#> ${message} ${config_1.appSignature}`;
    if (message.length >= SMS_LENGTH_LIMIT) {
        console.warn('SMS too long, attempting to shorten', message);
        // TODO remove when miner nodes don't include this string anymore
        message = message.replace('Celo verification code: ', '');
        console.info('New message', message);
    }
    return message;
}
const NEXMO_COUNTRY_CODES = ['MX', 'US'];
function sendViaTextProvider(phoneNumber, messageText) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.info('Sending message via text provider');
            const countryCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber));
            if (countryCode === undefined) {
                throw new Error('Could not detect country code of ' + phoneNumber);
            }
            if (NEXMO_COUNTRY_CODES.indexOf(countryCode) === -1) {
                yield config_1.getTwilioClient().messages.create({
                    body: messageText,
                    from: config_1.twilioPhoneNum,
                    to: phoneNumber,
                });
                console.info('Message sent via Twilio');
            }
            else {
                yield async_1.retryAsyncWithBackOff(config_1.sendSmsWithNexmo, 10, [countryCode, phoneNumber, messageText], 1000);
                console.info('Message sent via Nexmo');
            }
        }
        catch (e) {
            console.error('Failed to send text message via txt provider', e);
            throw new Error('Failed to send text message via txt provider' + e);
        }
    });
}
function getRandomActiveVerifiers(numToSelect, phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const verifiers = yield database_1.getActiveVerifiers();
        if (!verifiers || Object.keys(verifiers).length === 0) {
            console.info('No verifiers found in database');
            return null;
        }
        // Firebase DB queries only allows for a single filter so we do additional filtering here
        // Find active verifiers in the regionCode that aren't already assigned to a message
        // for that same target phone number
        const regionCode = phoneUtil.getRegionCodeForNumber(phoneUtil.parse(phoneNumber));
        console.info(`Detected region code ${regionCode} for phone ${phoneNumber}`);
        const preAssignedVerifiers = yield getVerifiersAssignedToNumber(phoneNumber);
        const regionalVerifiers = Object.keys(verifiers)
            .map((id) => {
            verifiers[id].id = id; // assign for convinience
            return verifiers[id];
        })
            .filter((verifier) => verifier.supportedRegion === regionCode &&
            !preAssignedVerifiers.has(verifier.id) &&
            verifier.phoneNum !== phoneNumber);
        console.info(`Found ${regionalVerifiers.length} regional active verifiers`);
        if (!regionalVerifiers || regionalVerifiers.length === 0) {
            return null;
        }
        // Select some number of verifiers randomly from the those eligible
        numToSelect = Math.min(numToSelect, regionalVerifiers.length);
        const selectedVerifiers = [];
        for (let i = 0; i < numToSelect; i++) {
            const index = Math.floor(Math.random() * regionalVerifiers.length);
            selectedVerifiers.push(regionalVerifiers[index]);
            regionalVerifiers.splice(index, 1);
        }
        return selectedVerifiers;
    });
}
function getVerifiersAssignedToNumber(phoneNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const assignedVerifiers = new Set();
        const messages = yield database_1.getMessagesForPhoneNumber(phoneNumber);
        if (messages) {
            // For every message, add each of it's verifier candidates
            for (const id of Object.keys(messages)) {
                const candidates = messages[id].verifierCandidates;
                if (!candidates) {
                    continue;
                }
                candidates.split(',').map((verifierId) => assignedVerifiers.add(verifierId));
            }
        }
        return assignedVerifiers;
    });
}
function triggerVerifiersSendSms(verifiers, messageId) {
    return __awaiter(this, void 0, void 0, function* () {
        yield Promise.all(verifiers.map((v) => sendVerifierPushNotification(messageId, v.fcmToken, v.id)));
        return Promise.all(verifiers.map((v) => database_1.incrementVerifierAttemptCount(v.id)));
    });
}
function sendVerifierPushNotification(messageId, fcmToken, verifierId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!messageId) {
            console.error('No messageId provided to notifiy for');
            return;
        }
        if (!fcmToken) {
            console.error('No fcm token provided for verifier');
            return;
        }
        console.info(`Sending notification to fcm token ${fcmToken} for message ${messageId}`);
        // Prepare a message to be sent.
        const message = {
            data: {
                messageId,
            },
            android: {
                ttl: 3600 * 1000,
                priority: 'high',
            },
            token: fcmToken,
        };
        try {
            yield firebase_admin_1.messaging().send(message);
        }
        catch (error) {
            console.warn('Failed to send notification message', error);
            if (error.message && error.message.includes('Requested entity was not found')) {
                console.warn('Disabling the verifier that could not be reached to prevent retries');
                database_1.setVerifierProperties(verifierId, { isVerifying: false });
            }
        }
    });
}
// Disable verifiers that have too high attempt count
function disableInactiveVerifers() {
    return __awaiter(this, void 0, void 0, function* () {
        console.info('Finding verifiers with attempt count past threshold');
        const verifiers = yield database_1.getActiveVerifiers();
        if (!verifiers) {
            return;
        }
        return Promise.all(Object.keys(verifiers).map((id) => {
            if (verifiers[id].attemptCount >= MAX_VERIFIER_ATTEMPT_COUNT) {
                console.info('Attempt count exceeded for verifier, disabling:', id);
                return database_1.setVerifierProperties(id, { isVerifying: false });
            }
            return null;
        }));
    });
}
exports.disableInactiveVerifers = disableInactiveVerifers;
//# sourceMappingURL=verification.js.map