class Setting {
    constructor(dashboardInfo = { name, help: null }, mongoInfo = { type, defaultValue, validators: [] }) {
        this.dashboardInfo = dashboardInfo;
        this.mongoInfo = mongoInfo;
    }

    getDashboardInfo() {
        return this.dashboardInfo;
    }

    getMongoInfo() {
        return this.mongoInfo;
    }

    setPath(path) {
        this.path = path;

        return this;
    }

    toJSON() {
        return {
            ...this,
            mongoInfo: {
                ...this.mongoInfo,
                ...(typeof this.mongoInfo.type === 'function'
                    ? { type: this.mongoInfo.type.name.toLowerCase() }
                    : {})
            }
        };
    }
}

module.exports = Setting;