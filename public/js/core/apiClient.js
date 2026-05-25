(function () {
  "use strict";

  function buildQueryString(params) {
    var searchParams = new URLSearchParams();

    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];

      if (value === undefined || value === null || value === "") {
        return;
      }

      searchParams.set(key, String(value));
    });

    var queryString = searchParams.toString();
    return queryString ? "?" + queryString : "";
  }

  async function getJson(url) {
    var response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });
    var payload = null;

    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (!response.ok) {
      var message = payload && payload.error && payload.error.message ? payload.error.message : "Request failed";
      var requestError = new Error(message);
      requestError.status = response.status;
      requestError.data = payload;
      throw requestError;
    }

    return payload;
  }

  window.ShopLiteApi = {
    buildQueryString: buildQueryString,
    getJson: getJson
  };
}());
