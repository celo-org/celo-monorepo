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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const celoEnv_1 = require("./celoEnv");
const configDummy_1 = require("./configDummy");
const database_1 = require("./database");
const rewards_1 = require("./rewards");
const validation_1 = require("./validation");
const verification_1 = require("./verification");
admin.initializeApp();
const app = express_1.default();
app.use(express_1.default.json());
app.post('/v0.1/sms/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.info('Post request received at /v0.1/sms/');
    try {
        const account = req.body.account;
        const phoneNumber = req.body.phoneNumber;
        const message = req.body.message;
        const issuer = req.body.issuer;
        const isValid = yield validation_1.validateRequest(phoneNumber, validation_1.parseBase64(account), validation_1.parseBase64(message), validation_1.parseBase64(issuer));
        if (!isValid) {
            console.error(`Error - invalid request: ${JSON.stringify(req.body)}`);
            res.status(401).json({ error: 'Invalid Request' });
            return;
        }
        const messageId = yield verification_1.sendSmsCode(validation_1.parseBase64(account), phoneNumber, message);
        res.json({ messageId });
    }
    catch (e) {
        console.error('Failed to send sms', e);
        res.status(500).send('Something went wrong');
    }
}));
app.post('/v0.1/rewards/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.info('Post request received at /v0.1/rewards/');
    if (!(yield database_1.tryAcquireRewardsLock())) {
        console.info('Could not acquire lock, pool already rewarding.');
        res.json({ success: true });
        return;
    }
    try {
        yield rewards_1.distributeAllPendingRewards();
        yield rewards_1.deleteRewardedMessages();
        yield verification_1.disableInactiveVerifers();
        yield database_1.releaseRewardsLock();
        res.json({ success: true });
    }
    catch (e) {
        console.error('Failed to distribute rewards', e);
        yield database_1.releaseRewardsLock();
        res.status(500).send('Unable to distribute rewards');
    }
}));
exports[`handleVerificationRequest${celoEnv_1.CELO_ENV}`] = functions.https.onRequest(app);
exports[`configDummy`] = configDummy_1.configDummy;
//# sourceMappingURL=index.js.map