async function sendSms(phone, message) {
  // NEW DEBUG LOG:
  console.log(`[sendSms] Sending to ${phone} using URL: ${process.env.SMS_GATEWAY_URL}`);

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
    const errorText = await response.text();
    console.error(`[sendSms ERROR] ${response.status}: ${errorText}`);
    throw new Error(`SMS Gateway responded with ${response.status}`);
  }

  const data = await response.json();
  console.log(`[sendSms SUCCESS]`, data);
  return data;
}

module.exports = { sendSms };