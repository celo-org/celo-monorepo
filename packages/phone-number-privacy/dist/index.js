"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("firebase-functions"));
const logger_1 = __importDefault(require("./common/logger"));
const get_contact_matches_1 = require("./match-making/get-contact-matches");
const get_salt_1 = require("./salt-generation/get-salt");
// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getBlindedSalt" -H "Authorization: 0xdaf63ea42a092e69b2001db3826bc81dc859bffa4d51ce8943fddc8ccfcf6b2b1f55d64e4612e7c028791528796f5a62c1d2865b184b664589696a08c83fc62a00" -d '{"hashedPhoneNumber":"0x5f6e88c3f724b3a09d3194c0514426494955eff7127c29654e48a361a19b4b96","blindedQueryPhoneNumber":"n/I9srniwEHm5o6t3y0tTUB5fn7xjxRrLP1F/i8ORCdqV++WWiaAzUo3GA2UNHiB","account":"0x588e4b68193001e4d10928660aB4165b813717C0"}' -H 'Content-Type: application/json'
exports.getBlindedSalt = functions.https.onRequest(async (request, response) => {
    logger_1.default.info('Begin getBlindedSalt request');
    return get_salt_1.handleGetBlindedMessageForSalt(request, response);
});
// EG. curl -v "http://localhost:5000/celo-phone-number-privacy/us-central1/getContactMatches" -H "Authorization: <SIGNED_BODY>" -d '{"userPhoneNumber": "+99999999999", "contactPhoneNumbers": ["+5555555555", "+3333333333"], "account": "0x117ea45d497ab022b85494ba3ab6f52969bf6812"}' -H 'Content-Type: application/json'
exports.getContactMatches = functions.https.onRequest(async (request, response) => {
    logger_1.default.info('Begin getContactMatches request');
    return get_contact_matches_1.handleGetContactMatches(request, response);
});
//# sourceMappingURL=index.js.map