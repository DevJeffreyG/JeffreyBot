const CommandNotFoundError = require("./CommandNotFoundError");
const ToggledCommandError = require("./ToggledCommandError");
const BadCommandError = require("./BadCommandError");
const SelfExec = require("./SelfExec");
const InsuficientSetupError = require("./InsuficientSetupError");
const DMNotSentError = require("./DMNotSentError");
const BadParamsError = require("./BadParamsError");
const AlreadyExistsError = require("./AlreadyExistsError");
const DoesntExistsError = require("./DoesntExistsError");
const FetchError = require("./FetchError");
const DiscordLimitationError = require("./DiscordLimitationError");
const EconomyError = require("./EconomyError");
const ExecutionError = require("./ExecutionError");
const ModuleBannedError = require("./ModuleBannedError");
const ModuleDisabledError = require("./ModuleDisabledError");
const PermissionError = require("./PermissionError");
const AlreadyUsingError = require("./AlreadyUsingError");
const BadSetupError = require("./BadSetupError");

module.exports = {
    CommandNotFoundError,
    ToggledCommandError,
    BadCommandError,
    SelfExec,
    InsuficientSetupError,
    DMNotSentError,
    BadParamsError,
    AlreadyExistsError,
    DoesntExistsError,
    FetchError,
    DiscordLimitationError,
    EconomyError,
    ExecutionError,
    ModuleBannedError,
    ModuleDisabledError,
    PermissionError,
    AlreadyUsingError,
    BadSetupError
}