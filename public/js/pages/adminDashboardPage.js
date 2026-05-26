(function () {
  "use strict";

  var apiClient = window.ShopLiteApi || {};
  var dashboardCharts = {
    categorySales: null,
    orderStatus: null
  };

  function getCssVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value) || 0);
  }

  function formatStatus(value) {
    return String(value || "processing").split("-").map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).join(" ");
  }

  function statusClass(status) {
    return "status-" + String(status || "processing").toLowerCase();
  }

  function showToast(message) {
    var toast = document.getElementById("adminDashboardToast");
    if (!toast) {
      return;
    }

    var body = toast.querySelector(".toast-body");
    if (body) {
      body.textContent = message;
    }

    toast.classList.add("show");
    toast.style.display = "block";

    if (window.bootstrap) {
      var existingToast = window.bootstrap.Toast.getInstance(toast);
      if (existingToast) {
        existingToast.dispose();
      }
      window.bootstrap.Toast.getOrCreateInstance(toast, { autohide: false }).show();
      toast.classList.add("show");
      toast.style.display = "block";
    }
  }

  function setText(selector, value) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = value;
    }
  }

  function updateSummaryCards(summary) {
    setText('[data-role="total-sales"]', formatCurrency(summary.totalRevenue));
    setText('[data-role="total-orders"]', formatNumber(summary.totalOrders));
    setText('[data-role="active-products"]', formatNumber(summary.totalProducts));
    setText('[data-role="registered-users"]', formatNumber(summary.registeredUsers));
  }

  function chartColors() {
    return [
      getCssVariable("--sl-orange"),
      getCssVariable("--sl-blue"),
      getCssVariable("--sl-green"),
      getCssVariable("--sl-red"),
      getCssVariable("--sl-gray-500"),
      getCssVariable("--sl-navy-950")
    ];
  }

  function destroyChart(chart) {
    if (chart && typeof chart.destroy === "function") {
      chart.destroy();
    }
  }

  function renderOrderStatusSummary(statusRows) {
    var container = document.querySelector('[data-role="order-status-summary"]');

    if (!container) {
      return;
    }

    container.innerHTML = statusRows.map(function (row) {
      return '<span class="status-badge ' + statusClass(row.status) + '">' + formatStatus(row.status) + ": " + formatNumber(row.count) + "</span>";
    }).join("");
  }

  function renderOrderStatusChart(statusRows) {
    var canvas = document.getElementById("salesTrendChart");

    if (!canvas || !window.Chart) {
      renderOrderStatusSummary(statusRows);
      return;
    }

    destroyChart(dashboardCharts.orderStatus);
    dashboardCharts.orderStatus = new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: statusRows.map(function (row) {
          return formatStatus(row.status);
        }),
        datasets: [{
          label: "Orders",
          data: statusRows.map(function (row) {
            return Number(row.count) || 0;
          }),
          backgroundColor: chartColors().slice(0, statusRows.length),
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });

    canvas.dataset.chartReady = "true";
    renderOrderStatusSummary(statusRows);
  }

  function renderCategorySalesChart(categoryRows) {
    var canvas = document.getElementById("categorySalesChart");

    if (!canvas || !window.Chart) {
      return;
    }

    destroyChart(dashboardCharts.categorySales);
    dashboardCharts.categorySales = new window.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: categoryRows.map(function (row) {
          return formatStatus(row.category);
        }),
        datasets: [{
          data: categoryRows.map(function (row) {
            return Number(row.revenue) || 0;
          }),
          backgroundColor: chartColors(),
          borderColor: "#ffffff",
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 12,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return context.label + ": " + formatCurrency(context.parsed || 0);
              }
            }
          }
        },
        cutout: "62%"
      }
    });

    canvas.dataset.chartReady = "true";
  }

  function renderCategoryTable(categoryRows) {
    var tableBody = document.querySelector('[data-component="best-selling-products"] tbody');

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = categoryRows.map(function (row) {
      var category = formatStatus(row.category);
      return [
        "<tr>",
        "  <td>",
        '    <div class="d-flex gap-3 align-items-center">',
        '      <img class="table-thumb" src="assets/images/products/placeholder-product.jpg" alt="' + escapeHtml(category) + ' category">',
        "      <strong>" + escapeHtml(category) + " category</strong>",
        "    </div>",
        "  </td>",
        "  <td>" + escapeHtml(category) + "</td>",
        "  <td>" + formatNumber(row.itemsSold) + "</td>",
        '  <td class="fw-bold">' + formatCurrency(row.revenue) + "</td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderRecentOrders(recentOrders) {
    var container = document.querySelector('[data-component="recent-orders"] .list-group');

    if (!container) {
      return;
    }

    if (!recentOrders.length) {
      container.innerHTML = '<div class="list-group-item px-0"><strong>No recent orders</strong><p class="muted-note mb-0">Backend order data is empty.</p></div>';
      return;
    }

    container.innerHTML = recentOrders.map(function (order) {
      return [
        '<div class="list-group-item px-0 d-flex justify-content-between gap-3">',
        "  <div>",
        "    <strong>" + escapeHtml(order.id) + "</strong>",
        '    <p class="muted-note mb-0">' + escapeHtml(order.customerName) + ", " + formatNumber(order.itemCount) + " item" + (Number(order.itemCount) === 1 ? "" : "s") + " - " + formatCurrency(order.total) + "</p>",
        "  </div>",
        '  <span class="status-badge ' + statusClass(order.status) + '">' + formatStatus(order.status) + "</span>",
        "</div>"
      ].join("");
    }).join("");
  }

  async function loadDashboardData(showRefreshToast) {
    if (typeof apiClient.getJson !== "function") {
      showToast("Dashboard API is unavailable.");
      return;
    }

    try {
      var responses = await Promise.all([
        apiClient.getJson("/api/admin/dashboard/summary"),
        apiClient.getJson("/api/admin/dashboard/category-sales"),
        apiClient.getJson("/api/admin/dashboard/order-status"),
        apiClient.getJson("/api/admin/dashboard/recent-orders")
      ]);
      var summary = responses[0] && responses[0].data ? responses[0].data : {};
      var categoryRows = responses[1] && Array.isArray(responses[1].data) ? responses[1].data : [];
      var statusRows = responses[2] && Array.isArray(responses[2].data) ? responses[2].data : [];
      var recentOrders = responses[3] && Array.isArray(responses[3].data) ? responses[3].data : [];

      updateSummaryCards(summary);
      renderCategorySalesChart(categoryRows);
      renderOrderStatusChart(statusRows);
      renderCategoryTable(categoryRows);
      renderRecentOrders(recentOrders);

      if (showRefreshToast) {
        showToast("Dashboard data refreshed from the backend.");
      }
    } catch (error) {
      showToast(error && error.message ? error.message : "Unable to load dashboard data.");
    }
  }

  function initAdminDashboardPage() {
    var dashboard = document.querySelector('[data-component="stat-card-grid"]');
    if (!dashboard) {
      return;
    }

    if (!window.Chart) {
      showToast("Chart.js is not available. Showing backend summary values only.");
    }

    document.addEventListener("click", function (event) {
      var refreshButton = event.target.closest('[data-action="refresh-dashboard"]');
      var exportButton = event.target.closest('[data-action="export-dashboard-report"]');

      if (refreshButton) {
        loadDashboardData(true);
        return;
      }

      if (exportButton) {
        showToast("Mock dashboard report export is ready.");
      }
    });

    loadDashboardData(false);
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-dashboard"] = initAdminDashboardPage;
}());
