
# Mocovi: Technical Summary

## Architecture
- React state management focused on collections of typed models (`Model` interface with required `id`)
- Core abstractions: `Store<T>`, `BaseController<T>`, `EventHandler<T>`
- Pub/sub event system with optimized re-rendering

## Data Flow
- `createCollection<T>()` bootstraps a store with controllers and hooks
- Components consume state via hooks, triggering selective re-renders
- Write operations flow through controllers, propagating changes via event handler

## Primary State Access Pattern (Recommended)
- `useStore<T>("storeId")` → `{collection, setCollection, setModel, controller, model, useCom}` - full collection access
- `useStore<T>("storeId", "modelId")` → filtered to one model (collection[0] or null)
- `useStore<T>("storeId", {key: value, ...})` → filtered by multiple criteria (supports RegExp values)
- `useStore<T>("storeId", filterObj?, "sortKey")` → filtered and sorted collection

The `model` property is always `collection[0] || null` for convenience, if using filter where the result should be only one model. `useCom()` enables server communication.

## Non-Reactive Access Pattern
- `useController<T>("storeId")` → `{controller, useCom}` - direct controller access without re-rendering
- Use when you need data access/manipulation but don't want component re-renders
- Perfect for event handlers, background operations, or manual data fetching

### BaseController methods:

- `get(id)` - retrieve single model by ID, returns model or null
- `getCollection()` - get all models as array
- `set(model, select?, markChanged?)` - insert/update model, optionally select it
- `setCollection(models, source?)` - replace entire collection
- `setField(id, field, value, markChanged?)` - update single field on model
- `select(id | null | true)` - set selected model (null=deselect, true=select newest)
- `getSelected()` - get currently selected model or null
- `delete(id)` - remove model from collection
- `clear()` - remove all models and persist changes
- `size()` - get count of models in collection
- `getFirst/getLast/getNewest/getOldest()` - get specific models
- `has(id)` - check if model exists
- `fetch(id?)` - trigger sync to fetch data from server
- `subscribe/unsubscribe(callback)` - manage event subscriptions

## Legacy Hooks (Deprecated)
- `useModel("modelId")`, `useCollection()`, `useSelected()`, `useController()` from legacy stores
- Legacy `useController()` returns the merged controller directly, new `useController("storeId")` returns `{controller, useCom}`
- All marked deprecated - migrate to `useStore` or the new `useController`

## Refactor from legacy to new
- Replace `useTypeModel("modelId")` with `useStore<Type>("storeId", "modelId")`
- Replace `useTypeCollection()` with `useStore<Type>("storeId")`
- Replace `useTypeController()` with `useController<Type>("storeId")`. Note that useStore() returns a controller, so you can use it directly in the component, so no need to use useController() if useStore is alterad in use for that store.
- Replace `useTypeSelected()` with `useStore<Type>("storeId", "modelId") : Note that state remembering a single global selected item is no longer supported. So when replacing useSelected() you will need to get the ID from somewhere. Store it in a local state, add it as a prop to the component, etc. Common pattern: use the parameters from Expo Router on the main page, passing the current id as a prop to the components. On a deep component tree, a Context can be used to pass the selected ID down. Never automatically just replace a useSelected() to a useStore() without a model id. It will return the complete collection.

## Persistence/Sync
- Pluggable storage backends (synchronous only)
- Configurable sync strategies: `auto` (bidirectional), `get`/`set`/`manual`
- Optimized for batched async operations with change tracking
- Command channel via `useCom` for custom server operations

## Implementation Notes
- Reactive hooks with optimized change detection via `isDifferent()` utility
- Event subscriptions use `useCallback` with proper dependencies to prevent memory leaks
- Direct controller access for programmatic data manipulation
- Unified API replacing older pattern of separate hooks