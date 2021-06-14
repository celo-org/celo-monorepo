export declare enum CURRENCY_ENUM {
    GOLD = "Celo Gold",
    DOLLAR = "Celo Dollar"
}
interface Currency {
    symbol: string;
    code: string;
    displayDecimals: number;
}
declare type CurrencyObject = {
    [key in CURRENCY_ENUM]: Currency;
};
export declare const CURRENCIES: CurrencyObject;
export declare const resolveCurrency: (label: string) => CURRENCY_ENUM;
export declare enum SHORT_CURRENCIES {
    DOLLAR = "dollar",
    GOLD = "gold"
}
export declare const currencyToShortMap: {
    "Celo Dollar": SHORT_CURRENCIES;
    "Celo Gold": SHORT_CURRENCIES;
};
export declare const currencyTranslations: {
    [key: string]: any;
};
export {};
