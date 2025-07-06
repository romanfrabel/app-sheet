# app-sheet
Interface for easily working with AppsSheet API in Google Apps Script

| Method  | Return type |
| ------------- | ------------- |
| `findAll(tableOrSlice)`  | Object  |
| `add()` | Object |
| `update()` | Object |
| `delete()`  | Content Cell  |

# `findAll(tableOrSlice)`
Fetches all records from a table or slice.

### Parameters
- `tableOrSlice` (`string`) - The name of the database table or slice to fetch records from

```js
//Fetches all records in the table with the name 'users'
const data = AppSheet.findAll('users');
```

# `add(tableName, records)`
Adds one or more records to a table

```js
//Fetches all records in the table with the name 'users'
const newUser = {
  firstName: "John",
  lastName: "Doe",
  email: "johndoe@example.com
}
const data = AppSheet.add('users',newUser)
```

# `update()`
Fetches all records from a table or slice.

```js
//Fetches all records in the table with the name 'users'
const data = AppSheet.findAll('users');
```



