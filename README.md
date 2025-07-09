# app-sheet
Interface for easily working with AppsSheet API in Google Apps Script

| Method  | Return type |
| ------------- | ------------- |
| [`find(tableName, [filterCondition], [orderBy], [desc], [limit])`]( #findtablename-filtercondition-orderby-desc-limit )  | Object  |
| [`add(tableName, records)`](#add(tableName,-records)) | Object |
| [`update()`](#update) | Object |
| `delete()`  | Content Cell  |

---

### `find(tableName, [filterCondition], [orderBy], [desc], [limit])`
Fetches all records from a table or slice. Optionally applies a filter condition, ordering, and limit parameters. Filters, ordering, and limiting are performed server-side by AppSheet expresions.

ℹ️ Expressions are always evaluated in the same order: first by `FILTER()` to filter the table rows, then `ORDERBY()` to sort the filtered rows, then `TOP()` to return the first `x` rows of the filtered, sorted data.


#### Parameters

| Parameter name | Type | Description |
|----|----|----|
| `tableName` | `string` | Required. The name of the table or slice to find rows in. |
| `filterCondition` | `string` | Optional. A condition that evaluates to `true` or `false` for each row.To omit filtering while accessing additional parameters, provide `"TRUE"` (upppercase string value). See [`FILTER()`](https://support.google.com/appsheet/answer/10108196?sjid=5454065892688843584-NC) for more information. | 
| `orderBy` | `string` | Optional. The name of the column to order the results by |
| `desc` | `booolean` | Optional. Whether to enforce descending order (defaults to `false`) |
| `limit` | `number` | Optional. The maximum number of rows to include.


#### Returns (`object`)
Returns an object with the following properties
| Property name | Type | Description |
|----|----|----|
| `code` | `number` | The HTTP status code returned by the server |
| `content` | `object[]` | An array of objects returned by the server.
| `rowsReturned` | `number` | The number of rows that were returned |

Example Return Value
```js
{
  code: 200,
  rowsReturned: 1,
  content: [
    {
      _RowNumber: 27,
      first_name: "John",
      last_name: "Smith",
      email: jsmith@example.com
    }
  ]
}
```

#### Sample useage

```js
//Fetches all records in the 'users' table
const data = AppSheet.find('users');

//Fetches only records where the users [last_name] column begins with "F"
const data = AppSheet.find('users', "STARTSWITH([last_name],F)" );

//Fetches all rows, sorted by [created_on] in the default ascending order
const data = AppSheet.find("users", "TRUE", "created_on");

//Fetches users with a last name beginning with "F", ordered by [first_name], descending
const data = AppSheet.find('users', "STARTSWITH([last_name],F)", "first_name", TRUE );

//Fetches the first 10 users with a last name beginning with "F", ordered by [first_name], descending
const data = AppSheet.find('users', "STARTSWITH([last_name],F)", "first_name", TRUE, 10);

```
---

### `add(tableName, records)`
Adds one or more records to a table. The `records` parameter may be a single object or an array of objects.

#### Parameters

| Parameter name | Type | Description |
|----|----|----|
| `tableName` | `string` | Required. The name of the table to add records to. |
| `records` | `object` or `object[]` | Required. The object or array of objects that represent the rows to be added to the table. |

#### Returns (`object`)

```js
//Fetches all records in the table with the name 'users'
const newUser = {
  first_name: "John",
  last_name: "Doe",
  email: "johndoe@example.com
}
const newRows = AppSheet.add('users',newUser)
```

# `update()`
Fetches all records from a table or slice.

```js
//Fetches all records in the table with the name 'users'
const data = AppSheet.findAll('users');
```



