fetch('https://obhoy-safety-network.onrender.com/auth/signup/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '01817660822' }), // Replace with a real Bangladeshi phone number you have nearby
})
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error);