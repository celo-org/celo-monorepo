"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasProperty(object, property) {
    return property in object;
}
exports.hasProperty = hasProperty;
function stopProvider(defaultProvider) {
    if (hasProperty(defaultProvider, 'stop')) {
        defaultProvider.stop();
    }
    else {
        // Close the web3 connection or the CLI hangs forever.
        if (hasProperty(defaultProvider, 'connection')) {
            var connection = defaultProvider.connection;
            // WS
            if (hasProperty(connection, 'close')) {
                connection.close();
            }
            // Net (IPC provider)
            if (hasProperty(connection, 'destroy')) {
                connection.destroy();
            }
            // TODO: more cases? default?
        }
    }
}
exports.stopProvider = stopProvider;
//# sourceMappingURL=provider-utils.js.map