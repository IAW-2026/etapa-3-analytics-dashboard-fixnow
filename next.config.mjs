/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: {
    appIsrStatus: false, // Oculta el icono de la "N"
    buildActivity: false, // Oculta el icono de compilación
  },
};

export default nextConfig;
