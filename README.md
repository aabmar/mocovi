# Mocovi State Management Library

Mocovi is a React state management library designed for managing collections of typed data models. It provides reactive hooks with optimized re-rendering, flexible filtering and sorting capabilities, and built-in support for persistence and synchronization.

## Key Features

- **Type-safe collections** of models with required `id` field
- **Reactive hooks** with optimized change detection and selective re-rendering  
- **Flexible data access** with filtering, sorting, and regex support
- **Non-reactive access** for background operations without triggering re-renders
- **Pluggable persistence** with synchronous storage backends
- **Configurable synchronization** with backend servers
- **Global selection state** for shared model selection across components

## Quick Start

```typescript
import { createCollection, useStore } from 'mocovi';

// Define your model type
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Create a collection (do this once, typically in a separate file)
createCollection<User>("users", [
  { id: "1", name: "John Doe", email: "john@example.com", role: "admin" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "user" }
]);

// Use the collection in your components
function UserList() {
  const { collection, setModel } = useStore<User>("users");
  
  return (
    <div>
      {collection.map(user => (
        <div key={user.id}>{user.name} - {user.email}</div>
      ))}
    </div>
  );
}
```

## Core Concepts

### Model
All data in Mocovi must implement the `Model` interface with a required `id` field:

```typescript
interface Model {
  id: string;
  created_at?: number;
  updated_at?: number; 
  synced_at?: number;
  deleted_at?: number;
  changed_at?: number;
}
```

### Store
A `Store<Data>` manages a collection of models, providing access to controllers, hooks, and configuration for persistence and synchronization.

### BaseController
The `BaseController<Data>` provides core methods for data manipulation:
- `get(id)` - retrieve a model by ID
- `getCollection()` - get all models as array
- `set(model)` - update or insert a model
- `setCollection(models)` - replace entire collection
- `setField(id, field, value)` - update specific field
- `select(id)` - set globally selected model
- `getSelected()` - get currently selected model

## Primary Hook: useStore

The `useStore` hook is the recommended way to access and manipulate state data. It provides a unified interface that replaces the legacy hooks.

### Collection Access
```typescript
const { collection, setCollection, setModel, controller } = useStore<User>("users");
```
Returns the entire collection and functions to update it. Component re-renders when any model changes.

### Filtered Access by ID
```typescript
const { collection, model, setModel } = useStore<User>("users", "user123");
```
Returns array with 0-1 models matching the ID. `model` is `collection[0] || null` for convenience.

### Filtered Access by Criteria
```typescript
// Filter by multiple fields
const { collection } = useStore<User>("users", { 
  role: "admin", 
  active: true 
});

// Filter with regex
const { collection } = useStore<User>("users", { 
  name: /^John/ 
});
```
Returns models matching all specified criteria.

### Sorted Collections
```typescript
// Sort by field
const { collection } = useStore<User>("users", undefined, "name");

// Filter and sort
const { collection } = useStore<User>("users", { role: "admin" }, "name");
```
Returns filtered and sorted collection.

### Server Communication
```typescript
const { useCom } = useStore<User>("users");
const com = useCom();

// Send custom commands
com.send("customCommand", { data: "example" });
```

## Non-Reactive Access: useController

Use `useController` when you need data access without triggering component re-renders:

```typescript
import { useController } from 'mocovi';

function BackgroundSync() {
  const { controller, useCom } = useController<User>("users");
  
  useEffect(() => {
    const handleChange = (data: User[]) => {
      console.log('Data changed but component won\'t re-render');
    };
    
    controller.subscribe(handleChange);
    return () => controller.unsubscribe(handleChange);
  }, []);
  
  const syncData = () => {
    // Direct data manipulation without re-renders
    controller.set({ id: "new", name: "New User", email: "new@example.com", role: "user" });
  };
  
  return <button onClick={syncData}>Sync Data</button>;
}
```

## Collection Creation and Configuration

