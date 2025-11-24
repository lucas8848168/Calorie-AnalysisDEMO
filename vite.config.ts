import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // GitHub Pages 需要使用仓库名作为 base path
  // Cloudflare Pages 和本地开发使用根路径
  const base =
    mode === 'production' && process.env.GITHUB_ACTIONS
      ? '/Calorie-Analysis/'
      : '/'

  return {
    plugins: [react()],
    base,
    test: {
      globals: true,
      environment: 'jsdom',
    },
  }
})
