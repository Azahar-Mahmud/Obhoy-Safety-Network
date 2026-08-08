const { normalizeToE164 } = require('./phone');

async function sendSms(phone, message) {
  // 1. Ensure phone number is formatted to +880...
  const normalizedPhone = normalizeToE164(phone);

  const url = `${process.env.SMS_GATEWAY_URL}/api/3rdparty/v1/messages`;
  const credentials = Buffer.from(
    `${process.env.SMS_GATEWAY_USERNAME}:${process.env.SMS_GATEWAY_PASSWORD}`
  ).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({ phoneNumbers: [normalizedPhone], textMessage: { text: message } }),
  });

  if (!response.ok) {
    // 2. Read exact error response from gateway for easy debugging
    const errText = await response.text().catch(() => '');
    throw new Error(`SMS Gateway responded with ${response.status}: ${errText}`);
  }

  return response.json();
}

module.exports = { sendSms };