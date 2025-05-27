import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import translationPT from './locales/pt.json';
import translationEN from './locales/en.json';
import translationES from './locales/es.json';

// the translations
const resources = {
  pt: {
    translation: translationPT
  },
  en: {
    translation: translationEN
  },
  es: {
    translation: translationES
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem('language') || 'pt', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;