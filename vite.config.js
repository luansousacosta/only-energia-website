import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// base './' gera caminhos relativos — funciona tanto em domínio próprio
// (raiz) quanto no subcaminho do GitHub Pages (usuario.github.io/repo/).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Página principal (landing) e a calculadora tarifária.
        main: resolve(__dirname, 'index.html'),
        calculadora: resolve(__dirname, 'calculadora.html'),
      },
    },
  },
})
