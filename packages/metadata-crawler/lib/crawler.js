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
const address_1 = require("@celo/utils/lib/address");
const async_1 = require("@celo/utils/lib/async");
const pg_1 = require("pg");
const web3_1 = __importDefault(require("web3"));
const logger_1 = require("./logger");
const CONCURRENCY = 10;
const PGUSER = process.env['PGUSER'] || 'postgres';
const PGPASSWORD = process.env['PGPASSWORD'] || '';
const PGHOST = process.env['PGHOST'] || '127.0.0.1';
const PGPORT = process.env['PGPORT'] || '5432';
const PGDATABASE = process.env['PGDATABASE'] || 'blockscout';
const PROVIDER_URL = process.env['PROVIDER_URL'] || 'http://localhost:8545';
const client = new pg_1.Client({
    user: PGUSER,
    password: PGPASSWORD,
    host: PGHOST,
    port: Number(PGPORT),
    database: PGDATABASE,
});
const kit = (0, contractkit_1.newKitFromWeb3)(new web3_1.default(PROVIDER_URL));
function jsonQuery(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let res = yield client.query(`SELECT json_agg(t) FROM (${query}) t`);
        return res.rows[0].json_agg;
    });
}
function createVerificationClaims(address, domain, verified, accounts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield addDatabaseVerificationClaims(address, domain, verified);
        yield (0, async_1.concurrentMap)(CONCURRENCY, accounts, (account) => addDatabaseVerificationClaims(account, domain, verified));
    });
}
function addDatabaseVerificationClaims(address, domain, verified) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const query = `INSERT INTO celo_claims (address, type, element, verified, timestamp, inserted_at, updated_at) VALUES
        (decode($1, 'hex'), 'domain', $2, $3, now(), now(), now())
        ON CONFLICT (address, type, element) DO
        UPDATE SET verified=$3, timestamp=now(), updated_at=now() `;
            // Trim 0x to match Blockscout convention
            const values = [(0, address_1.trimLeading0x)(address), domain, verified];
            yield client
                .query(query, values)
                .catch((err) => logger_1.logger.error({ err, query }, 'addDataBaseVerificationClaims error'))
                .then(() => logger_1.dataLogger.info({ domain, address }, 'VERIFIED_DOMAIN_CLAIM'));
        }
        catch (err) {
            logger_1.logger.error({ err }, 'addDataBaseVerificationClaims error');
        }
    });
}
function getVerifiedAccounts(metadata, address) {
    return __awaiter(this, void 0, void 0, function* () {
        const unverifiedAccounts = metadata.filterClaims(identity_1.ClaimTypes.ACCOUNT);
        const accountVerification = yield Promise.all(unverifiedAccounts.map((claim) => __awaiter(this, void 0, void 0, function* () {
            return ({
                claim,
                verified: yield (0, verify_1.verifyAccountClaim)(kit, claim, address),
            });
        })));
        const accounts = accountVerification
            .filter(({ verified }) => verified === undefined)
            .map((a) => a.claim.address);
        return accounts;
    });
}
function getVerifiedDomains(metadata, address, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const unverifiedDomains = metadata.filterClaims(identity_1.ClaimTypes.DOMAIN);
        const domainVerification = yield (0, async_1.concurrentMap)(CONCURRENCY, unverifiedDomains, (claim) => __awaiter(this, void 0, void 0, function* () {
            try {
                const verificationStatus = yield (0, verify_1.verifyDomainRecord)(kit, claim, address);
                logger.debug({ claim, verificationStatus }, `verified_domain`);
                return {
                    claim,
                    verified: verificationStatus === undefined,
                };
            }
            catch (err) {
                logger.error({ err, claim });
                return {
                    claim,
                    verified: false,
                };
            }
        }));
        const domains = domainVerification.filter(({ verified }) => verified).map((_) => _.claim.domain);
        return domains;
    });
}
function processDomainClaimForValidator(item) {
    return __awaiter(this, void 0, void 0, function* () {
        const itemLogger = logger_1.operationalLogger.child({ url: item.url, address: item.address });
        try {
            itemLogger.debug('fetch_metadata');
            const metadata = yield identity_1.IdentityMetadataWrapper.fetchFromURL(yield kit.contracts.getAccounts(), item.url);
            const verifiedAccounts = yield getVerifiedAccounts(metadata, item.address);
            const verifiedDomains = yield getVerifiedDomains(metadata, item.address, itemLogger);
            yield (0, async_1.concurrentMap)(CONCURRENCY, verifiedDomains, (domain) => createVerificationClaims(item.address, domain, true, verifiedAccounts));
            itemLogger.debug({
                verfiedAccountClaims: verifiedAccounts.length,
                verifiedDomainClaims: verifiedDomains.length,
            }, 'processDomainClaimForValidator done');
        }
        catch (err) {
            itemLogger.error({ err }, 'processDomainClaimForValidator error');
        }
    });
}
function processDomainClaims() {
    return __awaiter(this, void 0, void 0, function* () {
        let items = yield jsonQuery(`SELECT address, url FROM celo_account WHERE url is NOT NULL `);
        logger_1.operationalLogger.debug({ length: items.length }, 'fetching all accounts');
        items = items || [];
        items = items.map((a) => (Object.assign(Object.assign({}, a), { 
            // Addresses are stored by blockscout as just the bytes prepended with \x
            address: (0, address_1.normalizeAddressWith0x)(a.address.substring(2)) })));
        return (0, async_1.concurrentMap)(CONCURRENCY, items, (item) => processDomainClaimForValidator(item))
            .then(() => {
            logger_1.operationalLogger.info('Closing DB connecting and finishing');
        })
            .catch((err) => {
            logger_1.operationalLogger.error({ err }, 'processDomainClaimForValidator error');
            client.end();
            process.exit(1);
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.operationalLogger.info({ host: PGHOST }, 'Connecting DB');
        yield client.connect();
        client.on('error', (err) => {
            logger_1.operationalLogger.error({ err }, 'Reconnecting after error');
            client.connect();
        });
        yield processDomainClaims();
        client.end();
        process.exit(0);
    });
}
main().catch((err) => {
    logger_1.operationalLogger.error({ err });
    process.exit(1);
});
