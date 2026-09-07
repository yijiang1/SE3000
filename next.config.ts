import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack(config, { isServer, webpack }) {
    if (!isServer) {
      // PptxGenJS declares these modules disabled in its browser map. Webpack
      // handles node: before that map, so normalize only this package's imports.
      config.plugins.push(new webpack.NormalModuleReplacementPlugin(/^node:(fs|https)$/, (resource: { context: string; request: string }) => {
        if (resource.context.includes("pptxgenjs")) resource.request = resource.request.slice(5);
      }));
    }
    return config;
  },
};

export default nextConfig;
