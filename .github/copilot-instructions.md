
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
- Collection access: `useStore<T>("storeId")` → `{collection, setCollection}`
- Model access: `useStore<T>("storeId", "modelId")` → `{model, setModel}`
- Field-selective updates: `useStore<T>("storeId", "modelId", ["field1", "field2"])` → re-renders only on specified field changes

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