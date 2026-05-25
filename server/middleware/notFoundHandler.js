function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: "Route not found: " + req.originalUrl,
      status: 404
    }
  });
}

module.exports = notFoundHandler;
