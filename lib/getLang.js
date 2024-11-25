const mongoose = require('mongoose');

const languageDataSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  lng: { type: String, required: true },
}, { collection: 'languagedatas' });

const LanguageData = mongoose.model('LanguageData', languageDataSchema);

async function getLang(guildID) {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const data = await LanguageData.findOne({ guildId: guildID });
    const language = data ? data.lng : 'en';

    return language;

  } catch (err) {
    console.error('Error during MongoDB operation:', err);
    return 'en';
  } finally {
    try {
      await mongoose.disconnect();
    } catch (disconnectErr) {
      console.error('Error disconnecting from MongoDB:', disconnectErr);
    }
  }
}

module.exports = getLang;