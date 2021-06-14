"use strict";
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
var express_1 = __importDefault(require("express"));
var PromClient = __importStar(require("prom-client"));
var blockchain_1 = require("./blockchain");
process.on('unhandledRejection', function (reason) {
    console.log('unhandledRejection', reason);
    process.exit(1);
});
var host = process.env.WEB3_PROVIDER;
if (host === undefined) {
    console.error('WEB3_PROVIDER was not defined');
    process.exit(1);
    throw new Error("so tsc doesn't complains");
}
blockchain_1.metricExporterWithRestart(host).catch(function (err) {
    console.error('Unknown Error: %O', err);
    process.exit(1);
});
var app = express_1.default();
var port = 3000;
app.get('/status', function (_req, res) { return res.send('im up'); });
app.get('/metrics', function (_req, res) {
    res.send(PromClient.register.metrics());
});
app.listen(port, function () { return console.log("Transaction Metrics exporter starting on " + port + "!"); });
//# sourceMappingURL=index.js.map