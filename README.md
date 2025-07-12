# Mocovi State Management Library

This library manages state data in React Native. It is built up of collections of data. Each collection has a name, for example "users". Each collection has several models. When you use a collection or model in your components, they will be rendered if data in the collection or model changes. 

For accessing state data, you should use the `useStore` hook which provides a flexible and consistent API. Legacy hooks (`useCollection`, `useModel`, `useSelected`, and `useController`) are deprecated and will be removed in a future version.

Each collection has a currently selected global model. This makes it possible to use selected model, and get the same in all components without passing the id. But be sure that this is only used in an app where there can't be any doubt of who selects the model. In the future this functionality will be removed because it has shown to be problematic for reuse of components.

The library supports local storage both on web and native. You have to give it a handler for set and get using your preffered storage lib. Async storage is not supported for now.

Syncronisation to back end server is also supported, with different strategies. Only get can be used for data not changed by the user. Full sync for data changed by the user that needs to be stored. You can also use manual sync where you ask to fetch or push data.

Sync and storage is running async so that fast changed doesn't result in many calls. When the sync or storage functionality is called, it will get all changes since last call. TODO: now the internal sotrage will reset history when called. So storage and sync needs to be run at the same time. Support either multiple callers identifying them selves, or by just keeping the history and give a ponter back so the caller can ask later to get entries beyond this number. Storing the whole history also makes undo/redo almost for free.

The system used to support undo and redo, but this system is broken after other updated and will be fixed later when the TODO in the previous paragraph is fixed.

You have to initiate every collection by running a createCollection(). This is not done in the render thread, but should be done in the component load phase. Create collection will return the store object. You can then use the `useStore` hook to access and manipulate data in the collection. A typical pattern is to create one file for each collection which creates this on load and exports any custom functionality. Components can then import and use the `useStore` hook with the appropriate store ID.

## Core Concepts and Types

### Model
`Model` is the fundamental data type in Mocovi. All models must have an `id` property and can optionally include timestamps like `created_at`, `updated_at`, `synced_at`, `deleted_at`, and `changed_at`. These timestamps help with synchronization, persistence, and tracking changes.

### Store
`Store<Data, ExtraController>` is the central entity for managing a collection of models. It holds the data, provides access to controllers and hooks, and handles synchronization and persistence. A store has a unique ID and manages its own state, including a currently selected model.

### BaseController
`BaseController<Data>` provides the core methods for interacting with data in a store. It includes functions for getting, setting, and deleting models, as well as querying and manipulating the collection. The controller is the primary interface for modifying data programmatically.

### EventHandler
`EventHandler<Data>` manages subscriptions to data changes. It allows components to subscribe to changes and be notified when data is updated, ensuring that UI stays in sync with the underlying data.

### CreateCollectionOptions
`CreateCollectionOptions<Data, ExtraController>` configures how a collection behaves, including persistence, synchronization mode, auto-selection of models, and custom controller extensions.

## Hooks

### useStore
`useStore<Data>(storeId, modelIdOrFilter?, sortByKey?)` provides a unified interface for accessing and manipulating state data. It returns an object with four properties:
- `collection`: An array of models matching the filter criteria
- `model`: The first model in the collection or null if the collection is empty. Use this when you use `useStore("storeId", "modelId")` to get the first model in the collection.
- `setCollection`: A function to update the entire collection
- `setModel`: A function to update a single model
- `controller`: Direct access to the base controller for advanced operations

Components using this hook will re-render when relevant data changes based on the filter criteria. See the "State Access with useStore" section for detailed usage examples.

### Legacy Hooks (Deprecated)

The following hooks are maintained for backward compatibility but are deprecated in favor of `useStore`. They will be removed in a future version:

#### useCollection (Deprecated)
`useCollection<Data>()` provides access to all models in a collection. It returns an array with three elements: the collection data array, a function to update the collection, and the currently selected model ID.

**Migration:** Replace with `useStore`:
```typescript
// Old way
const [collection, setCollection, selectedId] = useCollection();

// New way
const { collection, setCollection } = useStore<Data>("storeId");
```

#### useModel (Deprecated)
`useModel<Data>(modelId)` provides access to a specific model by ID. It returns an array with two elements: the model and a function to update it.

**Migration:** Replace with `useStore`:
```typescript
// Old way
const [model, setModel] = useModel("modelId");

// New way
const { collection, setModel } = useStore<Data>("storeId", "modelId");
const model = collection[0] || null;
```

#### useSelected (Deprecated)
`useSelected<Data>()` provides access to the currently selected model in a collection. It returns an array with two elements: the selected model and a function to update it.

