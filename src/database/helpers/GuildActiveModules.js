const Helper = require('./Helper');
const Setting = require('./Setting');

class ActiveModulesHelper extends Helper {
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

const activeModules = new ActiveModulesHelper();
activeModules
    .addSetting("functions.suggestions",
        new Setting(
            { name: "Sugerencias", help: "Permite a los usuarios enviar sugerencias al servidor." },
            { type: Boolean, defaultValue: false }
        )
    )
    .addSetting("functions.tickets",
        new Setting(
            { name: "Tickets", help: "Permite a los usuarios crear tickets para obtener ayuda." },
            { type: Boolean, defaultValue: false }
        )
    )
    .addSetting("functions.logs",
        new Setting(
            { name: "Logs", help: "Permite a Jeffrey Bot registrar eventos importantes en el servidor." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("functions.birthdays",
        new Setting(
            { name: "Cumpleaños", help: "Permite a los usuarios registrar sus cumpleaños y que otros lo recuerden." },
            { type: Boolean, defaultValue: false }
        )
    )
    .addSetting("functions.darkshop",
        new Setting(
            { name: "DarkShop", help: "Permite a los usuarios comprar items en la DarkShop e invertir en ella." },
            { type: Boolean, defaultValue: false }
        )
    )
    .addSetting("functions.rep_to_currency",
        new Setting(
            { name: "Reputación a Dinero", help: "Permite a los usuarios convertir su reputación a dinero del servidor. (/claimrep)" },
            { type: Boolean, defaultValue: false }
        )
    )
    .addSetting("functions.staff_reminders",
        new Setting(
            { name: "Recordatorios del STAFF", help: "Permite a Jeffrey Bot enviar recordatorios a los miembros del STAFF." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.guild.messageDelete",
        new Setting(
            { name: "Logs de Eliminación de Mensajes", help: "Permite a Jeffrey Bot registrar cuando un mensaje es eliminado en el servidor." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.guild.messageUpdate",
        new Setting(
            { name: "Logs de Edición de Mensajes", help: "Permite a Jeffrey Bot registrar cuando un mensaje es editado en el servidor." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.moderation.warns",
        new Setting(
            { name: "MD: Advertencias", help: "Envía un mensaje al usuario cuando reciba una advertencia." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.moderation.softwarns",
        new Setting(
            { name: "MD: SoftWarns", help: "Envía un mensaje al usuario cuando reciba un softwarn." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.moderation.pardons",
        new Setting(
            { name: "MD: Perdones", help: "Envía un mensaje al usuario cuando es perdonado de una advertencia." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.moderation.bans",
        new Setting(
            { name: "Logs de Baneos", help: "Permite a Jeffrey Bot registrar cuando un miembro es baneado del servidor." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.moderation.timeouts",
        new Setting(
            { name: "Logs de Timeouts", help: "Permite a Jeffrey Bot registrar cuando un miembro es puesto en timeout." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.moderation.clears",
        new Setting(
            { name: "Logs de Limpieza de Mensajes", help: "Permite a Jeffrey Bot registrar cuando un STAFF limpia mensajes en el servidor." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.moderation.automod",
        new Setting(
            { name: "Logs de AutoMod", help: "Permite a Jeffrey Bot registrar cuando un miembro es sancionado por el AutoMod." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.staff.tickets",
        new Setting(
            { name: "Logs de Tickets", help: "Permite a Jeffrey Bot registrar cuando un miembro crea un ticket en el servidor." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.staff.settings",
        new Setting(
            { name: "Logs de Cambios en Configuración", help: "Permite a Jeffrey Bot registrar cuando un miembro cambia la configuración del servidor." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.staff.errors",
        new Setting(
            { name: "Logs de Errores", help: "Permite a Jeffrey Bot registrar cuando ocurre un error. (Jeffrey Bot, configuraciones, etc.)" },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.staff.automated_changes",
        new Setting(
            { name: "Logs de Cambios Automatizados", help: "Permite a Jeffrey Bot registrar cuando se hace algo automáticamente en el servidor por Jeffrey Bot." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.darkshop.sunday",
        new Setting(
            { name: "Anuncio: Domingo", help: "Permite a Jeffrey Bot enviar un mensaje cuando es domingo, y la inflación es reiniciada." },
            { type: Boolean, defaultValue: true }
        )
    )
    .addSetting("logs.darkshop.removed_currency",
        new Setting(
            { name: "Anuncio: Inversión Eliminada", help: "Permite a Jeffrey Bot enviar un mensaje cuando a un miembro se le elimina el dinero de la DarkShop." },
            { type: Boolean, defaultValue: false }
        )
    )

module.exports = activeModules;