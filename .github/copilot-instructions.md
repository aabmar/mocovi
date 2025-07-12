
# Mocovi: Technical Summary

## Architecture
- React state management focused on collections of typed models (`Model` interface with required `id`)
- Core abstractions: `Store<T>`, `BaseController<T>`, `EventHandler<T>`
- Pub/sub event system with optimized re-rendering

## Data Flow
- `createCollection<T>()` bootstraps a store with controllers and hooks
- Components consume state via hooks, triggering selective re-renders
- Write operations flow through controllers, propagating changes via event handler

## State Access Patterns
- Collection access: `useStore<T>("storeId")` → `{collection, setCollection, setModel, controller, model, useCom}`
- Filtered collection access: `useStore<T>("storeId", "modelId")` → `{collection, setCollection, setModel, controller, model, useCom}` where model the first model in the collection or null
- Complex filtering: `useStore<T>("storeId", {key: value, ...})` → `{collection, setCollection, setModel, controller, model, useCom}` where collection contains models matching all criteria
- Sorting: `useStore<T>("storeId", filterObj?, "sortKey")` → `{collection, setCollection, setModel, controller, model, useCom}` where collection is sorted by the specified key

Note that both model and collection are always returned. If collection.length > 0, model is collection[0]. If collection is empty, model is null. This is a good shortcut when using "useStore("storeId", "modelId").

useCom() hook is returned to enable direct communication with server, and provides a callback.

# Re Render on change
useStore will update a local useState on every change, triggering re render. If you need access to data, but not want this, use {controller, useCom} = useController("storeId") instead. Base controller supplies:

- get("id) - returns a model
- getCollection() - returns array of all models
- set(Model) - updates a model
- setCollection([]) - replaces the whole collection
- setField("id", "field", "value") - set a specific field.
- subscribe: (callback: (data: Data[]) => void) => (data: Data[]) => void;
- unsubscribe: (callback: (data: Data[]) => void) => void;
- Many more, check the source.

subscribe and unsubscribe are perfect to use in a useEffect(() =>{}, []) to start on mount, and stop on unmount.


## Legacy State Access Patterns
The legacy system will return separate hooks for each collection when calliong `createStore()`

- `useModel("modelId")` for single model access
- `useCollection("storeId")` for collection access
- `useSelected()` for model access of the globally selected for a collection
- `useCom()` for command channel access
- `useController()` for controller access, allowing direct data manipulation

## Persistence/Sync
- Pluggable storage backends (synchronous only)
- Configurable sync strategies: `auto` (bidirectional), `get`/`set`/`manual`
- Optimized for batched async operations with change tracking
- Command channel via `useCom` for custom server operations

## Implementation
- Reactive hooks with optimized change detection
- Direct controller access for programmatic data manipulation
- Unified API replacing older pattern of separate hooks