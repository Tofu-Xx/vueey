import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: './src/main.ts',
      name: 'Vue',
      formats: ['iife'],
      fileName: f => `main.${f}.js`,
    },
    target: 'esnext',
    rolldownOptions: {
      output: {
        exports: 'default',
        name: 'Vue',
      },
    },
  },
  esbuild: {
    charset: 'ascii',
  },
})
