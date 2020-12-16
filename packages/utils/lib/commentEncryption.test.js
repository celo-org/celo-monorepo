"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var elliptic_1 = require("elliptic");
var commentEncryption_1 = require("./commentEncryption");
var ec = new elliptic_1.ec('secp256k1');
describe('Comment Encryption', function () {
    var self = ec.keyFromPrivate(crypto_1.randomBytes(32));
    var selfPublic = Buffer.from(self.getPublic('hex'), 'hex');
    var selfPriv = Buffer.from(self.getPrivate('hex'), 'hex');
    var recip = ec.keyFromPrivate(crypto_1.randomBytes(32));
    var recipPublic = Buffer.from(recip.getPublic('hex'), 'hex');
    var recipPriv = Buffer.from(recip.getPrivate('hex'), 'hex');
    var comment = 'text';
    var emojis = '👮‍♂️👸👱‍♀️👷‍♂️🧟‍♀️🙅‍♀️🙅‍♂️☝️👉💪🌁⛺🏭🌅🚋🦄🐇🐧🐻🐐🐓🐊🐠🐬🦅🐠🦕🐙🏵🌺🌳🍀🌻🐝🍃';
    describe('Encrypt', function () {
        it('should encrypt message without error', function () {
            var _a = commentEncryption_1.encryptComment(comment, recipPublic, selfPublic), ciphertext = _a.comment, success = _a.success;
            expect(ciphertext.length).toBeGreaterThan(226 + 32);
            expect(success).toBeTruthy();
        });
    });
    describe('roundtrip', function () {
        it('should return the same plaintext as sender', function () {
            var encryptedData = commentEncryption_1.encryptComment(comment, recipPublic, selfPublic).comment;
            var _a = commentEncryption_1.decryptComment(encryptedData, selfPriv, true), plaintext = _a.comment, success = _a.success;
            expect(plaintext).toEqual(comment);
            expect(success).toBeTruthy();
        });
        it('should return the same plaintext as recipient', function () {
            var encryptedData = commentEncryption_1.encryptComment(comment, recipPublic, selfPublic).comment;
            var _a = commentEncryption_1.decryptComment(encryptedData, recipPriv, false), plaintext = _a.comment, success = _a.success;
            expect(plaintext).toEqual(comment);
            expect(success).toBeTruthy();
        });
        it('should return the same plaintext as sender with emojis', function () {
            var encryptedData = commentEncryption_1.encryptComment(emojis, recipPublic, selfPublic).comment;
            var _a = commentEncryption_1.decryptComment(encryptedData, selfPriv, true), plaintext = _a.comment, success = _a.success;
            expect(plaintext).toEqual(emojis);
            expect(success).toBeTruthy();
        });
        it('should return the same plaintext as recipient with emojis', function () {
            var encryptedData = commentEncryption_1.encryptComment(emojis, recipPublic, selfPublic).comment;
            var _a = commentEncryption_1.decryptComment(encryptedData, recipPriv, false), plaintext = _a.comment, success = _a.success;
            expect(plaintext).toEqual(emojis);
            expect(success).toBeTruthy();
        });
    });
    describe('decrypt', function () {
        it('should return comment if comment is not encrypted', function () {
            var _a = commentEncryption_1.decryptComment(comment, selfPriv, true), decrypted = _a.comment, success = _a.success;
            expect(decrypted).toEqual(comment);
            expect(success).toBeFalsy();
        });
        it('should return comment if comment is not encrypted with emojis', function () {
            var _a = commentEncryption_1.decryptComment(emojis, selfPriv, true), decrypted = _a.comment, success = _a.success;
            expect(decrypted).toEqual(emojis);
            expect(success).toBeFalsy();
        });
        it('should return comment with incorrect key', function () {
            var data = 'Ai+ACvRi7NFODDerbZzBh4i1ajm3AIUK+vRgDJQ7PRM30HyNB7OlTyZq2ZL4CpvrRk+dVS8YjiZv3lJ3qjRF64X' +
                'MeDbWtfFxbth6TidzdgosF1YiHHBhIo/IfJ8msEybA6rgY3a/S3mk/VjcvMI5T/IDG9Y+fcu3cFg3qQVGsar1sh' +
                'STap9aRwHTbRNHG6RKwKxyCFpH+rZAXhK4dZjoRIjbCNPZorcXgTO3yH2ypyOWojvOObpiJX+OuyAy/TibZcSBJ' +
                'QUCb9vxqGpV6l1ggZwgTDOnV96Q22BnSrqFr4wK63RE0jwUZqzzyAgohzk9FfyaR/0c0lwnVtl6+qIlcMlq8VPE' +
                'jT16hiaUo5lI6k851zlHIaMTe6Zr0drCJZPJRKaCjG6qpLPYCGMJRsmnbhCLIUDDBfaKbeys3dwo+05fktfoUed' +
                'vLXT+rLOvhqJR82nSOVxZSYexe4lAp6/xuFcIiDifWuJ1xiF7gti6TZ1WjXlpIswHrAQiBe5WscFhojsa56WXJ6' +
                'f1gDpxX/8hx9QhIYm2uqgbKt7d/vIFwJvo1nrrqbVRygKPHeT9Yv8GzSpYCTO8xJmlRuP+kjvrX8mXeakN2XDLT' +
                'f698dmzabQ3E2baANHIfyzzyy+onqmy05oRsGo3eFj9Xi0Fu/YME3PENyRPOYMyKT7bXEUy9nms/L9q6iuodjTJ' +
                'kn31jvRQG8s/Znw2+8a3ywkk9o5oBiK7CLitFwhrc68SaGRFwB9SmYqu+8omM+sKYxyD120iD1cUTFkQYNsPEH0' +
                'Pw9/M97SOo3Hn6QWqftiYgIksBKDhH5LMIRJbvMX6hZQjkvhbAquivjlf3Skhixsp6WC45acF+gkFZGG6w380+x' +
                'XZHcFj+EMJEW2VXtTgKe2IYOPKEb/+oYAA0+qcXmmkKRJsaHqRYVs90HCsNco=';
            var _a = commentEncryption_1.decryptComment(data, selfPriv, true), decrypted = _a.comment, success = _a.success;
            expect(decrypted).toEqual(data);
            expect(success).toBeFalsy();
        });
    });
    describe('regression test', function () {
        var newRecipPriv = Buffer.from('d2a515a64d37407f0e0e4a6a6a69a95eeb5ef8c2524ef01a6ffc6e3b39e0661b', 'hex');
        var senderPriv = Buffer.from('81cb7e2e21c10862dbb3c5782fff0fe315edbd51bd9b7ffc7f1dcf4212d70537', 'hex');
        var encrypted = 'BGacSsVDzOXrVdXBkM2yBC4F1KD94rjfClQGi7r2TPkFu+hLQIRJ73H3z5wgWVgq8vcziPR5ugWPI/6pFduezNVMAJGB9pSLfA00wvb8twy5/uBIzaAQqkfKUJ4/n10N5+F313PDq0BU1LXsPN1Oq+5SWPQc4Z4MWKs+7zkcNz//BNNZkm8lgJ4frVHExBrED62rsth87vwxpsfyxxk36zdvAHN7xfYss3bqgYVA2+E45mRZOaJxnyRHfUYKU5tA5neTertXlzpZO93l4e9SrDTUVbI/dr8QuSc2Pot7C83cCQHjeIl9eB2W5DTfTwlThg/CeWW0afaElTjuEw1XXy9eC3H9nxTXOj44SM2WUB3uDH2K2wmPJsd+RW66CDI6fD2VHMst2CA2B01hX2h+6Ml84Ria53bI6iedOpb1ejsw98a1/z2QKAlh/KfMHmseY/dQMh9kBhIuOQwavf3t4PvyMJ2QbRGwi1cuItkkyg/8eiCa8Zdjn3OozoWSQnfR';
        var newComment = 'regression test on encryption method 👍';
        // How comment was encrypted.
        // Uses elliptic package
        // console.info(
        //   encryptComment(
        //     comment,
        //     ec.keyFromPrivate(recipPriv, 'hex').getPublic(),
        //     ec.keyFromPrivate(senderPriv, 'hex').getPublic()
        //   )
        // )
        it('should not regress for sender', function () {
            var _a = commentEncryption_1.decryptComment(encrypted, senderPriv, true), decrypted = _a.comment, didDecrypt = _a.success;
            expect(decrypted).toEqual(newComment);
            expect(didDecrypt).toBeTruthy();
        });
        it('should not regress for recipeient', function () {
            var _a = commentEncryption_1.decryptComment(encrypted, newRecipPriv, false), decrypted = _a.comment, didDecrypt = _a.success;
            expect(decrypted).toEqual(newComment);
            expect(didDecrypt).toBeTruthy();
        });
    });
});
//# sourceMappingURL=commentEncryption.test.js.map