const { loadLanguages } = require("../handler/LanguageHandler.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    try {
      await loadLanguages();
    } catch (e) {
      console.log(e);
    }
  },
};
