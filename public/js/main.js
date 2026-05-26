(function () {
  "use strict";

  function getCartCountElements() {
    var elements = [];

    document.querySelectorAll('[data-role="cart-count"], #cartCount, .cart-count').forEach(function (element) {
      if (elements.indexOf(element) === -1) {
        elements.push(element);
      }
    });

    return elements;
  }

  function setGlobalCartCount(itemCount) {
    var nextCount = Number.isFinite(itemCount) ? itemCount : 0;

    getCartCountElements().forEach(function (element) {
      element.textContent = String(nextCount);
    });

    document.querySelectorAll('[data-action="open-cart"], #cartButton, .cart-link').forEach(function (cartLink) {
      cartLink.setAttribute("aria-label", "Shopping cart with " + nextCount + " items");
    });
  }

  function currentReturnToPath() {
    return window.location.pathname.replace(/^\//, "") + window.location.search + window.location.hash;
  }

  function safeReturnToPath(returnTo) {
    var target = returnTo || currentReturnToPath();

    if (!target || /^https?:\/\//i.test(target) || target.indexOf("//") === 0 || /^[a-z][a-z0-9+.-]*:/i.test(target)) {
      return "index.html";
    }

    return target.replace(/^\//, "");
  }

  function buildLoginUrl(returnTo) {
    return "login.html?returnTo=" + encodeURIComponent(safeReturnToPath(returnTo));
  }

  function redirectToLogin(returnTo) {
    window.location.assign(buildLoginUrl(returnTo));
  }

  function isAuthError(error) {
    return Boolean(error && error.status === 401);
  }

  function getHeaderActions(accountLink) {
    return accountLink ? accountLink.closest(".header-actions") || accountLink.parentElement : document.querySelector(".header-actions");
  }

  function storeAccountDefaults(accountLink) {
    if (!accountLink || accountLink.dataset.defaultsStored === "true") {
      return;
    }

    accountLink.dataset.defaultsStored = "true";
    accountLink.dataset.defaultHref = accountLink.getAttribute("href") || "login.html";
    accountLink.dataset.defaultSmall = accountLink.querySelector("small") ? accountLink.querySelector("small").textContent : "Hello, sign in";
    accountLink.dataset.defaultStrong = accountLink.querySelector("strong") ? accountLink.querySelector("strong").textContent : "Account & Lists";
  }

  function findAccountLink() {
    var accountLink = document.querySelector('[data-role="account-link"]');

    if (accountLink) {
      storeAccountDefaults(accountLink);
      return accountLink;
    }

    accountLink = document.querySelector('.header-actions .header-action[href="login.html"], .site-header .header-action[href="login.html"]');

    if (!accountLink) {
      accountLink = document.querySelector('.header-actions .header-action[href="orders.html"]:not([data-role="admin-link"]):not([data-role="logout-link"]), .site-header .header-action[href="orders.html"]:not([data-role="admin-link"]):not([data-role="logout-link"])');
    }

    if (!accountLink) {
      accountLink = document.querySelector(".header-actions .header-action:not([data-role=\"admin-link\"]):not([data-role=\"logout-link\"]), .site-header .header-action:not([data-role=\"admin-link\"]):not([data-role=\"logout-link\"])");
    }

    if (accountLink) {
      accountLink.dataset.role = "account-link";
      storeAccountDefaults(accountLink);
    }

    return accountLink;
  }

  function setAccountLinkText(accountLink, smallText, strongText) {
    var small = accountLink ? accountLink.querySelector("small") : null;
    var strong = accountLink ? accountLink.querySelector("strong") : null;

    if (small) {
      small.textContent = smallText;
    }

    if (strong) {
      strong.textContent = strongText;
    }
  }

  function removeLogoutLink() {
    var logoutLink = document.querySelector('[data-role="logout-link"]');

    if (logoutLink) {
      logoutLink.remove();
    }
  }

  function removeAdminLinks() {
    document.querySelectorAll('[data-role="admin-link"]').forEach(function (adminLink) {
      adminLink.remove();
    });
  }

  function ensureAdminLink(accountLink) {
    var headerActions = getHeaderActions(accountLink);
    var existingAdminLink = document.querySelector('[data-role="admin-link"]');

    if (!headerActions || existingAdminLink) {
      return;
    }

    var adminLink = document.createElement("a");
    adminLink.className = "header-action";
    adminLink.href = "admin-dashboard.html";
    adminLink.dataset.role = "admin-link";
    adminLink.innerHTML = "<small>Admin</small><strong>Dashboard</strong>";

    if (accountLink && accountLink.nextSibling) {
      headerActions.insertBefore(adminLink, accountLink.nextSibling);
    } else {
      headerActions.insertBefore(adminLink, headerActions.firstChild);
    }
  }

  function ensureLogoutLink(accountLink) {
    var headerActions = getHeaderActions(accountLink);
    var referenceLink = document.querySelector('[data-role="admin-link"]') || accountLink;

    if (!headerActions || document.querySelector('[data-role="logout-link"]')) {
      return;
    }

    var logoutLink = document.createElement("a");
    logoutLink.className = "header-action";
    logoutLink.href = "login.html";
    logoutLink.dataset.action = "logout";
    logoutLink.dataset.role = "logout-link";
    logoutLink.innerHTML = "<small>Account</small><strong>Logout</strong>";
    if (referenceLink && referenceLink.nextSibling) {
      headerActions.insertBefore(logoutLink, referenceLink.nextSibling);
    } else {
      headerActions.appendChild(logoutLink);
    }
  }

  function findDeliveryElements() {
    var label = document.querySelector('[data-role="delivery-label"]');
    var subtitle = document.querySelector('[data-role="delivery-subtitle"]');
    var deliveryChip;
    var small;
    var strong;

    if (label && subtitle) {
      return {
        label: label,
        subtitle: subtitle
      };
    }

    document.querySelectorAll(".location-chip").forEach(function (chip) {
      if (deliveryChip) {
        return;
      }

      small = chip.querySelector("small");
      strong = chip.querySelector("strong");

      if (small && strong && small.textContent.trim().toLowerCase() === "deliver to") {
        deliveryChip = chip;
        small.dataset.role = "delivery-label";
        strong.dataset.role = "delivery-subtitle";
        small.dataset.defaultText = small.textContent;
        strong.dataset.defaultText = strong.textContent;
      }
    });

    if (!deliveryChip) {
      return null;
    }

    return {
      label: deliveryChip.querySelector('[data-role="delivery-label"]'),
      subtitle: deliveryChip.querySelector('[data-role="delivery-subtitle"]')
    };
  }

  function setDeliveryText(labelText, subtitleText) {
    var deliveryElements = findDeliveryElements();

    if (!deliveryElements) {
      return;
    }

    deliveryElements.label.textContent = labelText;
    deliveryElements.subtitle.textContent = subtitleText;
  }

  function setSignedOutDelivery() {
    setDeliveryText("Deliver to", "Campus District");
  }

  function setAdminDelivery() {
    setDeliveryText("Admin", "Dashboard access");
  }

  function setCustomerDelivery(subtitle) {
    setDeliveryText("Deliver to", subtitle || "Your location");
  }

  function orderDeliverySubtitle(order) {
    var city = order && typeof order.city === "string" ? order.city.trim() : "";
    var zip = order && typeof order.zip === "string" ? order.zip.trim() : "";

    if (city && zip) {
      return city + " " + zip;
    }

    if (city) {
      return city;
    }

    if (zip) {
      return zip;
    }

    return "";
  }

  async function syncCustomerDeliveryLocation() {
    var apiClient = window.ShopLiteApi || {};

    setCustomerDelivery("Your location");

    if (typeof apiClient.getJson !== "function" || !findDeliveryElements()) {
      return;
    }

    try {
      var response = await apiClient.getJson("/api/orders");
      var orders = response && Array.isArray(response.data) ? response.data : [];
      var orderWithAddress = orders.find(function (order) {
        return Boolean(orderDeliverySubtitle(order));
      });
      var subtitle = orderDeliverySubtitle(orderWithAddress);

      if (subtitle) {
        setCustomerDelivery(subtitle);
      }
    } catch (error) {
      setCustomerDelivery("Your location");
    }
  }

  function setSignedInHeader(user) {
    var accountLink = findAccountLink();
    var email = user && user.email ? user.email : "";
    var role = user && user.role ? String(user.role).toLowerCase() : "customer";

    if (!accountLink || !email) {
      return;
    }

    accountLink.setAttribute("href", "orders.html");
    accountLink.setAttribute("aria-label", "Signed in as " + email);
    setAccountLinkText(accountLink, "Hello,", email);
    removeAdminLinks();

    if (role === "admin") {
      ensureAdminLink(accountLink);
      setAdminDelivery();
    } else {
      syncCustomerDeliveryLocation();
    }

    ensureLogoutLink(accountLink);
  }

  function setSignedOutHeader() {
    var accountLink = findAccountLink();

    if (accountLink) {
      accountLink.setAttribute("href", accountLink.dataset.defaultHref || "login.html");
      accountLink.setAttribute("aria-label", "Sign in to ShopLite");
      setAccountLinkText(accountLink, accountLink.dataset.defaultSmall || "Hello, sign in", accountLink.dataset.defaultStrong || "Account & Lists");
    }

    removeAdminLinks();
    removeLogoutLink();
    setSignedOutDelivery();
  }

  async function syncAuthSession() {
    var accountLink = findAccountLink();
    var apiClient = window.ShopLiteApi || {};

    if (!accountLink || typeof apiClient.getJson !== "function") {
      return null;
    }

    try {
      var response = await apiClient.getJson("/api/auth/me");
      var user = response && response.data ? response.data : null;

      if (user) {
        setSignedInHeader(user);
        return user;
      }
    } catch (error) {
      if (error && error.status !== 401 && window.console && typeof window.console.warn === "function") {
        window.console.warn("ShopLite session sync unavailable. Keeping signed-out header fallback.", error);
      }
    }

    setSignedOutHeader();
    return null;
  }

  async function syncGlobalCartCount() {
    var cartCountElements = getCartCountElements();
    var apiClient = window.ShopLiteApi || {};

    if (cartCountElements.length === 0) {
      return;
    }

    if (typeof apiClient.getJson !== "function") {
      return;
    }

    try {
      var cart = await apiClient.getJson("/api/cart");
      var itemCount = cart && cart.summary ? Number(cart.summary.itemCount) : NaN;

      if (Number.isFinite(itemCount)) {
        setGlobalCartCount(itemCount);
      }
    } catch (error) {
      if (isAuthError(error)) {
        setGlobalCartCount(0);
        return;
      }

      if (window.console && typeof window.console.warn === "function") {
        window.console.warn("ShopLite cart count sync unavailable. Keeping static cart count fallback.", error);
      }
    }
  }

  function initializeCurrentPage() {
    var page = document.body ? document.body.dataset.page : "";
    var pageInitializers = window.ShopLitePages || {};
    var initializer = pageInitializers[page];

    initializeGlobalNavigation(page);
    syncGlobalCartCount();
    syncAuthSession();

    if (typeof initializer === "function") {
      initializer();
    }
  }

  function buildProductsUrlFromSearch(form) {
    var categoryField = form.querySelector('[data-field="search-category"]');
    var queryField = form.querySelector('[data-field="search-query"]');
    var params = new URLSearchParams();
    var category = categoryField ? categoryField.value : "all";
    var query = queryField ? queryField.value.trim() : "";

    if (category && category !== "all") {
      params.set("category", category);
    }

    if (query) {
      params.set("query", query);
    }

    var queryString = params.toString();
    return "products.html" + (queryString ? "?" + queryString : "");
  }

  function initializeGlobalNavigation(page) {
    document.addEventListener("click", function (event) {
      var cartEntry = event.target.closest('[data-action="open-cart"]');
      var logoutEntry = event.target.closest('[data-action="logout"]');

      if (cartEntry) {
        event.preventDefault();
        window.location.assign("cart.html");
      }

      if (logoutEntry) {
        event.preventDefault();
        logoutCurrentUser();
      }
    });

    document.addEventListener("submit", function (event) {
      var searchForm = event.target.closest('form[data-action="search-products"]');

      if (!searchForm || page === "products") {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(buildProductsUrlFromSearch(searchForm));
    }, true);
  }

  async function logoutCurrentUser() {
    var apiClient = window.ShopLiteApi || {};

    if (typeof apiClient.postJson !== "function") {
      setSignedOutHeader();
      setGlobalCartCount(0);
      return;
    }

    try {
      await apiClient.postJson("/api/auth/logout", {});
    } catch (error) {
      if (window.console && typeof window.console.warn === "function") {
        window.console.warn("ShopLite logout request failed. Updating local header state only.", error);
      }
    }

    setSignedOutHeader();
    setGlobalCartCount(0);
    document.dispatchEvent(new CustomEvent("shoplite:logout"));
  }

  window.ShopLiteCart = {
    buildLoginUrl: buildLoginUrl,
    isAuthError: isAuthError,
    redirectToLogin: redirectToLogin,
    setCount: setGlobalCartCount,
    syncCount: syncGlobalCartCount
  };

  window.ShopLiteAuth = {
    logout: logoutCurrentUser,
    setSignedInHeader: setSignedInHeader,
    setSignedOutHeader: setSignedOutHeader,
    syncSession: syncAuthSession
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCurrentPage);
  } else {
    initializeCurrentPage();
  }
}());
