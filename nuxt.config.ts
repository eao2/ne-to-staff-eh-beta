// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer:{
    port: 3100,
    host: '0.0.0.0',
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['@/assets/styles/global.scss'],
  app: {
    head: {
      title: 'NE-TO cargo',
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        {
          name: 'description',
          content: 'Манайх БНХУ-ын бүх хотуудаас бүх төрлийн ачаа барааг Монгол улслуу тээвэрлэх үйлчилгээг үзүүлдэг ба Таны ачааг эрээн хотоос шуурхай экспрэсс үйлчилгээгээр 1 хоногт авчирдаг боллоо.' 
        },
        {
          name: 'theme-color',
          content: '#0066ff'
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'black-translucent'
        }
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
    }
  }
})
