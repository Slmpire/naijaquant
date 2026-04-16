import dotenv from 'dotenv'
dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  bayse: {
    apiKey: process.env.BAYSE_API_KEY || '',
    secretKey: process.env.BAYSE_SECRET_KEY || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  newsApiKey: process.env.NEWS_API_KEY || '',
}