### Basic Creation
```typescript
import { createCollection } from 'mocovi';

createCollection<User>("users", initialData);
```

### With Persistence
```typescript
createCollection<User>("users", initialData, {
  persist: {
    get: (key) => localStorage.getItem(key),
    set: (key, value) => localStorage.setItem(key, value)
  }
});
```

### With Synchronization
```typescript
createCollection<User>("users", initialData, {
  sync: "auto", // "auto" | "get" | "set" | "manual" | false
  autoSelect: true // Automatically select first model
});
```

### With Custom Controller
```typescript
interface UserController {
  promoteToAdmin: (userId: string) => void;
}

createCollection<User, UserController>("users", initialData, {
  createController: (baseController) => ({
    promoteToAdmin: (userId: string) => {
      const user = baseController.get(userId);
      if (user) {
        baseController.set({ ...user, role: "admin" });
      }
    }
  })
});
```

## Legacy Hooks (Deprecated)

The following hooks are maintained for backward compatibility but should be migrated to `useStore`:

- `useCollection()` → `useStore("storeId")`  
- `useModel("modelId")` → `useStore("storeId", "modelId")`
- `useSelected()` → custom filtering with `useStore`
- Legacy `useController()` → `useStore` for most cases, or new `useController("storeId")` for non-reactive access

## Persistence and Synchronization

### Persistence
Mocovi supports pluggable synchronous storage:

```typescript
const persist = {
  get: (key: string) => localStorage.getItem(key) || undefined,
  set: (key: string, value: string) => localStorage.setItem(key, value)
};
```

### Synchronization Modes
- `"auto"` - Full bidirectional sync (send and receive changes)
- `"get"` - Only receive changes from server
- `"set"` - Only send changes to server  
- `"manual"` - Use `controller.fetch()` and manual sync
- `false` - No synchronization

### Server Communication
```typescript
const { useCom } = useStore<User>("users");
const com = useCom((message) => {
  console.log('Received message:', message);
});

// Send commands
com.send("fetchUsers");
com.send("updateUser", { id: "123", name: "Updated Name" });
```

## Debugging Components

Mocovi provides debugging components for development:

```typescript
import { StoreInspector } from 'mocovi';

// Display all stores and their data
<StoreInspector />
```

## Utility Functions

```typescript
import { clearAll, printDiff } from 'mocovi';

// Clear all stores (useful for logout)
clearAll();

// Debug object differences
printDiff("user", oldUser, newUser, changes);
```

## Migration Guide

### From Legacy Hooks

```typescript
// OLD: Legacy hooks
const [collection, setCollection] = useCollection();
const [model, setModel] = useModel("user123");
const [selected, setSelected] = useSelected();

// NEW: Unified useStore
const { collection, setCollection } = useStore<User>("users");
const { model, setModel } = useStore<User>("users", "user123"); 
// For selected, implement custom selection logic with filtering
```

### From Direct Controller Access

```typescript
// OLD: Direct controller with re-renders
const controller = useController();

// NEW: Non-reactive controller access
const { controller } = useController<User>("users");
```

## Best Practices

1. **Use `useStore` for UI components** that need to re-render on data changes
2. **Use `useController` for background operations** like data syncing, logging, or side effects
3. **Create collections once** during app initialization, not in render functions
4. **Use TypeScript** for better type safety and developer experience
5. **Leverage filtering and sorting** to minimize component re-renders
6. **Implement proper cleanup** when using controller subscriptions in `useEffect`

## Performance Considerations

- Components only re-render when filtered data actually changes
- Use specific filters to minimize unnecessary re-renders
- Consider `useController` for operations that don't need UI updates
- Batched updates prevent excessive re-rendering during bulk operations

## Future Roadmap

- Support for async storage backends
- Enhanced undo/redo functionality
- Context-based store management with `<Mocovi>` provider
- Improved synchronization conflict resolution
- Performance optimizations for large datasets

