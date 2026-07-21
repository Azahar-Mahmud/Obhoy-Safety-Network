async function sendOtpSms(phone, code) {
  const url = `https://api.textbee.dev/api/v1/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.TEXTBEE_API_KEY,
    },
    body: JSON.stringify({
      recipients: [phone],
      message: `Obhoy verification code: ${code}`,
    }),
  });
  if (!response.ok) {
    throw new Error(`TextBee responded with ${response.status}`);
  }
  return response.json();
}

module.exports = { sendOtpSms };