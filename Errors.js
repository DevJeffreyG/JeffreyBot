const models = require("mongoose").models;
const { GlobalDatas } = models;

module.exports = (client) => {
    process.on('uncaughtException', err => {
        console.log(err);
        console.log(`Uncaught Exception: ${err.message}`)
        process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
        console.log('Unhandled rejection at ', promise, `reason: ${reason.message}`)
        process.exit(1)
    })

    process.on('beforeExit', code => {
        // Can make asynchronous calls
        setTimeout(() => {
            console.log(`Process will exit with code: ${code}`)
            process.exit(code)
        }, 100)
    })

    process.on('exit', code => {
        // Only synchronous calls
        console.log(`Process exited with code: ${code}`)
    })
}