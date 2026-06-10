/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Suppress the "Serializing big strings" warning from qrcode library
    config.infrastructureLogging = {
      level: 'error',
    }
    return config
  },
}
module.exports = nextConfig
