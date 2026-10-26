import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Keep the REACT_APP_ prefix from the create-react-app days, so the Docker
  // build arg, the Pi's .env and Netlify's settings keep working unchanged.
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    // `PORT=3000 npm start` keeps working as it did under react-scripts.
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
    open: false,
  },
  preview: {
    port: Number(process.env.PORT) || 3000,
  },
  build: {
    // Same folder as before: the Dockerfile and Netlify publish `build/`.
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
});
