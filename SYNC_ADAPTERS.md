# Sync Adapters

Mocovi now supports pluggable sync adapters, allowing you to choose between different synchronization strategies (WebSocket, REST, or custom implementations).

## Overview

Sync adapters provide a consistent interface for synchronizing data between your application and a backend server. Similar to the `Persist` pattern for storage, you can now choose or create custom sync adapters.

## Available Adapters

### 1. REST Sync Adapter

The REST adapter uses standard HTTP methods with `fetch()` for synchronization.

#### REST API Endpoints

- `GET /api/{storeId}` - Fetch entire collection
- `GET /api/{storeId}/{modelId}` - Fetch single model by ID
- `GET /api/{storeId}?ids=id1,id2,id3` - Fetch multiple models by ID
- `POST /api/{storeId}` - Create new models
- `PUT /api/{storeId}` - Update multiple models (batch)
- `PATCH /api/{storeId}/{modelId}` - Update single model
- `DELETE /api/{storeId}/{modelId}` - Delete model

#### Usage Example

```typescript
import {
  MocoviProvider,
  createRESTSyncAdapter,
  RESTSyncAdapterOptions
} from 'mocovi';

// Create the REST adapter
const restAdapter = createRESTSyncAdapter({
  baseUrl: 'https://api.example.com/api',
  sessionId: 'your-session-token',
  headers: {
    'X-Custom-Header': 'value'
  },
  onError: (error) => {
    console.error('Sync error:', error);
  },
  onUnauthorized: () => {
    console.log('User not authorized, redirecting to login...');
    // Handle 401 errors
  }
});

// Initialize the adapter
await restAdapter.connect();

// Create a store with the REST adapter
const storeDescriptors = [{
  id: 'tasks',
  initialData: [],
  options: {
    sync: 'auto', // Enable automatic sync
    syncAdapter: restAdapter,
    persist: myPersistAdapter // Optional local persistence
  }
}];

function App() {
  return (
    <MocoviProvider storeDescriptors={storeDescriptors}>
      <YourApp />
    </MocoviProvider>
  );
}
```

### 2. WebSocket Sync Adapter

The WebSocket adapter provides real-time bidirectional communication with the server.

#### Usage Example

```typescript
import {
  MocoviProvider,
  createWebSocketSyncAdapter,
  WebSocketSyncAdapterOptions
} from 'mocovi';

// Create the WebSocket adapter
const wsAdapter = createWebSocketSyncAdapter({
  endpoint: 'wss://api.example.com/ws',
  sessionId: 'your-session-token',
  pingInterval: 10000, // Ping every 10 seconds
  onError: (error) => {
    console.error('WebSocket error:', error);
  },
  onUnauthorized: () => {
    console.log('User not authorized');
  },
  onReconnect: () => {
    console.log('Attempting to reconnect...');
    // Handle reconnection logic
  }
});

// Initialize the adapter
await wsAdapter.connect();

// Create a store with the WebSocket adapter
const storeDescriptors = [{
  id: 'messages',
  initialData: [],
  options: {
    sync: 'auto',
    syncAdapter: wsAdapter,
    persist: myPersistAdapter
  }
}];

function App() {
  return (
    <MocoviProvider storeDescriptors={storeDescriptors}>
      <YourApp />
    </MocoviProvider>
  );
}
```

## Sync Modes

Regardless of the adapter, you can set different sync modes:

- `"auto"` - Full bidirectional sync (fetch from server, send changes to server)
- `"get"` - Only fetch from server (read-only)
- `"set"` - Only send changes to server (write-only)
- `"manual"` - No automatic sync, use controller methods manually
- `false` - Sync disabled

```typescript
options: {
  sync: 'auto', // Choose your mode
  syncAdapter: myAdapter
}
```

## Controller Methods

### Fetching Data

```typescript
const { controller } = useController('tasks');

// Fetch entire collection
controller.fetch();

// Fetch specific model(s) by ID (new!)
controller.fetchById('model-123');
controller.fetchById(['model-1', 'model-2', 'model-3']);
```

### Manual Operations

Even with `sync: 'manual'`, you can use the adapter directly:

```typescript
const adapter = myStore.syncAdapter;

// Fetch collection
const models = await adapter.fetchCollection('tasks');

// Fetch by ID
const models = await adapter.fetchById('tasks', ['id1', 'id2']);

// Create/Update
await adapter.update('tasks', [model1, model2]);

// Delete
await adapter.delete('tasks', ['id1', 'id2']);
```

## Offline Sync & Conflict Resolution

Mocovi automatically handles offline scenarios:

