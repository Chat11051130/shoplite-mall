function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  return res.status(401).json({
    error: {
      message: "Authentication required",
      status: 401
    }
  });
}

module.exports = requireAuth;
