"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var attestations_1 = require("./attestations");
var MESSAGE_1 = 'Celo : q4BJuVrALpiaroth_dwQ_ps6w8auvNPmi-SVVwstPaFaq8aRq4jeaWSPmI-rZTrJQ_Z0BOUyz9EBNif1Y2XzZQE=';
var MESSAGE_2 = 'Celo attestation code: IDOp4SaFdr9d_uNUo3SAUp1x-ZvoLAUAX_txx9dC0Q56mqAfisxNeZjh6LGDz2uMtNSo2SP-z93RkeYeB0rcXgA=';
var MESSAGE_3 = '<#> GTCp4SaFdr9d3uNUo3SAUp1x-ZvoLAUAX3txx9dC0Q56mqAfisxNeZP3WrGDz2uMtNSo2SP-z93RkeYeB0rcWhA= l5k6LvdPDXS';
var MESSAGE_3_WITH_LINK = '<#> celo://wallet/v/GTCp4SaFdr9d3uNUo3SAUp1x-ZvoLAUAX3txx9dC0Q56mqAfisxNeZP3WrGDz2uMtNSo2SP-z93RkeYeB0rcWhA= l5k6LvdPDXS';
var MESSAGE_4_UNSANITIZED = '<#> AOvujFUk§HkATAEsmVZRgB2phcFp69eqMqg0ps4Z8688s2-kgmyHybsRWYfTgjYMJv0jmFnjM8KKmb2tThROLAE= l5k6LvdPDXS';
var MESSAGE_1_DECODED = '0xab8049b95ac02e989aae8b61fddc10fe9b3ac3c6aebcd3e68be495570b2d3da15aabc691ab88de69648f988fab653ac943f67404e532cfd1013627f56365f36501';
var MESSAGE_2_DECODED = '0x2033a9e1268576bf5dfee354a37480529d71f99be82c05005ffb71c7d742d10e7a9aa01f8acc4d7998e1e8b183cf6b8cb4d4a8d923fecfddd191e61e074adc5e00';
var MESSAGE_3_DECODED = '0x1930a9e1268576bf5ddee354a37480529d71f99be82c05005f7b71c7d742d10e7a9aa01f8acc4d7993f75ab183cf6b8cb4d4a8d923fecfddd191e61e074adc5a10';
var MESSAGE_4_DECODED = '0x00ebee8c5524fc79004c012c995651801da985c169ebd7aa32a834a6ce19f3af3cb36fa4826c87c9bb115987d382360c26fd239859e333c28a99bdad4e144e2c01';
describe('Attestation Utils', function () {
    describe('messageContainsAttestationCode', function () {
        it('should check if a message contains a attestation code', function () {
            expect(attestations_1.messageContainsAttestationCode(MESSAGE_1)).toBeTruthy();
            expect(attestations_1.messageContainsAttestationCode(MESSAGE_2)).toBeTruthy();
            expect(attestations_1.messageContainsAttestationCode(MESSAGE_3)).toBeTruthy();
            expect(attestations_1.messageContainsAttestationCode(MESSAGE_3_WITH_LINK)).toBeTruthy();
        });
        it('should fail if a message does not contain a attestation code', function () {
            expect(attestations_1.messageContainsAttestationCode('asdfasdaf')).toBeFalsy();
            expect(attestations_1.messageContainsAttestationCode('')).toBeFalsy();
            expect(attestations_1.messageContainsAttestationCode('Howdy there')).toBeFalsy();
        });
    });
    describe('extractAttestationCode', function () {
        it('should extract the code from a message', function () {
            expect(attestations_1.extractAttestationCodeFromMessage(MESSAGE_1)).toBe(MESSAGE_1_DECODED);
            expect(attestations_1.extractAttestationCodeFromMessage(MESSAGE_2)).toBe(MESSAGE_2_DECODED);
            expect(attestations_1.extractAttestationCodeFromMessage(MESSAGE_3)).toBe(MESSAGE_3_DECODED);
            expect(attestations_1.extractAttestationCodeFromMessage(MESSAGE_3_WITH_LINK)).toBe(MESSAGE_3_DECODED);
            expect(attestations_1.extractAttestationCodeFromMessage(MESSAGE_4_UNSANITIZED)).toBe(MESSAGE_4_DECODED);
        });
    });
    // TODO Update codes to include deeplink prefix
    describe('sanitizeBase64', function () {
        var CODE_1 = 'Celo attestation code: NaLrNSYGRQ1JurhgREF1tNF43KDJnO6KaatnD¿hoim1XTq0O0IKNDQuBOF¿Fn5xIAjLQMtWbxbOgrtTBZ1oYAQA=';
        var SANITIZED_CODE_1 = 'Celo attestation code: NaLrNSYGRQ1JurhgREF1tNF43KDJnO6KaatnD_hoim1XTq0O0IKNDQuBOF_Fn5xIAjLQMtWbxbOgrtTBZ1oYAQA=';
        var CODE_2 = 'Celo attestation code: ZxO§ML8EU5K4a§h0jmjDbbV4a6gNJeBjfN9aa9xG-wsnf8§LYNE052gGuPML9s0Yqc§2YDCfwGgoiviV-IilRwA=';
        var SANITIZED_CODE_2 = 'Celo attestation code: ZxO_ML8EU5K4a_h0jmjDbbV4a6gNJeBjfN9aa9xG-wsnf8_LYNE052gGuPML9s0Yqc_2YDCfwGgoiviV-IilRwA=';
        var NORMAL_CODE = 'Celo attestation code: T7p-Mn1_L5zJuycAgAxYVqaJDp5r2TORcb775fdVoARbdJ-rNP-LArWCNJzJ6KjuVg0yskkEM8vVtl1PPmOsWwE=';
        it('sanitizes correctly', function () {
            expect(attestations_1.sanitizeMessageBase64(CODE_1)).toBe(SANITIZED_CODE_1);
            expect(attestations_1.sanitizeMessageBase64(CODE_2)).toBe(SANITIZED_CODE_2);
            expect(attestations_1.sanitizeMessageBase64(NORMAL_CODE)).toBe(NORMAL_CODE);
        });
    });
});
//# sourceMappingURL=attestations.test.js.map