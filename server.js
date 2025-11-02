// Custom Next.js server with Socket.IO support
// Run with: node server.js (instead of next start)

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Note: Socket.IO initialization needs to be done after server creation
// See initSocketIO call below

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  // Dynamic import to handle TypeScript compilation
  import('./lib/socketServer.js').then(({ initSocketIO }) => {
    initSocketIO(httpServer);
  }).catch((err) => {
    console.error('Failed to initialize Socket.IO:', err);
    console.log('Socket.IO will not be available');
  });

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

