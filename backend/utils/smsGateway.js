async function sendSms(phone, message) {
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
    body: JSON.stringify({ phoneNumbers: [phone], textMessage: { text: message } }),
  });

  if (!response.ok) {
    throw new Error(`SMS Gateway responded with ${response.status}`);
  }

  return response.json();
}

module.exports = { sendSms };