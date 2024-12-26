import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true
  },
  define: {
    'process.env': {} // Avoids process reference errors
  }
});
