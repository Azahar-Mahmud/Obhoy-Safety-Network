const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Obhoy backend is running' });
});

app.listen(PORT, () => {
  console.log(`Obhoy backend listening on port ${PORT}`);
});