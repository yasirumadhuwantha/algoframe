process.env.NODE_ENV = 'production';
await import(new URL('../dist/server.js', import.meta.url).href);
