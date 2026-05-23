(function () {
  "use strict";

  function ensureToast() {
    var existing = document.getElementById("prototypeToast");
    if (existing) {
      return existing;
    }

    var container = document.createElement("div");
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.innerHTML = '<div id="prototypeToast" class="toast align-items-center" role="status" aria-live="polite" aria-atomic="true"><div class="d-flex"><div class="toast-body">Prototype action completed.</div><button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button></div></div>';
    document.body.appendChild(container);
    return document.getElementById("prototypeToast");
  }

  function showToast(message) {
    if (!window.bootstrap) {
      return;
    }

    var toastElement = ensureToast();
    var body = toastElement.querySelector(".toast-body");
    if (body) {
      body.textContent = message;
    }
    window.bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 1600 }).show();
  }

  function initAddToCartButtons() {
    document.querySelectorAll("[data-action='add-to-cart']").forEach(function (button) {
      button.addEventListener("click", function () {
        showToast("Item added to your ShopLite cart.");
      });
    });
  }

  function initQuantityControls() {
    document.querySelectorAll("[data-quantity-control]").forEach(function (control) {
      var input = control.querySelector("input");
      if (!input) {
        return;
      }

      control.querySelectorAll("[data-quantity-change]").forEach(function (button) {
        button.addEventListener("click", function () {
          var change = Number(button.getAttribute("data-quantity-change"));
          var current = Number(input.value || "1");
          var next = Math.max(1, current + change);
          input.value = String(next);
          showToast("Quantity updated.");
        });
      });
    });
  }

  function initPrototypeForms() {
    document.querySelectorAll("[data-prototype-form]").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var targetSelector = form.getAttribute("data-validation-target");
        var target = targetSelector ? document.querySelector(targetSelector) : null;
        if (target) {
          target.className = "validation-message alert alert-success mt-3";
          target.textContent = "Prototype validation passed. This page is ready for later final project integration.";
        } else {
          showToast("Prototype form submitted.");
        }
      });
    });
  }

  function statusClass(status) {
    var normalized = String(status || "").toLowerCase();
    if (normalized === "paid" || normalized === "active" || normalized === "delivered" || normalized === "completed") {
      return "status-badge status-" + normalized;
    }
    if (normalized === "processing" || normalized === "pending" || normalized === "shipped" || normalized === "cancelled" || normalized === "draft") {
      return "status-badge status-" + normalized;
    }
    return "status-badge status-draft";
  }

  function initStatusSelectors() {
    document.querySelectorAll("[data-status-select]").forEach(function (select) {
      select.addEventListener("change", function () {
        var row = select.closest("[data-status-row]");
        var badge = row ? row.querySelector("[data-status-badge]") : null;
        if (badge) {
          badge.textContent = select.value;
          badge.className = statusClass(select.value);
          showToast("Order status updated in the prototype.");
        }
      });
    });
  }

  function initCharts() {
    if (!window.Chart) {
      return;
    }

    var salesCanvas = document.getElementById("salesTrendChart");
    if (salesCanvas) {
      new window.Chart(salesCanvas, {
        type: "line",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [{
            label: "Sales",
            data: [4200, 5100, 4800, 6200, 7400, 9100, 8600],
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.16)",
            tension: 0.38,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    var categoryCanvas = document.getElementById("categorySalesChart");
    if (categoryCanvas) {
      new window.Chart(categoryCanvas, {
        type: "doughnut",
        data: {
          labels: ["Electronics", "Home", "Fashion", "Beauty", "Grocery"],
          datasets: [{
            data: [34, 22, 18, 14, 12],
            backgroundColor: ["#f59e0b", "#2563eb", "#15803d", "#c2410c", "#6b7280"]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } }
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initAddToCartButtons();
    initQuantityControls();
    initPrototypeForms();
    initStatusSelectors();
    initCharts();
  });
})();
