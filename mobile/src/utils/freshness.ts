import { t } from '../i18n';

export type Freshness = {
  label: string;
  color: string;
  live: boolean;   // draw a solid marker
  show: boolean;   // draw a marker at all
};

export function freshnessOf(lastPublishedAt: string | null, paused: boolean): Freshness {
  if (paused) {
    return { label: t('family.paused'), color: '#6B7280', live: false, show: false };
  }
  if (!lastPublishedAt) {
    return { label: t('family.never_shared'), color: '#6B7280', live: false, show: false };
  }

  const mins = Math.floor((Date.now() - new Date(lastPublishedAt).getTime()) / 60000);

  if (mins < 2) return { label: t('family.just_now'), color: '#16A34A', live: true, show: true };
  if (mins < 15) return { label: t('family.mins_ago', { n: mins }), color: '#16A34A', live: true, show: true };
  if (mins < 120) return { label: t('family.mins_ago', { n: mins }), color: '#D97706', live: false, show: true };

  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: t('family.hours_ago', { n: hours }), color: '#6B7280', live: false, show: true };

  return { label: t('family.days_ago', { n: Math.floor(hours / 24) }), color: '#6B7280', live: false, show: true };
}