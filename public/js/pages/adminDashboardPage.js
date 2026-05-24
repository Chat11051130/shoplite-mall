(function () {
  "use strict";

  function getCssVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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

  function createSalesTrendChart() {
    var canvas = document.getElementById("salesTrendChart");
    if (!canvas || !window.Chart) {
      return null;
    }

    return new window.Chart(canvas, {
      type: "line",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{
          label: "Sales",
          data: [5200, 6400, 5900, 7600, 8300, 10400, 9120],
          borderColor: getCssVariable("--sl-orange"),
          backgroundColor: "rgba(245, 158, 11, 0.16)",
          borderWidth: 3,
          fill: true,
          tension: 0.38,
          pointRadius: 4,
          pointBackgroundColor: getCssVariable("--sl-navy-950")
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
              callback: function (value) {
                return "$" + value / 1000 + "k";
              }
            }
          }
        }
      }
    });
  }

  function createCategorySalesChart() {
    var canvas = document.getElementById("categorySalesChart");
    if (!canvas || !window.Chart) {
      return null;
    }

    return new window.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Electronics", "Fashion", "Home", "Beauty", "Grocery"],
        datasets: [{
          data: [42, 22, 16, 12, 8],
          backgroundColor: [
            getCssVariable("--sl-orange"),
            getCssVariable("--sl-blue"),
            getCssVariable("--sl-green"),
            getCssVariable("--sl-red"),
            getCssVariable("--sl-gray-500")
          ],
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
          }
        },
        cutout: "62%"
      }
    });
  }

  function initializeCharts() {
    window.ShopLiteDashboardCharts = {
      salesTrend: createSalesTrendChart(),
      categorySales: createCategorySalesChart()
    };

    var salesCanvas = document.querySelector('[data-chart="sales-trend"]');
    var categoryCanvas = document.querySelector('[data-chart="category-sales"]');

    if (window.ShopLiteDashboardCharts.salesTrend && salesCanvas) {
      salesCanvas.dataset.chartReady = "true";
    }

    if (window.ShopLiteDashboardCharts.categorySales && categoryCanvas) {
      categoryCanvas.dataset.chartReady = "true";
    }

    return Boolean(window.ShopLiteDashboardCharts.salesTrend && window.ShopLiteDashboardCharts.categorySales);
  }

  function refreshDashboard() {
    var totalSales = document.querySelector('[data-role="total-sales"]');
    var totalOrders = document.querySelector('[data-role="total-orders"]');

    if (totalSales) {
      totalSales.textContent = "$49,120";
    }

    if (totalOrders) {
      totalOrders.textContent = "1,291";
    }

    showToast("Dashboard mock data refreshed.");
  }

  function initAdminDashboardPage() {
    var dashboard = document.querySelector('[data-component="stat-card-grid"]');
    if (!dashboard) {
      return;
    }

    var chartsReady = initializeCharts();
    if (!chartsReady) {
      showToast("Chart.js is not available for this static preview.");
    }

    document.addEventListener("click", function (event) {
      var refreshButton = event.target.closest('[data-action="refresh-dashboard"]');
      var exportButton = event.target.closest('[data-action="export-dashboard-report"]');

      if (refreshButton) {
        refreshDashboard();
        return;
      }

      if (exportButton) {
        showToast("Mock dashboard report export is ready.");
      }
    });
  }

  window.ShopLitePages = window.ShopLitePages || {};
  window.ShopLitePages["admin-dashboard"] = initAdminDashboardPage;
}());
