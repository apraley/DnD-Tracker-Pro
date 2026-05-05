#!/usr/bin/env node

/**
 * Local Development Server for World Builder
 * Serves both the backend API and frontend
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import API handler
const worldBuilderHandler = require('./api/world-builder.js');

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle API routes
  if (pathname === '/api/world-builder') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        req.body = JSON.parse(body);
        req.headers = req.headers || {};

        // Create a response-like object
        const responseObj = {
          status: (code) => {
            res.statusCode = code;
            return {
              json: (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
              end: () => res.end()
            };
          },
          setHeader: (key, value) => res.setHeader(key, value),
          end: (data) => {
            if (data) res.end(data);
            else res.end();
          }
        };

        await worldBuilderHandler(req, responseObj);
      } catch (error) {
        console.error('API Error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Serve static files
  const frontendPath = path.join(__dirname, 'frontend/dist', pathname === '/' ? 'index.html' : pathname);

  fs.readFile(frontendPath, (err, data) => {
    if (err) {
      // Serve index.html for client-side routing
      fs.readFile(path.join(__dirname, 'frontend/dist/index.html'), (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('Not Found');
        } else {
          res.setHeader('Content-Type', 'text/html');
          res.end(data);
        }
      });
    } else {
      const ext = path.extname(pathname);
      const contentTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
      res.end(data);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   D&D World Builder Development Server                 ║
╠════════════════════════════════════════════════════════╣
║   Backend API: http://localhost:${PORT}/api             ║
║   Frontend:    http://localhost:5174/                 ║
║                                                        ║
║   Note: Frontend should still run on port 5174         ║
║   This server provides the API backend                 ║
╚════════════════════════════════════════════════════════╝
  `);
});
