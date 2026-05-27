require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    version: 2,
    apiKeySet: Boolean(process.env.ANTHROPIC_API_KEY),
  });
});

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set' });
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
  };

  if (req.headers['anthropic-beta']) {
    headers['anthropic-beta'] = req.headers['anthropic-beta'];
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });

    const body = await response.text();
    const contentType = response.headers.get('content-type');

    if (contentType) {
      res.set('Content-Type', contentType);
    }

    res.status(response.status).send(body);
  } catch (error) {
    console.error('Anthropic proxy error:', error.message);
    res.status(502).json({
      error: 'Proxy request failed',
      message: error.message,
    });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

const server = app.listen(PORT, () => {
  console.log(`MSN Messenger: http://localhost:${PORT}`);
  console.log(`API proxy:       http://localhost:${PORT}/api/chat`);
  console.log(`Health check:    http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPoort ${PORT} is al in gebruik.`);
    console.error('Probeer: npm run restart');
    console.error('Of stop handmatig: lsof -ti :' + PORT + ' | xargs kill -9\n');
    process.exit(1);
  }
  throw err;
});
