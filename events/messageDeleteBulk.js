const { EndReasons } = require("../src/utils");

module.exports = async (client, messages) => {
    let filteredCollectors = [];
    messages.forEach(message => {
        filteredCollectors = filteredCollectors.concat(client.activeCollectors.filter(x => {
            return x.channelid === message.channel.id && !filteredCollectors.find(y => x === y);
        }));
    });

    filteredCollectors.forEach(async collector => {
        try {
            await collector.manager.interaction.fetchReply();
        } catch (err) {
            console.log("🔴 Se eliminará el Collector porque ya no existe el mensaje")
            collector.manager.raw().stop(EndReasons.Deleted);
        }
    })
}