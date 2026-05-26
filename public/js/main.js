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

    if (!target || /^https?:\/\//i.test(target) || target.indexOf("//") === 0) {
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

  function findAccountLink() {
    var accountLink = document.querySelector('[data-role="account-link"]');

    if (accountLink) {
      return accountLink;
    }

    accountLink = document.querySelector('.header-actions .header-action[href="login.html"]');

    if (accountLink) {
      accountLink.dataset.role = "account-link";
      accountLink.dataset.defaultHref = accountLink.getAttribute("href") || "login.html";
      accountLink.dataset.defaultSmall = accountLink.querySelector("small") ? accountLink.querySelector("small").textContent : "Hello, sign in";
      accountLink.dataset.defaultStrong = accountLink.querySelector("strong") ? accountLink.querySelector("strong").textContent : "Account & Lists";
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

  function ensureLogoutLink(accountLink) {
    var headerActions = accountLink ? accountLink.closest(".header-actions") : null;

    if (!headerActions || document.querySelector('[data-role="logout-link"]')) {
      return;
    }

    var logoutLink = document.createElement("a");
    logoutLink.className = "header-action";
    logoutLink.href = "login.html";
    logoutLink.dataset.action = "logout";
    logoutLink.dataset.role = "logout-link";
    logoutLink.innerHTML = "<small>Account</small><strong>Logout</strong>";
    headerActions.insertBefore(logoutLink, accountLink.nextSibling);
  }

  function setSignedInHeader(user) {
    var accountLink = findAccountLink();
    var email = user && user.email ? user.email : "";

    if (!accountLink || !email) {
      return;
    }

    accountLink.setAttribute("href", "orders.html");
    accountLink.setAttribute("aria-label", "Signed in as " + email);
    setAccountLinkText(accountLink, "Hello,", email);
    ensureLogoutLink(accountLink);
  }

  function setSignedOutHeader() {
    var accountLink = findAccountLink();

    if (accountLink) {
      accountLink.setAttribute("href", accountLink.dataset.defaultHref || "login.html");
      accountLink.setAttribute("aria-label", "Sign in to ShopLite");
      setAccountLinkText(accountLink, accountLink.dataset.defaultSmall || "Hello, sign in", accountLink.dataset.defaultStrong || "Account & Lists");
    }

    removeLogoutLink();
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
