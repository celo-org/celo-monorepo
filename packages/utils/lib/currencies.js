"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
var CURRENCY_ENUM;
(function (CURRENCY_ENUM) {
    CURRENCY_ENUM["GOLD"] = "Celo Gold";
    CURRENCY_ENUM["DOLLAR"] = "Celo Dollar";
})(CURRENCY_ENUM = exports.CURRENCY_ENUM || (exports.CURRENCY_ENUM = {}));
exports.CURRENCIES = (_a = {},
    _a[CURRENCY_ENUM.GOLD] = {
        symbol: '',
        code: 'cGLD',
        displayDecimals: 3,
    },
    _a[CURRENCY_ENUM.DOLLAR] = {
        symbol: '$',
        code: 'cUSD',
        displayDecimals: 2,
    },
    _a);
exports.resolveCurrency = function (label) {
    if (label && label.toLowerCase().includes('dollar')) {
        return CURRENCY_ENUM.DOLLAR;
    }
    else if (label && label.toLowerCase().includes('gold')) {
        return CURRENCY_ENUM.GOLD;
    }
    else {
        console.info('Unable to resolve currency from label: ' + label);
        return CURRENCY_ENUM.DOLLAR;
    }
};
var SHORT_CURRENCIES;
(function (SHORT_CURRENCIES) {
    SHORT_CURRENCIES["DOLLAR"] = "dollar";
    SHORT_CURRENCIES["GOLD"] = "gold";
})(SHORT_CURRENCIES = exports.SHORT_CURRENCIES || (exports.SHORT_CURRENCIES = {}));
exports.currencyToShortMap = (_b = {},
    _b[CURRENCY_ENUM.DOLLAR] = SHORT_CURRENCIES.DOLLAR,
    _b[CURRENCY_ENUM.GOLD] = SHORT_CURRENCIES.GOLD,
    _b);
var currencyTranslationsENUS = {
    CeloDollars: 'Celo Dollars',
    CeloDollar: 'Celo Dollar',
    Dollar: 'Dollar',
    Dollars: 'Dollars',
    dollars: 'dollars',
};
var currencyTranslationsESAR = {
    CeloDollars: 'Celo Dólares',
    CeloDollar: 'Celo Dólar',
    Dollar: 'Dólar',
    Dollars: 'Dólares',
    dollars: 'dólares',
};
exports.currencyTranslations = (_c = {},
    _c['en-US'] = currencyTranslationsENUS,
    _c['es-419'] = currencyTranslationsESAR,
    _c);
//# sourceMappingURL=currencies.js.map