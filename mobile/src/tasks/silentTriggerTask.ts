import { runSilentSos } from '../utils/silentSos';
import { loadLanguage } from '../i18n'; // <--- ADDED

export default async () => {
  await loadLanguage(); // Loads language before silent trigger sends SMS / alerts
  await runSilentSos();
};