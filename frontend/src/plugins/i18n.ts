import { createI18n } from 'vue-i18n';
import fr from '../locales/fr.json'
import en from '../locales/en.json'
export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'en',
  messages: {
    fr,
    en
  }
});
