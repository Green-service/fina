/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplified configuration to avoid build errors
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' blob: data: https://*.googleusercontent.com;
              font-src 'self';
              connect-src 'self' https://*.supabase.co https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.emailjs.com;
              frame-src 'self' https://*.supabase.co https://accounts.google.com;
              frame-ancestors 'self';
              form-action 'self';
              base-uri 'self';
              object-src 'none';
            `
              .replace(/\s{2,}/g, " ")
              .trim(),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
