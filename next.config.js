module.exports = {
  webpack5: true,
  future: {},
  //TODO:FIXME:  Use different Image provider / storage service like cloudinary and  akamai
  // images: {
  //     domains: ['images.unsplash.com', 'tailwindui.com'],
  //     loader: 'cloudinary',
  //     path: 'https://res.cloudinary.com/dtkvfdjg5/image/upload',
  // },
  // async headers() {
  //   return [
  //     {
  //       source: '/',
  //       headers: securityHeaders,
  //     },
  //     {
  //       source: '/:path*',
  //       headers: securityHeaders,
  //     },
  //   ]
  // },
  webpack: (config, {dev, isServer}) => {
    //TODO:FIXME: use Preact only if features like Suspense and COncurrent mode of react  are not used
    // if (!dev && !isServer) {
    //     Object.assign(config.resolve.alias, {
    //         react: 'preact/compat',
    //         'react-dom/test-utils': 'preact/test-utils',
    //         'react-dom': 'preact/compat',
    //     })
    // }
    return config
  },
}

// https://securityheaders.com
// const ContentSecurityPolicy = `
//    default-src 'self';
//    script-src 'self' 'unsafe-eval' 'unsafe-inline';
//    child-src *.google.com;
//    style-src 'self' 'unsafe-inline' *.googleapis.com;
//    img-src * blob: data:;
//    media-src 'none';
//    connect-src *;
//    font-src 'self';
//    frame-ancestors 'none';
//    base-uri 'none';
//  `

// const securityHeaders = [
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
//   {
//     key: 'X-XSS-Protection',
//     value: '1; mode=block',
//   },
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
//   {
//     key: 'Content-Security-Policy',
//     value: ContentSecurityPolicy.replace(/\n/g, ''),
//   },
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
//   {
//     key: 'Referrer-Policy',
//     value: 'strict-origin-when-cross-origin',
//   },
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
//   {
//     key: 'X-Frame-Options',
//     value: 'SAMEORIGIN',
//   },
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
//   {
//     key: 'X-Content-Type-Options',
//     value: 'nosniff',
//   },
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-DNS-Prefetch-Control
//   {
//     key: 'X-DNS-Prefetch-Control',
//     value: 'on',
//   },
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
//   {
//     key: 'Strict-Transport-Security',
//     value: 'max-age=31536000; includeSubDomains; preload',
//   },
//   // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy
//   {
//     key: 'Permissions-Policy',
//     value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
//   },
// ]