1. **Local changes are preserved**: Models with `changed_at` set are never overwritten by incoming data
2. **Automatic sync on reconnect**: When coming back online, local changes are sent to the server
3. **Smart merging**: Only unchanged models are updated from the server

### How it works

```typescript
// User makes changes offline
model.name = "Updated offline";
controller.set(model, true); // changed_at is set automatically

// Later, when online, controller.fetch() is called
// The server returns updated data, but models with changed_at are preserved locally

// After successful sync, changed_at is cleared
```

## Custom Commands (WebSocket only)

The WebSocket adapter supports custom commands:

```typescript
const { useCom } = useStore('messages');
const { send } = useCom((message) => {
  console.log('Received:', message);
});

// Send custom command
send('typing', { userId: '123', isTyping: true });
```

## Creating a Custom Adapter

You can create your own sync adapter by implementing the `SyncAdapter` interface:

```typescript
import { SyncAdapter, Model } from 'mocovi';

function createMyCustomAdapter(options: any): SyncAdapter {
  return {
    async connect(): Promise<void> {
      // Initialize connection
    },

    disconnect(): void {
      // Clean up connection
    },

    async fetchCollection(storeId: string): Promise<Model[]> {
      // Fetch all models for this store
      return [];
    },

    async fetchById(storeId: string, ids: string[]): Promise<Model[]> {
      // Fetch specific models
      return [];
    },

    async create(storeId: string, models: Model[]): Promise<void> {
      // Create new models
    },

    async update(storeId: string, models: Model[]): Promise<void> {
      // Update existing models
    },

    async delete(storeId: string, ids: string[]): Promise<void> {
      // Delete models
    },

    // Optional: for pub/sub functionality
    subscribe(storeId: string, callback: (msg: Message) => void): void {
      // Subscribe to updates
    },

    unsubscribe(storeId: string, callback: (msg: Message) => void): void {
      // Unsubscribe from updates
    },

    // Optional: for custom commands
    sendCommand(storeId: string, cmd: string, payload?: any): void {
      // Send custom command
    }
  };
}
```

## Migration from Legacy Sync

If you're using the old WebSocket-based `useSync` hook, you can migrate to the new adapter pattern:

### Before (Legacy)

```typescript
import { useSync } from 'mocovi';

function MyLayout() {
  useSync(sessionId, 'wss://api.example.com/ws');
  return <>{children}</>;
}
```

### After (New Adapter Pattern)

```typescript
import { createWebSocketSyncAdapter } from 'mocovi';

const wsAdapter = createWebSocketSyncAdapter({
  endpoint: 'wss://api.example.com/ws',
  sessionId: sessionId
});

await wsAdapter.connect();

// Pass adapter to store options
const storeDescriptors = [{
  id: 'myStore',
  initialData: [],
  options: {
    sync: 'auto',
    syncAdapter: wsAdapter
  }
}];
```

The legacy `useSync` hook still works but is recommended to migrate to the new adapter pattern for better flexibility and control.

## Best Practices

1. **Initialize adapters early**: Create and connect adapters before rendering your app
2. **Handle errors gracefully**: Always provide `onError` callbacks
3. **Use appropriate sync modes**: Choose `'auto'` for real-time apps, `'manual'` for batch operations
4. **Combine with persistence**: Use both `syncAdapter` and `persist` for robust offline support
5. **Clean up on unmount**: Call `adapter.disconnect()` when your app unmounts

## Example: Complete Setup

```typescript
import {
  MocoviProvider,
  createRESTSyncAdapter,
  createWebSocketSyncAdapter
} from 'mocovi';
import { localStorage } from './myPersistAdapter';

// Choose adapter based on environment
const syncAdapter = process.env.USE_WEBSOCKET
  ? createWebSocketSyncAdapter({
      endpoint: 'wss://api.example.com/ws',
      sessionId: session.token
    })
  : createRESTSyncAdapter({
      baseUrl: 'https://api.example.com/api',
      sessionId: session.token
    });

await syncAdapter.connect();

const stores = [
  {
    id: 'tasks',
    initialData: [],
    options: {
      sync: 'auto',
      syncAdapter,
      persist: localStorage
    }
  },
  {
    id: 'users',
    initialData: [],
    options: {
      sync: 'get', // Read-only
      syncAdapter,
      persist: localStorage
    }
  }
];

function App() {
  useEffect(() => {
    return () => {
      syncAdapter.disconnect();
    };
  }, []);

  return (
    <MocoviProvider storeDescriptors={stores}>
      <YourApp />
    </MocoviProvider>
  );
}
```
