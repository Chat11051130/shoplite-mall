(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};
  var currentProductId = "";

  function getField(selector) {
    return document.querySelector(selector);
  }

  function getValue(selector) {
    var field = getField(selector);
    return field ? field.value.trim() : "";
  }

  function setValue(selector, value) {
    var field = getField(selector);
    if (field) {
      field.value = value === undefined || value === null ? "" : String(value);
    }
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

  function getProductIdFromUrl() {
    var params = new URLSearchParams(window.location.search);
    return params.get("productId") || "";
  }

  function statusFromProduct(product) {
    var tag = String(product.tag || product.badge || "").toLowerCase();
    var stock = Number(product.stock) || 0;

    if (tag === "draft" || stock === 0) {
      return "draft";
    }

    if (tag === "low-stock" || stock <= 20) {
      return "low-stock";
    }

    return "active";
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
      { selector: '[data-field="product-image-url"]', label: "image URL" },
      { selector: '[data-field="product-alt"]', label: "image alt text" },
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

    var price = Number(getValue('[data-field="product-price"]'));
    var stock = Number(getValue('[data-field="product-stock"]'));

    if (!Number.isFinite(price) || price < 0) {
      missing.push("valid price");
      setInvalid('[data-field="product-price"]', true);
    }

    if (!Number.isInteger(stock) || stock < 0) {
      missing.push("valid stock");
      setInvalid('[data-field="product-stock"]', true);
    }

    return missing;
  }

  function buildProductPayload() {
    var status = getValue('[data-field="product-status"]');
    var tag = status === "draft" || status === "low-stock" ? status : "";

    return {
      category: getValue('[data-field="product-category"]'),
      title: getValue('[data-field="product-name"]'),
      price: Number(getValue('[data-field="product-price"]')),
      oldPrice: getValue('[data-field="product-old-price"]') ? Number(getValue('[data-field="product-old-price"]')) : 0,
      discount: getValue('[data-field="product-discount"]'),
      stock: Number(getValue('[data-field="product-stock"]')),
      image: getValue('[data-field="product-image-url"]'),
      alt: getValue('[data-field="product-alt"]'),
      shipping: getValue('[data-field="product-shipping"]'),
      badge: getValue('[data-field="product-badge"]'),
      tag: tag,
      shortDescription: getValue('[data-field="product-description"]')
    };
  }

  function populateForm(product) {
    setValue('[data-field="product-name"]', product.title);
    setValue('[data-field="product-category"]', product.category);
    setValue('[data-field="product-price"]', product.price);
    setValue('[data-field="product-old-price"]', product.oldPrice || "");
    setValue('[data-field="product-discount"]', product.discount || "");
    setValue('[data-field="product-stock"]', product.stock);
    setValue('[data-field="product-status"]', statusFromProduct(product));
    setValue('[data-field="product-image-url"]', product.image);
    setValue('[data-field="product-alt"]', product.alt || product.title);
    setValue('[data-field="product-shipping"]', product.shipping || "");
    setValue('[data-field="product-badge"]', product.badge || "");
    setValue('[data-field="product-description"]', product.shortDescription || "");
    updateStatusPreview();
  }

  async function loadProduct(productId) {
    if (!productId || typeof apiClient.getJson !== "function") {
      return;
    }

    try {
      var response = await apiClient.getJson("/api/products/" + encodeURIComponent(productId));
      var product = response && response.data ? response.data : null;

      if (!product) {
        setMessage("Product not found.", "warning");
        return;
      }

      populateForm(product);
      setMessage("Editing product " + product.id + ".", "info");
    } catch (error) {
      setMessage(error && error.message ? error.message : "Unable to load product data.", "danger");
    }
  }

  function setSubmitting(form, submitting) {
    var submitButton = form.querySelector('[data-action="save-product"]');
    if (submitButton) {
      submitButton.disabled = submitting;
      submitButton.textContent = submitting ? "Saving..." : "Save Product";
    }
  }

  async function saveProduct(form) {
    var payload = buildProductPayload();
    var response;

    if (typeof apiClient.postJson !== "function" || typeof apiClient.patchJson !== "function") {
      setMessage("Product API is unavailable.", "danger");
      return;
    }

    setSubmitting(form, true);

    try {
      if (currentProductId) {
        response = await apiClient.patchJson("/api/products/" + encodeURIComponent(currentProductId), payload);
        setMessage("Product " + response.data.id + " was updated successfully.", "success");
      } else {
        response = await apiClient.postJson("/api/products", payload);
        currentProductId = String(response.data.id);
        window.history.replaceState({}, "", "admin-product-form.html?productId=" + encodeURIComponent(currentProductId));
        setMessage("Product " + response.data.id + " was created successfully.", "success");
      }

      populateForm(response.data);
    } catch (error) {
      setMessage(error && error.message ? error.message : "Unable to save product.", "danger");
    } finally {
      setSubmitting(form, false);
    }
  }

  function initAdminProductFormPage() {
    var form = document.querySelector('[data-component="product-form"]');
    if (!form) {
      return;
    }

    currentProductId = getProductIdFromUrl();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var missing = validateProductForm();

      if (missing.length > 0) {
        setMessage("Please complete " + missing.join(", ") + " before saving the product.", "warning");
        return;
      }

      saveProduct(form);
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
    loadProduct(currentProductId);
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-product-form"] = initAdminProductFormPage;
}());
