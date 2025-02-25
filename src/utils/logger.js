const fs = require('fs');

function logError(error) {
    const errorMessage = `[${new Date().toISOString()}] ERROR: ${error.message || error}\n`;
    fs.appendFileSync('error.log', errorMessage);
    console.error(error);
}

function logMessage(message) {
    console.log(`[${new Date().toISOString()}] MESSAGE: ${message}`);
}

module.exports = { logError, logMessage };