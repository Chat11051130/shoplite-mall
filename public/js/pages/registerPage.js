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

  function clearPasswordFields() {
    var passwordField = getField('[data-field="register-password"]');
    var confirmPasswordField = getField('[data-field="register-confirm-password"]');

    if (passwordField) {
      passwordField.value = "";
    }

    if (confirmPasswordField) {
      confirmPasswordField.value = "";
    }
  }

  function normalizeRole(role) {
    if (role === "admin-request") {
      return "customer";
    }

    return role || "customer";
  }

  function setSubmitting(form, submitting) {
    var submitButton = form.querySelector('[type="submit"]');

    if (submitButton) {
      submitButton.disabled = submitting;
      submitButton.textContent = submitting ? "Creating Account..." : "Create Account";
    }
  }

  function initRegisterPage() {
    var form = document.querySelector('[data-component="register-form"]');
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var username = getValue('[data-field="register-username"]');
      var password = getValue('[data-field="register-password"]');
      var confirmPassword = getValue('[data-field="register-confirm-password"]');
      var role = getValue('[data-field="user-role"]');
      var missing = [];

      setInvalid('[data-field="register-username"]', !username);
      setInvalid('[data-field="register-password"]', !password);
      setInvalid('[data-field="register-confirm-password"]', !confirmPassword);
      setInvalid('[data-field="user-role"]', !role);

      if (!username) {
        missing.push("email address");
      }
      if (!password) {
        missing.push("password");
      }
      if (!confirmPassword) {
        missing.push("password confirmation");
      }
      if (!role) {
        missing.push("account type");
      }

      if (missing.length > 0) {
        setMessage("Please complete " + missing.join(", ") + " before creating the account.", "warning");
        return;
      }

      if (password !== confirmPassword) {
        setInvalid('[data-field="register-password"]', true);
        setInvalid('[data-field="register-confirm-password"]', true);
        setMessage("Password and confirmation must match.", "warning");
        return;
      }

      if (typeof apiClient.postJson !== "function") {
        clearPasswordFields();
        setMessage("Registration service is unavailable. Please try again after the server starts.", "danger");
        return;
      }

      setSubmitting(form, true);

      try {
        await apiClient.postJson("/api/auth/register", {
          email: username,
          password: password,
          role: normalizeRole(role)
        });
        clearPasswordFields();
        setMessage("Account created successfully. Redirecting to ShopLite.", "success");

        if (window.ShopLiteAuth && typeof window.ShopLiteAuth.syncSession === "function") {
          window.ShopLiteAuth.syncSession();
        }

        window.setTimeout(function () {
          window.location.assign("index.html");
        }, 600);
      } catch (error) {
        clearPasswordFields();
        setMessage(error.message || "Registration failed. Please check your account details.", "danger");
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
  window.ShopLitePages.register = initRegisterPage;
}());
