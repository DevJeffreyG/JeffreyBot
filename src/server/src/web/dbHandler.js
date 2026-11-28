const { GetSession } = require("../js/Functions");
const { verifySession, verifyGuildAccess } = require("../js/middlewares");
const mongoose = require("mongoose");
const { Guilds, GlobalDatas } = mongoose.models;

const ACTIVE_MODULES_PREFIX = "active_modules";
const QUANTITIES_PREFIX = "quantities";

/** paths válidos del schema, definidos en GuildActiveModules */
function getActiveModulesSchema() {
    return new Map(
        Guilds.dashboardGetModulesSchema().map(setting => [setting.path, setting])
    );
}

function getQuantitiesSchema() {
    return new Map(
        Guilds.dashboardGetQuantitiesSchema().map(setting => [setting.path, setting])
    );
}

/** acepta paths con o sin el prefijo de la sección (`active_modules` o `quantities`) */
function normalizeSettingPath(path) {
    const prefix = [ACTIVE_MODULES_PREFIX, QUANTITIES_PREFIX]
        .find(candidate => path.startsWith(`${candidate}.`));

    return prefix ? path.slice(prefix.length + 1) : path;
}

function valueMatchesSetting(setting, value) {
    const type = setting.mongoInfo?.type;
    const expected = typeof type === "function"
        ? type.name.toLowerCase()
        : typeof type === "string" ? type.toLowerCase() : null;

    return !expected || typeof value === expected;
}

function validatorIdsOf(setting) {
    return (setting.mongoInfo?.validators ?? [])
        .map(validator => validator?.id)
        .filter(Boolean);
}

function validatorFnOf(validator) {
    if (typeof validator === "function") return validator;
    return typeof validator?.validator === "function" ? validator.validator : null;
}

/** 0 es la forma en que el dashboard expresa "sin límite" para estos settings. */
function normalizeSettingValue(setting, value) {
    if (value === 0 && validatorIdsOf(setting).join(";").toLowerCase().includes("infinity")) {
        return Infinity;
    }

    return value;
}

/** Devuelve el mensaje del primer validator que rechaza el valor, o null. */
function validationErrorOf(setting, value) {
    for (const validator of setting.mongoInfo?.validators ?? []) {
        const validate = validatorFnOf(validator);
        if (!validate) continue;

        let isValid;
        try {
            isValid = validate(value);
        } catch (err) {
            return validator?.message ?? "Valor inválido";
        }

        if (!isValid) return validator?.message ?? "Valor inválido";
    }

    return null;
}

function validationErrorMessage(err) {
    if (!(err instanceof mongoose.Error.ValidationError)) return null;
    return Object.values(err.errors).map(error => error.message)[0] ?? "Valor inválido";
}

/** JSON no puede representar Infinity: el dashboard lo expresa como 0 ("sin límite"). */
function serializeSettingValue(setting, value) {
    if (value === Infinity && validatorIdsOf(setting).join(";").toLowerCase().includes("infinity")) {
        return 0;
    }

    return value;
}

function serializeSettingValues(schema, values) {
    const serialized = {};

    for (const [path, value] of Object.entries(values ?? {})) {
        const setting = schema.get(normalizeSettingPath(path));
        serialized[path] = setting ? serializeSettingValue(setting, value) : value;
    }

    return serialized;
}

function serializeSchemaForDashboard(settings) {
    return settings.map(setting => {
        const plain = setting.toJSON();
        if (plain.mongoInfo?.defaultValue === Infinity) {
            plain.mongoInfo.defaultValue = 0;
        }
        return plain;
    });
}

function findSetting(path) {
    const normalized = normalizeSettingPath(path);
    return getQuantitiesSchema().get(normalized) ?? getActiveModulesSchema().get(normalized);
}

