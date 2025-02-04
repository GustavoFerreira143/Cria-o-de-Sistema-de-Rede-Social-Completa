import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser', // Usa o Terser para minificação
    terserOptions: {
      compress: {
        drop_console: true, // Remove todos os console.log do código
      },
      mangle: true, // Ofusca os nomes das variáveis
    },
  },
})
