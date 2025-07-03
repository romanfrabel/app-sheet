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
const AppSheet = (() => {
  const CONFIG = {
    apiKey: "", //<-- Insert the API key for your AppSheet application
    appId: "", //<-- Insert the App ID for your AppSheet application
    region: "", // <-- Data region, must be "www.appsheet.com" or "eu.appsheet.com"
    maxRetries: 2, //<--Max retries for failed API calls
  };

  const BASE_URL = `https://${CONFIG.region}/api/v2/apps/${CONFIG.appId}/tables`;

  // Normalize records: always return an array
  function normalizeRecords(input) {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
  }

  function makeRequest({ table, action, rows = [], method = "post" }) {
    const url = `${BASE_URL}/${table}/Action`;
    const payload = JSON.stringify({ Action: action, Rows: rows });

    const options = {
      method,
      contentType: "application/json",
      muteHttpExceptions: true,
      payload,
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
    const content = JSONParser?.toParsed?.(contentText) ?? contentText;
    const rowsReturned = Array.isArray(content) ? content.length : 0;

    return { code, content, rowsReturned };
  }
  
    /**
   * Fetches all records from a table or slice.
   *
   * @param {string} tableOrSlice - Name of the table or slice.
   * @returns {{code: number, content: any, rowsReturned: number}} API response object.
   */
  function findAll (tableOrSlice) {
    return makeRequest({ table: tableOrSlice, action: "Find" });
  }
  
  /**
   * Adds one or more records to a table.
   *
   * @param {string} tableName - Name of the target table.
   * @param {Object|Object[]} records - A record or array of records to add.
   * @returns {{code: number, content: any, rowsReturned: number}} API response object.
   */
  function add (tableName, records) {
    const normalized = normalizeRecords(records);
    return makeRequest({ table: tableName, action: "Add", rows: normalized });
  }

   /**
   * Updates one or more records in a table.
   *
   * @param {string} tableName - Name of the target table.
   * @param {Object|Object[]} records - A record or array of records to update.
   * @returns {{code: number, content: any, rowsReturned: number}} API response object.
   */
  function update (tableName, records) {
    const normalized = normalizeRecords(records);
    return makeRequest({ table: tableName, action: "Edit", rows: normalized });
  }

    /**
   * Deletes one or more records from a table.
   *
   * @param {string} tableName - Name of the target table.
   * @param {Object|Object[]} records - A record or array of records to delete.
   * @returns {{code: number, content: any, rowsReturned: number}} API response object.
   */
  function deleteRows (tableName, records) {
    const normalized = normalizeRecords(records);
    return makeRequest({ table: tableName, action: "Delete", rows: normalized });
  }

    /**
   * Finds a single record in a table by matching a specific key column.
   *
   * @param {string} tableName - Name of the table or slice to search.
   * @param {string} keyColumn - The name of the key column to match.
   * @param {string|number} keyValue - The value to search for.
   * @returns {{code: number, content: Object|null, rowsReturned: number}} API response object with matching row.
   */
  function findByKey (tableName, keyColumn, keyValue) {
    const result = findAll(tableName);
    if (result.code !== 200) return result;
    const match = result.content.find(r => r[keyColumn] === keyValue);
    return { ...result, content: match || null };
  }

  return {
    findAll,
    findByKey,
    add,
    update,
    delete: deleteRows,
    _config: CONFIG,
  };
})();