module.exports = (app) => {
    app.get("/api/db/schema/guilds/active-modules", verifySession, (req, res) => {
        const schema = Guilds.dashboardGetModulesSchema();

        res.send(JSON.stringify(serializeSchemaForDashboard(schema)));
    });

    app.get("/api/db/schema/guilds/quantities", verifySession, (req, res) => {
        const schema = Guilds.dashboardGetQuantitiesSchema();
        res.send(JSON.stringify(serializeSchemaForDashboard(schema)));
    });

    app.get("/api/db/global/dashboard-features", verifySession, async (req, res) => {
        const features = await GlobalDatas.dashboardFeatures();
        res.send(JSON.stringify(features.info));
    });

    app.get("/api/db/guilds/:guildId/moduleActive/:path", verifySession, verifyGuildAccess, async (req, res) => {
        let guildDoc = await Guilds.getById(req.params.guildId);
        let root = req.params.path;

        if (!guildDoc) return res.status(404).send({ message: "Guild not found" });

        let r = guildDoc.getSetting(root);
        const setting = findSetting(root);

        res.send(JSON.stringify(setting ? serializeSettingValue(setting, r) : r));
    })

    app.get("/api/db/guilds/:guildId/bulkActiveModules", verifySession, verifyGuildAccess, async (req, res) => {
        let guildDoc = await Guilds.getById(req.params.guildId);

        if (!guildDoc) return res.status(404).send({ message: "Guild not found" });

        let root = JSON.parse(req.headers["module-paths"]);

        console.log(root);
        if(!root || !Array.isArray(root)) return res.status(400).send({ message: "Missing module-paths header" });

        let r = guildDoc.getSettings(root);

        res.send(JSON.stringify(serializeSettingValues(getActiveModulesSchema(), r)));
    });

    app.patch("/api/db/guilds/:guildId/bulkActiveModules", verifySession, verifyGuildAccess, async (req, res) => {
        try {
            const changes = req.body?.changes;

            if (!Array.isArray(changes) || changes.length === 0) {
                return res.status(400).send({ message: "Se requiere un array de cambios no vacío" });
            }

            // verifyGuildAccess ya cargó el documento y validó el acceso
            const guildDoc = req.guildDoc;
            if (!guildDoc) return res.status(404).send({ message: "Guild not found" });

            const schema = getActiveModulesSchema();
            const updates = new Map();

            for (const change of changes) {
                if (!change || typeof change.path !== "string") {
                    return res.status(400).send({ message: "Cada cambio requiere un path válido" });
                }

                const path = normalizeSettingPath(change.path);
                const setting = schema.get(path);

                // whitelist: evita escribir path arbitrarios dentro del documento
                if (!setting) {
                    return res.status(400).send({ message: `Setting no permitido: ${change.path}` });
                }
                const value = normalizeSettingValue(setting, change.value);

                if (!valueMatchesSetting(setting, value)) {
                    return res.status(400).send({ message: `Valor inválido para ${change.path}` });
                }

                const validationError = validationErrorOf(setting, value);
                if (validationError) {
                    return res.status(400).send({ message: `${validationError} (${change.path})` });
                }

                updates.set(path, value);
            }

            for (const [path, value] of updates) {
                guildDoc.set(`settings.${ACTIVE_MODULES_PREFIX}.${path}`, value);
            }

            await guildDoc.save();

            return res.json({ updated: updates.size });
        } catch (err) {
            const validationMessage = validationErrorMessage(err);
            if (validationMessage) {
                return res.status(400).send({ message: validationMessage });
            }

            console.error("Error updating active modules:", err);
            return res.status(500).send({ message: err?.message || "Internal server error" });
        }
    });

    app.get("/api/db/guilds/:guildId/bulkQuantities", verifySession, verifyGuildAccess, async (req, res) => {
        let guildDoc = await Guilds.getById(req.params.guildId);

        if (!guildDoc) return res.status(404).send({ message: "Guild not found" });

        let root = JSON.parse(req.headers["module-paths"]);

        console.log(root);
        if(!root || !Array.isArray(root)) return res.status(400).send({ message: "Missing module-paths header" });

        let r = guildDoc.getSettings(root);

        res.send(JSON.stringify(serializeSettingValues(getQuantitiesSchema(), r)));
    });

    app.patch("/api/db/guilds/:guildId/bulkQuantities", verifySession, verifyGuildAccess, async (req, res) => {
        try {
            const changes = req.body?.changes;

            if (!Array.isArray(changes) || changes.length === 0) {
                return res.status(400).send({ message: "Se requiere un array de cambios no vacío" });
            }

            // verifyGuildAccess ya cargó el documento y validó el acceso
            const guildDoc = req.guildDoc;
            if (!guildDoc) return res.status(404).send({ message: "Guild not found" });

            const schema = getQuantitiesSchema();
            const updates = new Map();

            for (const change of changes) {
                if (!change || typeof change.path !== "string") {
                    return res.status(400).send({ message: "Cada cambio requiere un path válido" });
                }
                const path = normalizeSettingPath(change.path);
                const setting = schema.get(path);

                // whitelist: evita escribir path arbitrarios dentro del documento
                if (!setting) {
                    return res.status(400).send({ message: `Setting no permitido: ${change.path}` });
                }
                const value = normalizeSettingValue(setting, change.value);

                if (!valueMatchesSetting(setting, value)) {
                    return res.status(400).send({ message: `Valor inválido para ${change.path}` });
                }

                const validationError = validationErrorOf(setting, value);
                if (validationError) {
                    return res.status(400).send({ message: `${validationError} (${change.path})` });
                }

                updates.set(path, value);
            }

            for (const [path, value] of updates) {
                guildDoc.set(`settings.${QUANTITIES_PREFIX}.${path}`, value);
            }

            await guildDoc.save();

            return res.json({ updated: updates.size });
        } catch (err) {
            const validationMessage = validationErrorMessage(err);
            if (validationMessage) {
                return res.status(400).send({ message: validationMessage });
            }

            console.error("Error updating quantities:", err);
            return res.status(500).send({ message: err?.message || "Internal server error" });
        }
    });
}