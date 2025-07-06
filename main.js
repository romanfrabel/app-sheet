/**
 * AppSheet API abstraction layer for Google Apps Script.
 * 
 * Provides a simple interface to perform CRUD operations against
 * AppSheet tables and slices using the REST API.
 * 
 * Features:
 * - Add, update, delete, and find records
 * - Supports slices and full tables
 * - Retries failed requests automatically
 * - Accepts both single and multiple record inputs
 * 
 * @namespace AppSheet
 */
/**
 * AppSheet API abstraction layer for Google Apps Script.
 */
const AppSheet = (() => {
  const CONFIG = {
    apiKey: "", // <-- Fill in your API key
    appId: "98c5f507-7163-4f46-ab8b-f946a9839222",
    region: "www.appsheet.com", // Global region
    maxRetries: 2,
  };

  const BASE_URL = `https://${CONFIG.region}/api/v2/apps/${CONFIG.appId}/tables`;

  function normalizeRecords(input) {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
  }

  function makeRequest({ table, action, rows = [], selector = null, method = "post" }) {
    const url = `${BASE_URL}/${table}/Action`;

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
        ApplicationAccessKey: CONFIG.apiKey,
      },
    };

    let response;
    let attempts = 0;

    while (attempts < CONFIG.maxRetries) {
      try {
        response = UrlFetchApp.fetch(url, options);
        break;
      } catch (e) {
        attempts++;
        if (attempts >= CONFIG.maxRetries) {
          throw new Error(`AppSheet API failed after ${CONFIG.maxRetries} attempts: ${e}`);
        }
        Utilities.sleep(500);
      }
    }

    const code = response.getResponseCode();
    const contentText = response.getContentText();
    const content = JSON.parse(contentText);
    const rowsReturned = Array.isArray(content) ? content.length : 0;

    return { code, content, rowsReturned };
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
   */
  function find(tableName, filterCondition, orderBy, desc = false, limit) {
    const filter = filterCondition || "TRUE";
    let selector = `Filter(${tableName}, ${filter})`;

    if (orderBy) {
      const col = orderBy.startsWith("[") ? orderBy : `[${orderBy}]`;
      const isAsc = desc ? "FALSE" : "TRUE"; // TRUE = ascending in AppSheet ORDERBY
      selector = `OrderBy(${selector}, ${col}, ${isAsc})`;
    }

    if (typeof limit === "number" && limit > 0) {
      selector = `Top(${selector}, ${limit})`;
    }

    return makeRequest({
      table: tableName,
      action: "Find",
      selector: selector,
    });
  }

  function add(tableName, records) {
    const normalized = normalizeRecords(records);
    return makeRequest({ table: tableName, action: "Add", rows: normalized });
  }

  function update(tableName, records) {
    const normalized = normalizeRecords(records);
    return makeRequest({ table: tableName, action: "Edit", rows: normalized });
  }

  function deleteRows(tableName, records) {
    const normalized = normalizeRecords(records);
    return makeRequest({ table: tableName, action: "Delete", rows: normalized });
  }

  function findByKey(tableName, keyColumn, keyValue) {
    const result = find(tableName, `[${keyColumn}] = "${keyValue}"`);
    if (result.code !== 200) return result;
    const match = result.content.length > 0 ? result.content[0] : null;
    return { ...result, content: match, rowsReturned: match ? 1 : 0 };
  }

  return {
    find,
    findByKey,
    add,
    update,
    delete: deleteRows,
    _config: CONFIG,
  };
})();

