# Mocovi State Management Library



This library manages state data in React Native. It is built up of collections of data. Each collection has a name, for example "users". Each collection has several models. When you use a collection or model in your components, they will be rendered if data in the collection or model changes. Each collection has a currently selected global model. This makes it possible to use selected model, and get the same in all components without passing the id. But be sure that this is only used in an app where there can't be any doubt of who selects the model. In the future this functionality will be removed because it has shown to be problematic for reuse of components. So I reccommend using useCollection() or useModel("id"). You can also use contoller for a collection. This has direct access to functionality like "set(model: Model)" or "get(id: string): Model". When you use controller, your component will not get rendered on change. But the data you modify will make other components using the data you update being rendered. You can subscribe to changes via the controller. Primarelly useModel() and useCollection() in your code. They return set() functions to set back changed data.

The library supports local storage both on web and native. You have to give it a handler for set and get using your preffered storage lib. Async storage is not supported for now.

Syncronisation to back end server is also supported, with different strategies. Only get can be used for data not changed by the user. Full sync for data changed by the user that needs to be stored. You can also use manual sync where you ask to fetch or push data.

Sync and storage is running async so that fast changed doesn't result in many calls. When the sync or storage functionality is called, it will get all changes since last call. TODO: now the internal sotrage will reset history when called. So storage and sync needs to be run at the same time. Support either multiple callers identifying them selves, or by just keeping the history and give a ponter back so the caller can ask later to get entries beyond this number. Storing the whole history also makes undo/redo almost for free.

The system used to support undo and redo, but this system is broken after other updated and will be fixed later when the TODO in the previous paragraph is fixed.


You have to initiate every collection by running a createCollection(). This is not done in the render thread, but should be done in the component load phase. Create collection will return the useXXX hooks. My tip is to make one file for each collection which creates this on load, and exports the functions. A component can then just import the hooks it needs.

Future:

- Move the data storage to a context. This way the code can instead of including things to load, it can wrap in a <Mocovi> component, having parameters for initializing the different collections. This plays better with React. The hooks will then be generic, and the collection name must be given, like "useModel("users", "id123")".
- Go away from useModel and useCollection and instead have one function like this:
  - useStore<User>("users") : returns a {users: User[]} - renders on any change in the collection
  - useStore<User>("users", "id123") returns a {model: User} - renders on any change in the model
  - useStore<User>("users, "id123", ["name", "address"]): returns {model: User} - renders only on change in the fields name or address

