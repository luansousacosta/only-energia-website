import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' gera caminhos relativos — funciona tanto em domínio próprio
// (raiz) quanto no subcaminho do GitHub Pages (usuario.github.io/repo/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
