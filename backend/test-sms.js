const apiKey = 'Yxvs2ehYEb3YMpp40aAs';
const recipient = '8801810224778';
const message = 'Your Obhoy OTP is 123456';

// List of possible sender IDs assigned by BulkSMSBD
const candidateSenders = [
  '8809617614000',
  '8809612440732',
  '8801537540032', // Your account registered phone from Screenshot 2
  '01537540032',
  '8801810224778',
  '01810224778',
  'BulkSMS',
  'OBHOY',
  'DEMO'
];

async function findWorkingSenderId() {
  console.log('Testing BulkSMSBD Sender IDs...');
  
  for (const sender of candidateSenders) {
    const url = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${recipient}&senderid=${sender}&message=${encodeURIComponent(message)}`;
    
    try {
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      console.log(`Testing senderid: "${sender}" ->`, data);
      
      if (data.response_code === 202) {
        console.log(`\n🎉 FOUND WORKING SENDER ID: "${sender}"! Check your phone!`);
        break;
      }
    } catch (e) {
      console.log(`Error testing ${sender}:`, e.message);
    }
  }
}

findWorkingSenderId();