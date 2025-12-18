import { Model, SyncAdapter, Message } from "../types";
import useLog from "../logger";

const { log, err, dbg } = useLog("RESTSyncAdapter");

export type RESTSyncAdapterOptions = {
    baseUrl: string;
    sessionId: string;
    headers?: Record<string, string>;
    onError?: (error: Error) => void;
    onUnauthorized?: () => void;
};

export function createRESTSyncAdapter(options: RESTSyncAdapterOptions): SyncAdapter {
    const { baseUrl, sessionId, headers = {}, onError, onUnauthorized } = options;

    // Ensure baseUrl doesn't end with slash
    const apiBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    async function fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionId}`,
            ...headers
        };

        try {
            const response = await fetch(url, {
                ...init,
                headers: {
                    ...defaultHeaders,
                    ...(init?.headers || {})
                }
            });

            if (response.status === 401 && onUnauthorized) {
                onUnauthorized();
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;
        } catch (error) {
            err('Fetch error:', error);
            if (onError) {
                onError(error as Error);
            }
            throw error;
        }
    }

    const adapter: SyncAdapter = {
        async connect(): Promise<void> {
            log('REST adapter initialized with base URL:', apiBase);
            // REST doesn't need persistent connection
            return Promise.resolve();
        },

        disconnect(): void {
            log('REST adapter disconnected');
            // Nothing to disconnect for REST
        },

        async fetchCollection(storeId: string): Promise<Model[]> {
            log('Fetching collection:', storeId);
            const url = `${apiBase}/${storeId}`;
            const response = await fetchWithAuth(url);
            const data = await response.json();

            // Support both array response and {data: array} format
            const models = Array.isArray(data) ? data : data.data || [];
            log('Fetched collection:', storeId, models.length);
            return models;
        },

        async fetchById(storeId: string, ids: string[]): Promise<Model[]> {
            log('Fetching models by ID:', storeId, ids);

            if (ids.length === 0) {
                return [];
            }

            // For single ID, use direct endpoint
            if (ids.length === 1) {
                const url = `${apiBase}/${storeId}/${ids[0]}`;
                const response = await fetchWithAuth(url);
                const model = await response.json();
                return [model];
            }

            // For multiple IDs, use query parameter
            const url = `${apiBase}/${storeId}?ids=${ids.join(',')}`;
            const response = await fetchWithAuth(url);
            const data = await response.json();
            const models = Array.isArray(data) ? data : data.data || [];
            log('Fetched models by ID:', storeId, models.length);
            return models;
        },

        async create(storeId: string, models: Model[]): Promise<void> {
            log('Creating models:', storeId, models.length);
            const url = `${apiBase}/${storeId}`;
            await fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify(models)
            });
            log('Created models:', storeId, models.length);
        },

        async update(storeId: string, models: Model[]): Promise<void> {
            log('Updating models:', storeId, models.length);

            // Use PUT for batch updates or PATCH for single
            if (models.length === 1) {
                const url = `${apiBase}/${storeId}/${models[0].id}`;
                await fetchWithAuth(url, {
                    method: 'PATCH',
                    body: JSON.stringify(models[0])
                });
            } else {
                const url = `${apiBase}/${storeId}`;
                await fetchWithAuth(url, {
                    method: 'PUT',
                    body: JSON.stringify(models)
                });
            }
            log('Updated models:', storeId, models.length);
        },

        async delete(storeId: string, ids: string[]): Promise<void> {
            log('Deleting models:', storeId, ids.length);

            // Delete each model individually
            const deletePromises = ids.map(id => {
                const url = `${apiBase}/${storeId}/${id}`;
                return fetchWithAuth(url, { method: 'DELETE' });
            });

            await Promise.all(deletePromises);
            log('Deleted models:', storeId, ids.length);
        }
    };

    return adapter;
}
