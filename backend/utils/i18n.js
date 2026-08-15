const MESSAGES = {
  en: {
    'sms.sos': 'Obhoy Alert: {{name}} needs help. Location: {{link}}',
    'sms.journey_start': 'Obhoy: {{name}} started a journey to {{destination}}. Follow live: {{link}}',
    'sms.journey_overdue': 'Obhoy Alert: {{name}} missed a check-in. Last location: {{link}}',
    'sms.scheduled_missed': 'Obhoy Alert: {{name}} did not confirm safety by the set time. Last location: {{link}}',
    'sms.geofence': 'Obhoy Alert: {{name}} left their safe zone. Location: {{link}}',
    'sms.two_way_help': 'Obhoy Alert: {{name}} needs help. Location: {{link}}',
    'sms.evidence_start': 'Obhoy: {{name}} started recording. Follow live: {{link}}',
    'sms.family_invite': 'Obhoy: {{name}} wants to share live location with you on Obhoy. Ask them how to install it.', // <--- ADDED for Obhoy_31
  },
  bn: {
    'sms.sos': 'অভয়: {{name}} বিপদে আছে, তাড়াতাড়ি আসো। অবস্থান: {{link}}',
    'sms.journey_start': 'অভয়: {{name}} {{destination}}-এর পথে রওনা হয়েছে। দেখুন: {{link}}',
    'sms.journey_overdue': 'অভয়: {{name}} সময়মতো খবর দেয়নি। শেষ অবস্থান: {{link}}',
    'sms.scheduled_missed': 'অভয়: {{name}} নির্ধারিত সময়ে নিরাপদ থাকার খবর দেয়নি। শেষ অবস্থান: {{link}}',
    'sms.geofence': 'অভয়: {{name}} নিরাপদ এলাকার বাইরে গেছে। অবস্থান: {{link}}',
    'sms.two_way_help': 'অভয়: {{name}} সাহায্য চেয়েছে। অবস্থান: {{link}}',
    'sms.evidence_start': 'অভয়: {{name}} রেকর্ডিং শুরু করেছে। দেখুন: {{link}}',
    'sms.family_invite': 'অভয়: {{name}} আপনার সাথে অবস্থান ভাগ করতে চায়। অ্যাপটি কীভাবে নেবেন, তাকে জিজ্ঞেস করুন।', // <--- ADDED for Obhoy_31
  },
};

function tSms(language, key, vars = {}) {
  const lang = language === 'bn' ? 'bn' : 'en';
  let out = (MESSAGES[lang] && MESSAGES[lang][key]) || (MESSAGES.en && MESSAGES.en[key]) || key;
  for (const [name, value] of Object.entries(vars)) {
    out = out.split(`{{${name}}}`).join(String(value));
  }
  return out;
}

module.exports = { tSms };