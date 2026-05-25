const authService = require("../services/authService");

function setSessionUser(req, user) {
  if (req.session && user && user.id) {
    req.session.userId = user.id;
  }
}

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.body);

    setSessionUser(req, user);

    return res.status(201).json({
      data: user
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const user = await authService.loginUser(req.body);

    setSessionUser(req, user);

    return res.json({
      data: user
    });
  } catch (error) {
    return next(error);
  }
}

function logout(req, res, next) {
  if (!req.session) {
    res.clearCookie("shoplite.sid");
    return res.json({
      data: {
        message: "Logged out"
      }
    });
  }

  return req.session.destroy(function (error) {
    if (error) {
      return next(error);
    }

    res.clearCookie("shoplite.sid");
    return res.json({
      data: {
        message: "Logged out"
      }
    });
  });
}

async function me(req, res, next) {
  try {
    const userId = req.session ? req.session.userId : null;
    const user = await authService.getCurrentUser(userId);

    return res.json({
      data: user
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  login,
  logout,
  me,
  register
};
