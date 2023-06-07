/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        domains: ["ipfs.io"], // domains are the parts of URLs before the first single '/', like 'ipfs.io' in 'https://ipfs.io/ipfs/QmVb9B'
    },
}

module.exports = nextConfig
// export default nextConfig
