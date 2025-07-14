/**
 * AppSheet API Abstraction Library
 *
 * Provides an `AppSheet` namespace for interacting with the AppSheet REST API
 * via a consistent `app()` factory and CRUD methods (`find`, `add`, `update`, `deleteRows`).
 *
 * To use: Add this `.gs` file to your Apps Script project or publish it as a library.
 *
 * Example:
 * const myApp = AppSheet.app('YOUR_APP_ID', 'YOUR_ACCESS_KEY');
 * const result = myApp.find('MyTable', '[Status]="Active"');
 */

const AppSheet = (function() {

  const Version = "1.0.0"

  /**
   * @private
   */
  function normalizeRecords(input) {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
  }

  /**
   * Safely determine the number of rows returned by an AppSheet API response.
   *
   * For a Selector (Find), the response is usually an array.
   * For actions like Add/Edit/Delete, the response is an object with a 'rows' array.
   *
   * @param {any} content - The parsed JSON response from the API.
   * @returns {number} - Number of rows returned or affected.
   *
   * @private
   */
  function parseRowsReturned(content) {
    if (Array.isArray(content)) {
      return content.length;
    }
    if (content && Array.isArray(content.rows)) {
      return content.rows.length;
    }
    return 0;
  }

  /**
   * Represents an instance of an AppSheet app for making API calls.
   *
   * The App class provides methods to perform CRUD operations
   * (find, add, update, delete) on AppSheet tables or slices using
   * the AppSheet REST API.
   *
   * Instances of this class should be created using `AppSheet.app(...)`
   * instead of calling the constructor directly.
   *
   * @class
   * @example
   * const myApp = AppSheet.app('APP_ID', 'ACCESS_KEY');
   * const result = myApp.add('MyTable', { Name: 'Jane Doe' });
   *
   * @private
   */
  class App {
    constructor(appId, applicationAccessKey, appsheetRegion, maxRetries) {
      this.CONFIG = {
        appId: appId,
        applicationAccessKey: applicationAccessKey,
        appsheetRegion: appsheetRegion,
        baseUrl: "",
        maxRetries: maxRetries
      };
      this.CONFIG.baseUrl = `https://${this.CONFIG.appsheetRegion}/api/v2/apps/${this.CONFIG.appId}/tables`;
    }

    /**
     * Finds rows with optional filter, order, and limit using Selector.
     *
     * @param {string} tableName - Table or slice name.
     * @param {string} [filterCondition] - e.g., [last_name] = "Smith"
     * @param {string} [orderBy] - Column name to order by.
     * @param {boolean} [desc=false] - Order descending if true.
     * @param {number} [limit] - Max rows to return.
     * @returns {{code: number, content: any, rowsReturned: number}}
     *
     * @public
     */
    find(tableName, filterCondition, orderBy, desc = false, limit) {
      const filter = filterCondition || "TRUE";
      let selector = `Filter(${tableName}, ${filter})`;

      if (orderBy) {
        const col = orderBy.startsWith("[") ? orderBy : `[${orderBy}]`;
        const isAsc = desc ? "FALSE" : "TRUE";
        selector = `OrderBy(${selector}, ${col}, ${isAsc})`;
      }

      if (typeof limit === "number" && limit > 0) {
        selector = `Top(${selector}, ${limit})`;
      }

      return makeRequest({
        baseUrl: this.CONFIG.baseUrl,
        applicationAccessKey: this.CONFIG.applicationAccessKey,
        maxRetries: this.CONFIG.maxRetries,
        table: tableName,
        action: "Find",
        selector: selector,
      });
    }

    /**
     * Adds new rows to the table. Each object must contain all required table fields.
     *
     * @param {string} tableName - Table or slice name.
     * @param {!Array.<Object>} records - Object or array of objects to add.
     * @returns {{code: number, content: any, rowsReturned: number}}
     *
     * @public
     */
    add(tableName, records) {
      const normalized = normalizeRecords(records);
      return makeRequest({
        baseUrl: this.CONFIG.baseUrl,
        applicationAccessKey: this.CONFIG.applicationAccessKey,
        maxRetries: this.CONFIG.maxRetries,
        table: tableName,
        action: "Add",
        rows: normalized
      });
    }

    /**
     * Update rows in the target table. Each object must contain the key field/column.
     *
     * @param {string} tableName - Table or slice name.
     * @param {!Array.<Object>} records - Object or array of objects to update.
     * @returns {{code: number, content: any, rowsReturned: number}}
     *
     * @public
     */
    update(tableName, records) {
      const normalized = normalizeRecords(records);
      return makeRequest({
        baseUrl: this.CONFIG.baseUrl,
        applicationAccessKey: this.CONFIG.applicationAccessKey,
        maxRetries: this.CONFIG.maxRetries,
        table: tableName,
        action: "Edit",
        rows: normalized
      });
    }

    /**
     * Delete one or more rows from a table. Only the key field(s) are required for each object to delete.
     *
     * @param {string} tableName - Table or slice name.
     * @param {!Array.<Object>} records - Object or array of objects to delete.
     * @returns {{code: number, content: any, rowsReturned: number}}
     *
     * @public
     */
    deleteRows(tableName, records) {
      const normalized = normalizeRecords(records);
      return makeRequest({
        baseUrl: this.CONFIG.baseUrl,
        applicationAccessKey: this.CONFIG.applicationAccessKey,
        maxRetries: this.CONFIG.maxRetries,
        table: tableName,
        action: "Delete",
        rows: normalized
      });
    }
  }

  /**
   * Creates a new App instance for interacting with the AppSheet API.
   *
   * This factory function validates the required configuration and returns
   * an `App` object, which can perform `find`, `add`, `update`, and `delete`
   * operations on AppSheet tables or slices.
   *
   * @function
   * @param {string} appId - The unique AppSheet app ID.
   * @param {string} applicationAccessKey - The AppSheet API access key.
   * @param {string} [appsheetRegion="www.appsheet.com"] - AppSheet region; must be "www.appsheet.com" or "eu.appsheet.com".
   * @param {number} [maxRetries=2] - Number of retry attempts if the API call fails.
   * @returns {App} - A new App instance ready to use.
   *
   * @throws {Error} If any required parameter is missing or invalid.
   *
   * @example
   * const myApp = AppSheet.app('YOUR_APP_ID', 'YOUR_ACCESS_KEY');
   * const result = myApp.find('MyTable', '[Status]="Active"');
   *
   * @public
   */
  function app(appId, applicationAccessKey, appsheetRegion = "www.appsheet.com", maxRetries = 2) {
    if (!appId || typeof appId !== "string" || appId.length === 0) {
      throw new Error(`[AppSheet] - "appId" must be a valid string. Received "${typeof appId}"`);
    }
    if (!applicationAccessKey || typeof applicationAccessKey !== "string" || applicationAccessKey.length === 0) {
      throw new Error(`[AppSheet] - "applicationAccessKey" must be a valid, non-empty string. Received "${applicationAccessKey}"`);
    }
    if (appsheetRegion !== "www.appsheet.com" && appsheetRegion !== "eu.appsheet.com") {
      throw new Error(`[AppSheet] - "appsheetRegion" must be either "www.appsheet.com" or "eu.appsheet.com". Received "${appsheetRegion}"`);
    }
    if (typeof maxRetries !== 'number' || maxRetries < 1) {
      throw new Error(`[AppSheet] - "maxRetries" must be a valid non-zero number. Received "${maxRetries}"`);
    }

    return new App(appId, applicationAccessKey, appsheetRegion, maxRetries);
  }

  /**
   * Makes a request to the AppSheet API for the specified table and action.
   *
   * Handles retries, safe JSON parsing, and wraps the API response in a
   * consistent structure.
   *
   * If the API returns non-JSON content (such as an error page or empty body),
   * the raw response text is returned as `content`.
   *
   * @function
   * @param {Object} params - Request configuration.
   * @param {string} params.baseUrl - Base URL for the AppSheet app tables.
   * @param {string} params.applicationAccessKey - AppSheet API access key.
   * @param {number} params.maxRetries - Number of retry attempts for failed requests.
   * @param {string} params.table - Target table or slice name.
   * @param {string} params.action - Action to perform ("Find", "Add", "Edit", "Delete").
   * @param {Array<Object>} [params.rows=[]] - Rows to send (for Add, Edit, Delete).
   * @param {string|null} [params.selector=null] - Selector expression (for Find).
   * @param {string} [params.method="post"] - HTTP method to use.
   * @returns {{code: number, content: any, rowsReturned: number}} - Response code,
   * parsed content (or raw text if parsing fails), and number of rows returned.
   *
   * @private
   */
  function makeRequest({ baseUrl, applicationAccessKey, maxRetries, table, action, rows = [], selector = null, method = "post" }) {
    const url = `${baseUrl}/${table}/Action`;

    const payload = {
      Action: action,
      Rows: rows,
    };

    if (selector) {
      payload.Properties = { Selector: selector };
    }

    const options = {
      method,
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify(payload),
      headers: {
        ApplicationAccessKey: applicationAccessKey,
      },
    };

    let response;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        response = UrlFetchApp.fetch(url, options);
        break;
      } catch (e) {
        attempts++;
        if (attempts >= maxRetries) {
          throw new Error(`AppSheet API failed after ${maxRetries} attempts: ${e}`);
        }
        Utilities.sleep(500);
      }
    }

    const code = response.getResponseCode();
    const contentText = response.getContentText();
    let content;

    try {
      content = JSON.parse(contentText);
    } catch (e) {
      content = contentText || null;
    }

    const rowsReturned = parseRowsReturned(content);

    return { code, content, rowsReturned };
  }

  return {
    app: app,
    version: Version
  };

})();
