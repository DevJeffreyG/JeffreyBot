const Setting = require("./Setting");

class Helper {
    constructor() {
        this.settings = {};
    }

    addSetting(path, settingObj) {
        throw new Error("Method 'addSetting' must be implemented.");
    }

    _recursiveMongify(settings = this.settings) {
        let returnable = {};

        for (const [key, value] of Object.entries(settings)) {
            if (value instanceof Setting) {
                let mongo = value.getMongoInfo();

                returnable[key] = {
                    type: mongo.type,
                    ...(mongo.defaultValue !== undefined ? { default: mongo.defaultValue } : {}),
                    ...(mongo.validators ? { validate: mongo.validators } : {})
                }
            } else if (value !== null && typeof value === 'object') {
                returnable[key] = this._recursiveMongify(value);
            }
        }

        return returnable;
    }

    _recursiveDashboard(settings = this.settings, currentPath = '') {
        let returnable = [];

        for (const [key, value] of Object.entries(settings)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            if (value instanceof Setting) {
                value.setPath(newPath);
                returnable.push(value);
            } else if (value !== null && typeof value === 'object') {
                returnable = returnable.concat(this._recursiveDashboard(value, newPath));
            }
        }

        return returnable;
    }

    dashboard() {
        // return array only of Settings
        // each setting should have a path property that is the full path to the setting (using .setPath())

        return this._recursiveDashboard();
    }

    mongify() {
        return this._recursiveMongify();
    }
}

module.exports = Helper;