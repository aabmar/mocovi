/**
 * Example: Using REST Sync Adapter with Mocovi
 *
 * This example demonstrates how to set up and use the REST sync adapter
 * for synchronizing data with a backend API.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {
    MocoviProvider,
    createRESTSyncAdapter,
    useStore,
    Model
} from 'mocovi';

// Define your data model
interface Task extends Model {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    assignedTo: string;
    created_at?: number;
    updated_at?: number;
}

// Create the REST sync adapter
const restAdapter = createRESTSyncAdapter({
    baseUrl: 'https://api.example.com/api',
    sessionId: 'your-session-token', // Get this from your auth system
    headers: {
        'X-Custom-Header': 'custom-value'
    },
    onError: (error) => {
        console.error('REST sync error:', error);
        // Handle errors (show notification, retry, etc.)
    },
    onUnauthorized: () => {
        console.log('Session expired, redirecting to login...');
        // Redirect to login page
        window.location.href = '/login';
    }
});

// Store descriptors - define your stores here
const storeDescriptors = [
    {
        id: 'tasks',
        initialData: [],
        options: {
            sync: 'auto' as const, // Bidirectional sync
            syncAdapter: restAdapter,
            persist: {
                get: (key: string) => localStorage.getItem(key) || undefined,
                set: (key: string, value: string) => localStorage.setItem(key, value)
            }
        }
    }
];

// Initialize the adapter before rendering
async function initializeApp() {
    try {
        await restAdapter.connect();
        console.log('REST adapter connected');
    } catch (error) {
        console.error('Failed to initialize REST adapter:', error);
    }
}

// App component with MocoviProvider
function App() {
    return (
        <MocoviProvider storeDescriptors={storeDescriptors}>
            <TaskManager />
        </MocoviProvider>
    );
}

// Component using the store
function TaskManager() {
    const { collection, controller } = useStore<Task>('tasks');

    // Fetch all tasks on mount
    React.useEffect(() => {
        controller.fetch();
    }, []);

    const addTask = () => {
        const newTask: Task = {
            id: Date.now().toString(),
            title: 'New Task',
            description: 'Task description',
            completed: false,
            assignedTo: 'user@example.com'
        };

        controller.set(newTask, true); // Will auto-sync to server
    };

    const updateTask = (task: Task) => {
        controller.set({ ...task, completed: !task.completed }, true);
    };

    const deleteTask = (taskId: string) => {
        controller.delete(taskId); // Will auto-sync to server
    };

    const refreshTasks = () => {
        controller.fetch(); // Manually refresh from server
    };

    const fetchSpecificTask = (taskId: string) => {
        controller.fetchById(taskId); // Fetch single task by ID
    };

    return (
        <div>
            <h1>Tasks ({collection.length})</h1>
            <button onClick={addTask}>Add Task</button>
            <button onClick={refreshTasks}>Refresh</button>

            <ul>
                {collection.map(task => (
                    <li key={task.id}>
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => updateTask(task)}
                        />
                        <span>{task.title}</span>
                        <button onClick={() => deleteTask(task.id)}>Delete</button>
                        <button onClick={() => fetchSpecificTask(task.id)}>Refresh This</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Start the app
initializeApp().then(() => {
    // Render your app after adapter is ready
    const root = document.getElementById('root');
    if (root) {
        ReactDOM.render(<App />, root);
    }
});

// Cleanup on app unmount
window.addEventListener('beforeunload', () => {
    restAdapter.disconnect();
});

export default App;
