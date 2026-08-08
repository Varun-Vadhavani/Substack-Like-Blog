/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client'],
    },
    images: {
        domains: ['images.unsplash.com', 'lh3.googleusercontent.com', 'res.cloudinary.com', 'ui-avatars.com', 'api.dicebear.com'],
    },
}

module.exports = nextConfig
