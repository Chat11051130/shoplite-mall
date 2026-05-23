(function () {
  "use strict";

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

  function initLoginPage() {
    var form = document.querySelector('[data-component="login-form"]');
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
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

      setMessage("Prototype login successful. No real authentication was performed.", "success");
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
