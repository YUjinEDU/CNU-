/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/naver/directions': {
          target: 'https://maps.apigw.ntruss.com',
          changeOrigin: true,
          rewrite: (p) => `/map-direction/v1/driving${p.replace('/api/naver/directions', '')}`,
          headers: {
            'X-NCP-APIGW-API-KEY-ID': env.VITE_NAVER_CLIENT_ID || '',
            'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET || '',
          },
        },
        '/api/naver/geocode': {
          target: 'https://maps.apigw.ntruss.com',
          changeOrigin: true,
          rewrite: (p) => `/map-geocode/v2/geocode${p.replace('/api/naver/geocode', '')}`,
          headers: {
            'X-NCP-APIGW-API-KEY-ID': env.VITE_NAVER_CLIENT_ID || '',
            'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET || '',
          },
        },
        '/api/naver/reverse-geocode': {
          target: 'https://maps.apigw.ntruss.com',
          changeOrigin: true,
          rewrite: (p) => `/map-reversegeocode/v2/gc${p.replace('/api/naver/reverse-geocode', '')}`,
          headers: {
            'X-NCP-APIGW-API-KEY-ID': env.VITE_NAVER_CLIENT_ID || '',
            'X-NCP-APIGW-API-KEY': env.NAVER_CLIENT_SECRET || '',
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});
