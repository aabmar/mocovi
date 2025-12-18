/**
 * Example: Using WebSocket Sync Adapter with Mocovi
 *
 * This example demonstrates how to set up and use the WebSocket sync adapter
 * for real-time data synchronization with a backend server.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {
    MocoviProvider,
    createWebSocketSyncAdapter,
    useStore,
    Model
} from 'mocovi';

// Define your data model
interface Message extends Model {
    id: string;
    text: string;
    userId: string;
    userName: string;
    roomId: string;
    created_at?: number;
}

// Create the WebSocket sync adapter
const wsAdapter = createWebSocketSyncAdapter({
    endpoint: 'wss://api.example.com/ws',
    sessionId: 'your-session-token', // Get this from your auth system
    pingInterval: 10000, // Ping every 10 seconds to keep connection alive
    onError: (error) => {
        console.error('WebSocket error:', error);
    },
    onUnauthorized: () => {
        console.log('Session expired, redirecting to login...');
        window.location.href = '/login';
    },
    onReconnect: () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        // Optionally show a "reconnecting" indicator to the user
    }
});

// Store descriptors
const storeDescriptors = [
    {
        id: 'messages',
        initialData: [],
        options: {
            sync: 'auto' as const, // Real-time bidirectional sync
            syncAdapter: wsAdapter,
            persist: {
                get: (key: string) => localStorage.getItem(key) || undefined,
                set: (key: string, value: string) => localStorage.setItem(key, value)
            }
        }
    }
];

// Initialize the adapter
async function initializeApp() {
    try {
        await wsAdapter.connect();
        console.log('WebSocket connected');
    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        // Optionally retry connection
    }
}

// App component
function App() {
    return (
        <MocoviProvider storeDescriptors={storeDescriptors}>
            <ChatRoom roomId="general" />
        </MocoviProvider>
    );
}

// Chat room component
function ChatRoom({ roomId }: { roomId: string }) {
    const [inputText, setInputText] = React.useState('');

    // Filter messages by room
    const { collection: messages, controller } = useStore<Message>('messages', {
        roomId
    });

    // Use useCom for custom commands
    const { useCom } = useStore<Message>('messages');
    const { send } = useCom((message) => {
        console.log('Received message from server:', message);

        // Handle custom server messages
        if (message.cmd === 'userTyping') {
            console.log('User is typing:', message.payload);
        }
    });

    // Fetch messages on mount
    React.useEffect(() => {
        controller.fetch();
    }, []);

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            userId: 'current-user-id',
            userName: 'Current User',
            roomId,
            created_at: Date.now()
        };

        controller.set(newMessage, true); // Auto-synced via WebSocket
        setInputText('');
    };

    const handleTyping = () => {
        // Send custom command to notify others
        send('userTyping', {
            roomId,
            userId: 'current-user-id',
            userName: 'Current User'
        });
    };

    const deleteMessage = (messageId: string) => {
        controller.delete(messageId); // Auto-synced via WebSocket
    };

    return (
        <div>
            <h1>Chat Room: {roomId}</h1>

            <div className="messages">
                {messages.map(msg => (
                    <div key={msg.id} className="message">
                        <strong>{msg.userName}:</strong> {msg.text}
                        <button onClick={() => deleteMessage(msg.id)}>Delete</button>
                    </div>
                ))}
            </div>

            <div className="input-area">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        handleTyping();
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') sendMessage();
                    }}
                    placeholder="Type a message..."
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
}

// Start the app
initializeApp().then(() => {
    const root = document.getElementById('root');
    if (root) {
        ReactDOM.render(<App />, root);
    }
});

// Cleanup on app unmount
window.addEventListener('beforeunload', () => {
    wsAdapter.disconnect();
});

export default App;
