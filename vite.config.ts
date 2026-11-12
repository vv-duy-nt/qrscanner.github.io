import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // GitHub project Pages is served under /<repository>/; local dev stays at /.
  base: repositoryName ? `/${repositoryName}/` : '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'vendor';
          if (id.includes('qr-code-styling')) return 'qr';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('zustand')) return 'store';
          if (id.includes('dexie')) return 'db';
        },
      },
    },
  },
})
