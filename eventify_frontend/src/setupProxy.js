const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:5080",
      changeOrigin: true,
      secure: false,
      logLevel: 'debug', // See detailed proxy logs
    })
  );
};
