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
const contractkit_1 = require("@celo/contractkit");
const identity_1 = require("@celo/contractkit/lib/identity");
const verify_1 = require("@celo/contractkit/lib/identity/claims/verify");
const bignumber_js_1 = require("bignumber.js");
const fs_1 = __importDefault(require("fs"));
const googleapis_1 = require("googleapis");
const readline_1 = __importDefault(require("readline"));
process.on('unhandledRejection', (reason, _promise) => {
    // @ts-ignore
    console.log('Unhandled Rejection at:', reason.stack || reason);
    process.exit(0);
});
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
const LEADERBOARD_TOKEN = process.env['LEADERBOARD_TOKEN'] || 0;
const LEADERBOARD_SHEET = process.env['LEADERBOARD_SHEET'] || '1TxrgEaY7I9wc8eKE1zQrpBiCXwJWFiMufwbbgbLhLUU';
const LEADERBOARD_WEB3 = process.env['LEADERBOARD_WEB3'] || 'http://localhost:8545';
function getCredentials() {
    let credentials = process.env['LEADERBOARD_CREDENTIALS'];
    if (!credentials) {
        return fs_1.default.readFileSync('credentials.json');
    }
    return credentials;
}
function getMetadata(kit, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const accounts = yield kit.contracts.getAccounts();
        const url = yield accounts.getMetadataURL(address);
        console.log(address, 'has url', url);
        if (url === '')
            return contractkit_1.IdentityMetadataWrapper.fromEmpty(address);
        try {
            let data = yield contractkit_1.IdentityMetadataWrapper.fetchFromURL(kit, url);
            return data;
        }
        catch (err) {
            console.error('Cannot fetch metadata', err);
            return contractkit_1.IdentityMetadataWrapper.fromEmpty(address);
        }
    });
}
function dedup(lst) {
    return [...new Set(lst)];
}
function getClaims(kit, address, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (address.substr(0, 2) === '0x') {
            address = address.substr(2);
        }
        const res = [address];
        for (const claim of data.claims) {
            switch (claim.type) {
                case identity_1.ClaimTypes.KEYBASE:
                    break;
                case identity_1.ClaimTypes.ACCOUNT:
                    try {
                        const status = yield verify_1.verifyAccountClaim(kit, claim, '0x' + address);
                        if (status)
                            console.error('Cannot verify claim:', status);
                        else {
                            console.log('Claim success', address, claim.address);
                            res.push(claim.address);
                        }
                    }
                    catch (err) {
                        console.error('Cannot fetch metadata', err);
                    }
                default:
                    break;
            }
        }
        return dedup(res);
    });
}
function readSheet(cb) {
    const content = getCredentials();
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content.toString()), (auth) => {
        getInfo(auth, cb);
    });
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    if (LEADERBOARD_TOKEN) {
        oAuth2Client.setCredentials(JSON.parse(LEADERBOARD_TOKEN.toString()));
        callback(oAuth2Client);
    }
    // Check if we have previously stored a token.
    else
        fs_1.default.readFile(TOKEN_PATH, (err, token) => {
            if (err)
                return getNewToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token.toString()));
            callback(oAuth2Client);
        });
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err)
                return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs_1.default.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err)
                    return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}
function getInfo(auth, cb) {
    const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
    sheets.spreadsheets.values.get({
        spreadsheetId: LEADERBOARD_SHEET,
        range: 'TGCSO!A3:C',
    }, (err, res) => {
        if (err)
            return console.log('The API returned an error: ' + err);
        if (res == null)
            return;
        const rows = res.data.values;
        if (rows && rows.length) {
            cb(rows, sheets);
        }
        else {
            console.log('No data found.');
        }
    });
}
function makeRequest(sheets, column, data) {
    let req = {
        spreadsheetId: LEADERBOARD_SHEET,
        range: `TGCSO!${column}3`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            range: `TGCSO!${column}3`,
            majorDimension: 'COLUMNS',
            values: [data],
        },
    };
    sheets.spreadsheets.values.update(req, (err, res) => {
        console.log(res, err);
    });
}
function updateNames(kit, addresses, sheets) {
    return __awaiter(this, void 0, void 0, function* () {
        let accounts = yield kit.contracts.getAccounts();
        let data = [];
        for (let item of addresses) {
            if (!item)
                data.push('');
            else {
                let name = yield accounts.getName(item);
                console.log('Name for', item, name);
                data.push(name);
            }
        }
        makeRequest(sheets, 'D', data);
    });
}
function getClaimedAccounts(kit, address) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!address)
            return [];
        try {
            const metadata = yield getMetadata(kit, address);
            const res = getClaims(kit, address, metadata);
            return res;
        }
        catch (err) {
            console.error('Error', err);
            return [address];
        }
    });
}
function getBTUs(kit, accounts) {
    return __awaiter(this, void 0, void 0, function* () {
        let sum = new bignumber_js_1.BigNumber(0);
        for (const address of accounts) {
            try {
                const balance = yield kit.getTotalBalance(address);
                sum = sum.plus(balance.total);
            }
            catch (err) {
                console.error('Error', err);
            }
        }
        return sum.multipliedBy(new bignumber_js_1.BigNumber('1e-18')).toString(10);
    });
}
function updateBTUs(kit, rows, sheets) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = [];
        for (let item of rows) {
            try {
                let v = yield getBTUs(kit, item);
                console.log('BTU for', item[0], v);
                data.push(v);
            }
            catch (err) {
                console.error('Cannot find BTU for', item[0], err);
                data.push('');
            }
        }
        makeRequest(sheets, 'E', data);
    });
}
function getAttestations(kit, address) {
    return __awaiter(this, void 0, void 0, function* () {
        let attestations = yield kit._web3Contracts.getAttestations();
        let req = (yield attestations.getPastEvents('AttestationIssuerSelected', {
            fromBlock: 0,
            filter: { issuer: address },
        })).length;
        let full = (yield attestations.getPastEvents('AttestationCompleted', {
            fromBlock: 0,
            filter: { issuer: address },
        })).length;
        return { req, full };
    });
}
function updateAttestations(kit, rows, sheets) {
    return __awaiter(this, void 0, void 0, function* () {
        let data = [];
        for (let item of rows) {
            let address = item[0];
            if (!address)
                data.push('=0');
            else {
                try {
                    let reqAcc = 0;
                    let fullAcc = 0;
                    for (let account of item) {
                        let { req, full } = yield getAttestations(kit, account);
                        reqAcc += req;
                        fullAcc += full;
                    }
                    console.log('Attestations requested', reqAcc, 'fulfilled', fullAcc, 'by', address);
                    if (reqAcc == 0)
                        data.push('=0');
                    else
                        data.push('=' + (fullAcc / reqAcc).toString());
                }
                catch (err) {
                    console.error('Cannot resolve attestations for', address, err);
                    data.push('=0');
                }
            }
        }
        makeRequest(sheets, 'G', data);
    });
}
function main() {
    const kit = contractkit_1.newKit(LEADERBOARD_WEB3);
    readSheet((rows, sheets) => __awaiter(this, void 0, void 0, function* () {
        let addresses = rows.map((a) => a[0]);
        updateNames(kit, addresses, sheets);
        //    let accounts = await Promise.all(addresses.map((address) => getClaimedAccounts(kit, address)))
        let accounts = [];
        for (let address of addresses) {
            accounts.push(yield getClaimedAccounts(kit, address));
        }
        updateBTUs(kit, accounts, sheets);
        updateAttestations(kit, accounts, sheets);
    }));
}
main();
//# sourceMappingURL=upload.js.map