import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'StackSticky',
      formats: ['es', 'cjs'],
      fileName: format => `stack-sticky.${format}.js`,
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/demo.ts'],
    }),
  ],
})
