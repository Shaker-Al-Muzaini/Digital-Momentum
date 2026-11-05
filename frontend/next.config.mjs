const origin = (
  process.env.FASTAPI_URL || 'http://127.0.0.1:8000/api/v1'
).replace(/\/$/, '');
export default {
  async rewrites() {
    return [{ source: '/backend/:path*', destination: origin + '/:path*' }];
  },
};
