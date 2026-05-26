const userRepository = require("../repositories/userRepository");

function wantsJson(req) {
  return req.path.indexOf("/api/") === 0 || req.xhr || req.get("accept") === "application/json" || (req.get("accept") || "").indexOf("application/json") !== -1;
}

function safeReturnTo(req) {
  const target = (req.originalUrl || req.url || "").replace(/^\//, "");

  if (!target || /^https?:\/\//i.test(target) || target.indexOf("//") === 0 || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
    return "index.html";
  }

  return target;
}

function unauthorized(req, res) {
  if (wantsJson(req)) {
    return res.status(401).json({
      error: {
        message: "Authentication required",
        status: 401
      }
    });
  }

  return res.redirect("/login.html?returnTo=" + encodeURIComponent(safeReturnTo(req)));
}

function forbidden(req, res) {
  if (wantsJson(req)) {
    return res.status(403).json({
      error: {
        message: "Admin access required",
        status: 403
      }
    });
  }

  return res.status(403).send([
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    "  <title>ShopLite Admin Access Required</title>",
    '  <link href="/css/styles.css" rel="stylesheet">',
    '  <link href="/css/components.css" rel="stylesheet">',
    "</head>",
    '<body class="preview-page">',
    '  <main class="auth-shell">',
    '    <section class="auth-card mx-auto" style="max-width: 520px;">',
    "      <h1>Admin access required</h1>",
    "      <p>This ShopLite admin page is available only to signed-in admin users.</p>",
    '      <a class="btn btn-accent" href="/index.html">Return to Store</a>',
    "    </section>",
    "  </main>",
    "</body>",
    "</html>"
  ].join(""));
}

function requireRole() {
  const allowedRoles = Array.prototype.slice.call(arguments).map(function (role) {
    return String(role || "").toLowerCase();
  });

  return async function roleMiddleware(req, res, next) {
    try {
      const userId = req.session ? req.session.userId : null;

      if (!userId) {
        return unauthorized(req, res);
      }

      const user = await userRepository.findUserById(userId);
      const role = user && user.role ? String(user.role).toLowerCase() : "";

      if (!user) {
        if (req.session) {
          req.session.userId = null;
        }
        return unauthorized(req, res);
      }

      if (allowedRoles.indexOf(role) === -1) {
        return forbidden(req, res);
      }

      req.currentUser = user;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = requireRole;
