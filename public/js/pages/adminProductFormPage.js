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
    var messageElement = document.querySelector('[data-component="validation-message"]');
    if (!messageElement) {
      return;
    }

    messageElement.className = "validation-message mt-3 alert alert-" + type;
    messageElement.textContent = message;
  }

  function clearMessage() {
    var messageElement = document.querySelector('[data-component="validation-message"]');
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

  function updateStatusPreview() {
    var status = getValue('[data-field="product-status"]');
    var preview = document.getElementById("productStatusPreview");
    if (!preview) {
      return;
    }

    preview.className = "status-badge";

    if (status === "active") {
      preview.classList.add("status-active");
      preview.textContent = "Active";
    } else if (status === "low-stock") {
      preview.classList.add("status-low");
      preview.textContent = "Low stock";
    } else {
      preview.classList.add("status-draft");
      preview.textContent = "Draft";
    }
  }

  function validateProductForm() {
    var requiredFields = [
      { selector: '[data-field="product-name"]', label: "product name" },
      { selector: '[data-field="product-category"]', label: "category" },
      { selector: '[data-field="product-price"]', label: "price" },
      { selector: '[data-field="product-stock"]', label: "stock" },
      { selector: '[data-field="product-status"]', label: "status" },
      { selector: '[data-field="product-description"]', label: "description" }
    ];
    var missing = [];

    requiredFields.forEach(function (fieldConfig) {
      var value = getValue(fieldConfig.selector);
      setInvalid(fieldConfig.selector, !value);
      if (!value) {
        missing.push(fieldConfig.label);
      }
    });

    return missing;
  }

  function initAdminProductFormPage() {
    var form = document.querySelector('[data-component="product-form"]');
    if (!form) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = validateProductForm();

      if (missing.length > 0) {
        setMessage("Please complete " + missing.join(", ") + " before saving the product.", "warning");
        return;
      }

      setMessage("Prototype product saved successfully. No real product data was stored.", "success");
    });

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () {
        field.classList.remove("is-invalid");
        clearMessage();
      });
      field.addEventListener("change", function () {
        field.classList.remove("is-invalid");
        clearMessage();
        if (field.matches('[data-field="product-status"]')) {
          updateStatusPreview();
        }
      });
    });

    updateStatusPreview();
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-product-form"] = initAdminProductFormPage;
}());