**Migration:** Replace with custom filter logic using `useStore` that matches your selection criteria.

#### useController (Deprecated)
`useController<Data, ExtraController>()` provides direct access to the store controller. Unlike the other hooks, components using this hook won't automatically re-render when data changes.

**Migration:** Most controller operations can be performed using the `setModel` and `setCollection` functions from `useStore`.

### Other Hooks

#### useCom
`useCom(callback)` provides a way to send commands to the synchronization layer. It returns an object with a `send` function that can be used to send custom commands, which is useful for operations beyond simple CRUD.

## Synchronization and Persistence

### Sync
`Sync` defines the interface for synchronizing data with a backend server. It provides methods for sending and receiving messages, handling changes, and managing connections. Mocovi supports different synchronization modes: "auto", "set", "get", and "manual".

### Persist
`Persist` defines the interface for local storage. It requires `set` and `get` methods for storing and retrieving data as strings. This allows Mocovi to work with various storage libraries on both web and native platforms.

### SyncModes
`SyncModes` defines the synchronization strategies: "auto" (full bidirectional sync), "set" (only send changes to server), "get" (only receive changes from server), "manual" (explicit fetch/push), or `false` (no sync).

## Utility Functions

### createCollection
`createCollection<Data, ExtraController>(id, initialData, options)` creates a new store with the specified ID, initial data, and options. It returns a Store object that provides access to the collection's data and functionality.

### clearAll
`clearAll()` clears all stores, removing all data from memory. This is useful for resetting the application state, such as when a user logs out.

### diff
`diff(name, oldObject, newObject, changes)` prints the differences between two objects, which is helpful for debugging and tracking changes.

### isDifferent
`isDifferent(oldModel, newModel)` compares two models to determine if they are different, ignoring special fields like timestamps and ID.

### modelDiff
`modelDiff(previousModel, currentModel)` creates an object containing only the fields that have changed between two models.

## Components

### StoreInspector
`StoreInspector` is a debugging component that displays information about all stores and their data. It's useful during development for inspecting the state of your application.

### ModelList
`ModelList` displays a list of models in a collection and allows for selection. It's a utility component for debugging and managing models.

### ModelView
`ModelView` displays the details of a selected model. It shows all fields of the model, organized by data fields and time fields.

## State Access with useStore

The `useStore` hook provides a unified interface for accessing and manipulating state data. It replaces the separate `useModel`, `useCollection`, `useSelected` and `useController` hooks with a more flexible and consistent API. 

The new API offers several advantages:
- Consistent return format: always returns `{ collection, setCollection, setModel, controller }`
- Powerful filtering capabilities: filter by ID, multiple criteria, or regex patterns
- Built-in sorting: sort collections by any property
- Optimized re-rendering: components only re-render when relevant data changes
- Advanced functionality: direct controller access for specialized operations

All new code should use `useStore` instead of the legacy hooks.

### Collection Access
```typescript
const { collection, setCollection, setModel } = useStore<User>("users");
```
Returns a filtered collection of models and functions to update them. The component will re-render on any change in the collection.

### Filtered Collection Access
```typescript
// Filter by ID (returns array of 1 or 0 items)
const { collection, setCollection, setModel } = useStore<User>("users", "user123");

// Filter by multiple criteria or filter by another field than id:
const { collection, setCollection, setModel } = useStore<User>("users", { 
  role: "admin", 
  active: true 
});

// Filter with regex
const { collection, setCollection, setModel } = useStore<User>("users", { 
  name: /^John/ 
});
```
Returns a filtered collection based on the provided criteria. The component will re-render only when matching models change.

### Sorted Collection Access
```typescript
// Sort by a field
const { collection, setCollection, setModel } = useStore<User>("users", undefined, "lastName");

// Filter and sort
const { collection, setCollection, setModel } = useStore<User>("users", { role: "admin" }, "lastName");
```
Returns a filtered and sorted collection. The component will re-render when matching models change.

### Advanced Controller Access
```typescript
// Access the controller for advanced operations
const { controller } = useStore<User>("users");

// Use controller methods directly
const selectedUser = controller.getSelected();
controller.select("user123");
const userCount = controller.size();
const firstUser = controller.getFirst();
```
Using the controller gives direct access to the full API of the base controller, allowing for more complex operations that go beyond the simplified `setModel` and `setCollection` functions.

## Future Improvements

- Move the data storage to a context with a `<Mocovi>` component wrapper
- Improve undo/redo functionality
- Support for async storage
- Better handling of synchronization history

