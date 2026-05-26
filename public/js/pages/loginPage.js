(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};

  function getField(selector) {
    return document.querySelector(selector);
  }

  function getValue(selector) {
    var field = getField(selector);
    return field ? field.value.trim() : "";
  }

  function setMessage(message, type) {
    var messageElement = document.querySelector('[data-component="auth-message"]');
    if (!messageElement) {
      return;
    }

    messageElement.className = "validation-message mt-3 alert alert-" + type;
    messageElement.textContent = message;
  }

  function clearMessage() {
    var messageElement = document.querySelector('[data-component="auth-message"]');
    if (!messageElement) {
      return;
    }

    messageElement.className = "validation-message mt-3";
    messageElement.textContent = "";
  }

  function setInvalid(selector, invalid) {
    var field = getField(selector);
    if (field) {
      field.classList.toggle("is-invalid", invalid);
    }
  }

  function clearPasswordField() {
    var passwordField = getField('[data-field="login-password"]');

    if (passwordField) {
      passwordField.value = "";
    }
  }

  function getRedirectTarget() {
    var params = new URLSearchParams(window.location.search);
    var target = params.get("returnTo") || "index.html";

    if (/^https?:\/\//i.test(target) || target.indexOf("//") === 0 || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
      return "index.html";
    }

    return target.replace(/^\//, "");
  }

  function setSubmitting(form, submitting) {
    var submitButton = form.querySelector('[type="submit"]');

    if (submitButton) {
      submitButton.disabled = submitting;
      submitButton.textContent = submitting ? "Signing In..." : "Sign In";
    }
  }

  function initLoginPage() {
    var form = document.querySelector('[data-component="login-form"]');
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var username = getValue('[data-field="login-username"]');
      var password = getValue('[data-field="login-password"]');
      var missing = [];

      setInvalid('[data-field="login-username"]', !username);
      setInvalid('[data-field="login-password"]', !password);

      if (!username) {
        missing.push("email address");
      }
      if (!password) {
        missing.push("password");
      }

      if (missing.length > 0) {
        setMessage("Please enter your " + missing.join(" and ") + " to continue.", "warning");
        return;
      }

      if (typeof apiClient.postJson !== "function") {
        clearPasswordField();
        setMessage("Login service is unavailable. Please try again after the server starts.", "danger");
        return;
      }

      setSubmitting(form, true);

      try {
        await apiClient.postJson("/api/auth/login", {
          email: username,
          password: password
        });
        clearPasswordField();
        setMessage("Login successful. Redirecting to ShopLite.", "success");

        if (window.ShopLiteAuth && typeof window.ShopLiteAuth.syncSession === "function") {
          window.ShopLiteAuth.syncSession();
        }

        window.setTimeout(function () {
          window.location.assign(getRedirectTarget());
        }, 600);
      } catch (error) {
        clearPasswordField();
        setMessage(error.message || "Login failed. Please check your email and password.", "danger");
      } finally {
        setSubmitting(form, false);
      }
    });

    form.querySelectorAll("input, select").forEach(function (field) {
      field.addEventListener("input", function () {
        field.classList.remove("is-invalid");
        clearMessage();
      });
      field.addEventListener("change", clearMessage);
    });
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages.login = initLoginPage;
}());
