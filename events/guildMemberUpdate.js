const { Config } = require("../src/resources");

module.exports = async (client, oldMember, newMember) => {
    let guild = newMember.guild;
    let memberRole = guild.roles.cache.find(x => x.id === Config.memberRole);

    if(client.user.id === Config.testingJBID){
      memberRole = guild.roles.cache.find(x => x.id === "575094139100594186");
    }

    // Member passed membership screening
    if (oldMember.pending && !newMember.pending) {
        if (memberRole) {
            await newMember.roles.add(memberRole);
        }
    }
}