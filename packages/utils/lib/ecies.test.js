"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var ecies_1 = require("./ecies");
var eutil = require('ethereumjs-util');
describe('ECIES', function () {
    describe('encrypt', function () {
        it('should encrypt a message without error', function () {
            var privKey = crypto_1.randomBytes(32);
            var pubKey = eutil.privateToPublic(privKey);
            var message = new Buffer("foo");
            var encrypted = ecies_1.ECIES.Encrypt(pubKey, message);
            expect(encrypted.length).toBeGreaterThanOrEqual(113);
        });
        it('should throw an error if priv key is given', function () {
            var privKey = crypto_1.randomBytes(32);
            var message = new Buffer('foo');
            try {
                ecies_1.ECIES.Encrypt(privKey, message);
                expect(false).toBe(true);
            }
            catch (error) {
                // ok, encryption should not work when a priv key is given
            }
        });
    });
    describe('roundtrip', function () {
        it('should return the same plaintext after roundtrip', function () {
            var plaintext = new Buffer('spam');
            var privKey = crypto_1.randomBytes(32);
            var pubKey = eutil.privateToPublic(privKey);
            var encrypted = ecies_1.ECIES.Encrypt(pubKey, plaintext);
            var decrypted = ecies_1.ECIES.Decrypt(privKey, encrypted);
            expect(decrypted.toString()).toEqual(plaintext.toString());
        });
        it('should only decrypt if correct priv key is given', function () {
            var plaintext = new Buffer('spam');
            var privKey = crypto_1.randomBytes(32);
            var pubKey = eutil.privateToPublic(privKey);
            var fakePrivKey = crypto_1.randomBytes(32);
            try {
                ecies_1.ECIES.Encrypt(pubKey, plaintext);
                ecies_1.ECIES.Decrypt(fakePrivKey, plaintext);
                expect(false).toBe(true);
            }
            catch (error) {
                // ok, decryption should not work for incorrect priv key
            }
        });
        it('should be able to encrypt and decrypt a longer message (1024 bytes)', function () {
            var plaintext = crypto_1.randomBytes(1024);
            var privKey = crypto_1.randomBytes(32);
            var pubKey = eutil.privateToPublic(privKey);
            var encrypted = ecies_1.ECIES.Encrypt(pubKey, plaintext);
            var decrypted = ecies_1.ECIES.Decrypt(privKey, encrypted);
            expect(decrypted.toString()).toEqual(plaintext.toString());
        });
    });
});
describe('AES128CTR', function () {
    describe('encrypt', function () {
        it('should encrypt a message without error', function () {
            var plaintext = new Buffer('spam');
            var encKey = crypto_1.randomBytes(16);
            var macKey = crypto_1.randomBytes(16);
            var encrypted = ecies_1.ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext);
            expect(encrypted.length).toBeGreaterThanOrEqual(plaintext.length);
        });
    });
    describe('roundtrip', function () {
        it('should return the same plaintext after roundtrip', function () {
            var plaintext = new Buffer('spam');
            var encKey = crypto_1.randomBytes(16);
            var macKey = crypto_1.randomBytes(16);
            var encrypted = ecies_1.ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext);
            var decrypted = ecies_1.ECIES.AES128DecryptAndHMAC(encKey, macKey, encrypted);
            expect(decrypted.toString()).toEqual(plaintext.toString());
        });
        it('should only decrypt if correct priv key is given', function () {
            var plaintext = new Buffer('spam');
            var encKey = crypto_1.randomBytes(16);
            var macKey = crypto_1.randomBytes(16);
            var fakeKey = crypto_1.randomBytes(16);
            var encrypted = ecies_1.ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext);
            console.info(encrypted.toString('hex').length);
            var decrypted = ecies_1.ECIES.AES128DecryptAndHMAC(fakeKey, macKey, encrypted);
            expect(plaintext.equals(decrypted)).toBe(false);
        });
        it('should be able to encrypt and decrypt a longer message (1024 bytes)', function () {
            var plaintext = crypto_1.randomBytes(1024);
            var encKey = crypto_1.randomBytes(16);
            var macKey = crypto_1.randomBytes(16);
            var encrypted = ecies_1.ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext);
            var decrypted = ecies_1.ECIES.AES128DecryptAndHMAC(encKey, macKey, encrypted);
            expect(decrypted.toString()).toEqual(plaintext.toString());
        });
    });
    describe('authentication', function () {
        it('should reject invalid mac', function () {
            try {
                var plaintext = new Buffer('spam');
                var encKey = crypto_1.randomBytes(16);
                var macKey = crypto_1.randomBytes(16);
                var fakeKey = crypto_1.randomBytes(16);
                var encrypted = ecies_1.ECIES.AES128EncryptAndHMAC(encKey, macKey, plaintext);
                ecies_1.ECIES.AES128DecryptAndHMAC(encKey, fakeKey, encrypted);
                expect(true).toBe(false);
            }
            catch (e) {
                // Should in fact throw.
            }
        });
    });
});
//# sourceMappingURL=ecies.test.js.map