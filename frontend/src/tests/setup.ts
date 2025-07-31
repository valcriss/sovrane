import { config } from '@vue/test-utils';
import { i18n } from '@/plugins/i18n';

// Injecte i18n dans tous les mounts
config.global.plugins = [i18n];
