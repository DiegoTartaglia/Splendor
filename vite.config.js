import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset paths relative so the same build works on the web,
// inside Electron (file://) and inside the Capacitor Android WebView.
export default defineConfig({
  plugins: [react()],
  base: './'
});
