const { positiveValidator, integerValidator, positiveWithZeroValidator, integerOrInfinityValidator } = require("../Validators");
const Helper = require("./Helper");
const Setting = require("./Setting");

class GuildQuantities extends Helper {
    constructor() {
        super();
    }

    addSetting(path, settingObj) {
        const pathParts = path.split('.');
        const settingName = pathParts.pop();
        let settings = this.settings;

        for (const pathPart of pathParts) {
            settings[pathPart] ??= {};
            settings = settings[pathPart];
        }

        settings[settingName] = settingObj;

        return this;
    }
}

const guildQuantities = new GuildQuantities();
guildQuantities
    .addSetting("ignore_notifications.youtube_videos", new Setting(
        {
            name: "Días pasados para ignorar notificaciones de videos de YouTube",
            help: "Cantidad de días pasados desde la última notificación de un video de YouTube para que se ignore la notificación.",
        },
        {
            type: Number,
            defaultValue: 14,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("ignore_notifications.youtube_shorts", new Setting(
        {
            name: "Días pasados para ignorar notificaciones de Shorts",
            help: "Cantidad de días pasados desde la última notificación de un video corto de YouTube para que se ignore la notificación.",
        },
        {
            type: Number,
            defaultValue: 14,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("interest_days.secured", new Setting(
        {
            name: "Dinero asegurado",
            help: "Cobrar cada X días los interses a los usuarios que tengan dinero asegurado.",
        },
        {
            type: Number,
            defaultValue: 14,
            validators: [positiveWithZeroValidator, integerValidator]
        }
    ))
    .addSetting("blackjack.consecutive_wins", new Setting(
        {
            name: "Racha de victorias en Blackjack",
            help: "Cantidad de victorias consecutivas necesarias para aplicar un cooldown al comando de blackjack.",
        },
        {
            type: Number,
            defaultValue: 5,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("darkshop.level", new Setting(
        {
            name: "Nivel de DarkShop",
            help: "Nivel necesario para acceder a la DarkShop.",
        },
        {
            type: Number,
            defaultValue: 5,
            validators: [positiveWithZeroValidator, integerValidator]
        }
    ))
    .addSetting("darkshop.baseprice", new Setting(
        {
            name: "Valor base de la moneda"
        },
        {
            type: Number,
            defaultValue: 200,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("currency_per_rep", new Setting(
        {
            name: "Cantidad de dinero por reputación",
            help: "Dinero dado por cada punto de reputación que tenga un usuario."
        },
        {
            type: Number,
            defaultValue: 100,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("adjust_ratio", new Setting(
        {
            name: "Ratio de ajuste",
            help: "Usado para los ajustes configurados. Por defecto en 100. Si el ratio calculado es mayor a este valor, Jeffrey Bot ajustará los valores."
        },
        {
            type: Number,
            defaultValue: 100,
            validators: [positiveValidator]
        }
    ))
    .addSetting("awards.tier1.price", new Setting(
        {
            name: "Precio del premio de nivel 1",
            help: "Cantidad de dinero que cuesta el premio de nivel 1."
        },
        {
            type: Number,
            defaultValue: 100,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("awards.tier1.gift", new Setting(
        {
            name: "Regalo del premio de nivel 1",
            help: "Regalo que se entrega al obtener el premio de nivel 1."
        },
        {
            type: Number,
            defaultValue: 0,
            validators: [positiveWithZeroValidator, integerValidator]
        }
    ))
    .addSetting("awards.tier2.price", new Setting(
        {
            name: "Precio del premio de nivel 2",
            help: "Cantidad de dinero que cuesta el premio de nivel 2."
        },
        {
            type: Number,
            defaultValue: 500,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("awards.tier2.gift", new Setting(
        {
            name: "Regalo del premio de nivel 2",
            help: "Regalo que se entrega al obtener el premio de nivel 2."
        },
        {
            type: Number,
            defaultValue: 100,
            validators: [positiveWithZeroValidator, integerValidator]
        }
    ))
    .addSetting("awards.tier3.price", new Setting(
        {
            name: "Precio del premio de nivel 3",
            help: "Cantidad de dinero que cuesta el premio de nivel 3."
        },
        {
            type: Number,
            defaultValue: 1800,
            validators: [positiveValidator, integerValidator]
        }
    ))
    .addSetting("awards.tier3.gift", new Setting(
        {
            name: "Regalo del premio de nivel 3",
            help: "Regalo que se entrega al obtener el premio de nivel 3."
        },
        {
            type: Number,
            defaultValue: 700,
            validators: [positiveWithZeroValidator, integerValidator]
        }
    ))
    .addSetting("limits.chat_rewards.exp.min", new Setting({ name: "Mínimo de experiencia por mensaje" }, { type: Number, defaultValue: 5, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.chat_rewards.exp.max", new Setting({ name: "Máximo de experiencia por mensaje" }, { type: Number, defaultValue: 35, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.chat_rewards.currency.min", new Setting({ name: "Mínimo de dinero por mensaje" }, { type: Number, defaultValue: 5, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.chat_rewards.currency.max", new Setting({ name: "Máximo de dinero por mensaje" }, { type: Number, defaultValue: 15, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.currency.coins.min", new Setting({ name: "Mínimo de dinero por /coins" }, { type: Number, defaultValue: 1, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.currency.coins.max", new Setting({ name: "Máximo de dinero por /coins" }, { type: Number, defaultValue: 20, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.currency.rob.min", new Setting({ name: "Mínimo de dinero por /rob", help: "Actualmente sin uso." }, { type: Number, defaultValue: 1, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.currency.rob.max", new Setting({ name: "Máximo de dinero por /rob", help: "Actualmente sin uso." }, { type: Number, defaultValue: 100, validators: [positiveValidator, integerOrInfinityValidator] }))
    .addSetting("limits.pets.hunger.min", new Setting({ name: "Mínimo de hambre dada a la mascota", help: "Esto pasa periódicamente, a todas las mascotas del servidor." }, { type: Number, defaultValue: 1, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.pets.hunger.max", new Setting({ name: "Máximo de hambre dada a la mascota", help: "Esto pasa periódicamente, a todas las mascotas del servidor." }, { type: Number, defaultValue: 3, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.bets.blackjack.min", new Setting({ name: "Mínimo de apuesta en Blackjack" }, { type: Number, defaultValue: 1000, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.bets.blackjack.max", new Setting({ name: "Máximo de apuesta en Blackjack" }, { type: Number, defaultValue: Infinity, validators: [positiveValidator, integerOrInfinityValidator] }))
    .addSetting("limits.bets.staff_bets.min", new Setting({ name: "Mínimo de apuesta en apuestas de STAFF" }, { type: Number, defaultValue: 10, validators: [positiveValidator, integerValidator] }))
    .addSetting("limits.bets.staff_bets.max", new Setting({ name: "Máximo de apuesta en apuestas de STAFF" }, { type: Number, defaultValue: 1000, validators: [positiveValidator, integerOrInfinityValidator] }))
    .addSetting("percentages.interests.transaction_secured", new Setting({ name: "Porcentaje de intereses por transacción asegurada", help: "El porcentaje de intereses que se cobran por cada transacción de /save o /with." }, { type: Number, defaultValue: 10, validators: [positiveWithZeroValidator] }))
    .addSetting("percentages.interests.secured", new Setting({ name: "Porcentaje de intereses por dinero asegurado", help: "El porcentaje de intereses que se cobran periódicamente por el dinero que se tiene asegurado." }, { type: Number, defaultValue: 5, validators: [positiveWithZeroValidator] }))
    .addSetting("percentages.skipFirewall", new Setting({ name: "Porcentaje de probabilidad de saltarse la Firewall", help: "Para el item especial de la DarkShop, Firewall." }, { type: Number, defaultValue: 100, validators: [positiveWithZeroValidator] }))
    .addSetting("percentages.pets.basic_unlocked", new Setting({ name: "Desbloquear básico", help: "El porcentaje de probabilidad de que al atacar, una mascota haga más daño de lo normal." }, { type: Number, defaultValue: 5, validators: [positiveWithZeroValidator] }))
    .addSetting("percentages.limits.rob.success.min", new Setting({ name: "Mínimo de probabilidad de éxito al robar", help: "El porcentaje mínimo de probabilidad de éxito al robar a otro usuario." }, { type: Number, defaultValue: 50, validators: [positiveValidator, integerValidator] }))
    .addSetting("percentages.limits.rob.success.max", new Setting({ name: "Máximo de probabilidad de éxito al robar", help: "El porcentaje máximo de probabilidad de éxito al robar a otro usuario." }, { type: Number, defaultValue: 90, validators: [positiveValidator, integerValidator] }))
    .addSetting("percentages.limits.fail.min", new Setting({ name: "Mínimo de probabilidad de fallo al robar", help: "El porcentaje mínimo de probabilidad de fallo al robar a otro usuario." }, { type: Number, defaultValue: 20, validators: [positiveValidator, integerValidator] }))
    .addSetting("percentages.limits.fail.max", new Setting({ name: "Máximo de probabilidad de fallo al robar", help: "El porcentaje máximo de probabilidad de fallo al robar a otro usuario." }, { type: Number, defaultValue: 40, validators: [positiveValidator, integerValidator] }))

module.exports = guildQuantities;