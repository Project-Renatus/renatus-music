const i18next = require('i18next')
const resources = require('../locales/resources.js')

function loadLanguages() {
  i18next.init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    resources
  })
}
module.exports = { loadLanguages }
