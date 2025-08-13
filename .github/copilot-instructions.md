
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
- If needed, add a subscribe/unsubscribe from the Controller, and look at the data you get in the callback. If data that should trigger a render has changed use a local state setter.

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

## Legacy Hooks (Was deprecated, now removed )
- `useModel("modelId")`, `useCollection()`, `useSelected()`, `useController()` from legacy stores
- Legacy `useController()` returns the merged controller directly, new `useController("storeId")` returns `{controller, useCom}`
- All calls to the old has to be changed to the new  `useStore` or the new `useController`

## Refactor from legacy to new
- Replace `use[Type]Model("modelId")` with `useStore<Type>("storeId", "modelId")`
- Replace `use[Type]Collection()` with `useStore<Type>("storeId")`
- Replace `use[Type]Controller()` with `useController<Type>("storeId")`. Note that useStore() returns a controller, so you can use it directly in the component, so no need to use useController() if useStore is alterad in use for that store.
- Replace `use[Type]Selected()` with `useStore<Type>("storeId", "modelId") : Important: useSelected() has no equivalent in the new system. There is no single state for the currently selected model. When I made it, I knew there might be issues with the global state, and yes, they apperaed more often than I thought. So to make solid, testable, beautiful code, it had to go. Now the state of the current model has to be stored in the components. Common patterns: getting it from the Expo Router parametrized URL: /admin/tempate/[id].tsx : gives the id of the template edited. Then give it as props to the children. This is more typing, but it is very important to get right. Another way: get it from session like thus: const s = useSession(); const id = s.userId. This is done in a session context for a few cases where it is neccessary. The recommended pattern is that the outermost component fetches it and passes it down the chain to children as pros. This way, components don't need this implementation specific thing and component resuse or later refactoring will be easy. So how do you refactor "const [sign] = useSignSelected()" ? like this:

```
const userId = // Get the user id from somewhere. From URL, from session, or locally stored in a useState<string>(null); 
```
 Some times this refactoring is obvious. Other times, you have to ask the user how to best perform the refactoring.

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
