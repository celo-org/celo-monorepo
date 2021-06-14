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
const contractkit_1 = require("@celo/contractkit");
const identity_1 = require("@celo/contractkit/lib/identity");
const verify_1 = require("@celo/contractkit/lib/identity/claims/verify");
const pg_1 = require("pg");
const GoogleSpreadsheet = require('google-spreadsheet');
function addressToBinary(a) {
    try {
        if (a.substr(0, 2) == '0x')
            return a.substr(2);
        else
            return a;
    }
    catch (_err) {
        return a;
    }
}
process.on('unhandledRejection', (reason, _promise) => {
    // @ts-ignore
    console.log('Unhandled Rejection at:', reason.stack || reason);
    process.exit(0);
});
const LEADERBOARD_DATABASE = process.env['LEADERBOARD_DATABASE'] || 'blockscout';
const LEADERBOARD_SHEET = process.env['LEADERBOARD_SHEET'] || '1HCs1LZv1BOB1v2bVlH4qNPnxVRlYVhQ7CKhkMibE4EY';
const LEADERBOARD_WEB3 = process.env['LEADERBOARD_WEB3'] || 'http://localhost:8545';
const client = new pg_1.Client({ database: LEADERBOARD_DATABASE });
function readSheet() {
    return __awaiter(this, void 0, void 0, function* () {
        // spreadsheet key is the long id in the sheets URL
        const doc = new GoogleSpreadsheet(LEADERBOARD_SHEET);
        yield client.connect();
        doc.getInfo(function (_err, info) {
            let sheet = info.worksheets[0];
            sheet.getCells({
                'min-row': 3,
                'max-row': 500,
                'min-col': 1,
                'max-col': 3,
                'return-empty': true,
            }, function (err, cells) {
                console.log(err);
                let arr = {};
                for (let e of cells) {
                    // console.log(e)
                    arr[e.row] = arr[e.row] || {};
                    if (e.col == 1) {
                        arr[e.row].address = addressToBinary(e.value);
                    }
                    if (e.col == 3) {
                        arr[e.row].multiplier = e.numericValue;
                    }
                }
                let lst = Object.values(arr);
                updateDB(lst.filter((a) => !!a.address && a.multiplier !== 0), lst.filter((a) => !!a.address && a.multiplier === 0));
            });
        });
    });
}
function updateDB(lst, remove) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Adding', lst);
        yield client.query('INSERT INTO competitors (address, multiplier)' +
            " SELECT decode(m.address, 'hex') AS address, m.multiplier FROM json_populate_recordset(null::json_type, $1) AS m" +
            ' ON CONFLICT (address) DO UPDATE SET multiplier = EXCLUDED.multiplier RETURNING *', [JSON.stringify(lst)]);
        console.log('Removing', remove);
        for (let elem of remove) {
            yield client.query("DELETE FROM competitors WHERE address = '\\x" + elem.address.toString() + "'");
            yield client.query("DELETE FROM claims WHERE address = '\\x" + elem.address.toString() + "'");
        }
        yield readAssoc(lst.map((a) => a.address.toString()));
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
function processClaims(kit, address, info) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const lst = yield getClaims(kit, address, info);
            yield client.query('INSERT INTO claims (address, claimed_address)' +
                " SELECT decode(m.address,'hex'), decode(m.claimed_address,'hex') FROM json_populate_recordset(null::json_assoc, $1) AS m" +
                ' ON CONFLICT (address, claimed_address) DO NOTHING RETURNING *', [
                JSON.stringify(lst.map((a) => {
                    const res = { address: addressToBinary(address), claimed_address: addressToBinary(a) };
                    return res;
                })),
            ]);
        }
        catch (err) {
            console.error('Cannot process claims', err);
        }
    });
}
function readAssoc(lst) {
    return __awaiter(this, void 0, void 0, function* () {
        const kit = contractkit_1.newKit(LEADERBOARD_WEB3);
        const accounts = yield kit.contracts.getAccounts();
        yield Promise.all(lst.map((a) => __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield accounts.getMetadataURL(a);
                console.log(a, 'has url', url);
                let metadata;
                if (url == '')
                    metadata = identity_1.IdentityMetadataWrapper.fromEmpty(a);
                else {
                    try {
                        metadata = yield identity_1.IdentityMetadataWrapper.fetchFromURL(kit, url);
                    }
                    catch (err) {
                        console.error('Error reading metadata', a, err.toString());
                        metadata = identity_1.IdentityMetadataWrapper.fromEmpty(a);
                    }
                }
                yield processClaims(kit, a, metadata);
            }
            catch (err) {
                console.error('Bad address', a, err.toString());
            }
        })));
        client.end();
    });
}
readSheet();
//# sourceMappingURL=board.js.map