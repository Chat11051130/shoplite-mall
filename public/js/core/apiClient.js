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

  async function requestJson(url, options) {
    var response = await fetch(url, {
      method: options && options.method ? options.method : "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: options && options.body !== undefined ? JSON.stringify(options.body) : undefined
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

  function getJson(url) {
    return requestJson(url);
  }

  function postJson(url, data) {
    return requestJson(url, {
      method: "POST",
      body: data || {}
    });
  }

  function patchJson(url, data) {
    return requestJson(url, {
      method: "PATCH",
      body: data || {}
    });
  }

  function deleteJson(url) {
    return requestJson(url, {
      method: "DELETE"
    });
  }

  window.ShopLiteApi = {
    buildQueryString: buildQueryString,
    deleteJson: deleteJson,
    getJson: getJson,
    patchJson: patchJson,
    postJson: postJson
  };
}());
