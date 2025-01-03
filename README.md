# Mocovi State Management Library

The main goal of Mocovi is a simple to use data library that is build using React Hooks style programming. Using the store rsembles using setState(). The stores are global, every component using data will get redrawn when the data they use is changed.

The library handles automatic localstorage and remotestorage. To enable, the only setting is giving the collection the options remoteSync and/or localSync. If you give those variables a "true", the function is enabled, and the store's name is used. If you provide a string, that name is used for remote.

This library does not use a dispatcher, but instead a controller. This is taking the best from the old MVC world and the best from React and Hooks. React is the view. The store has the Model and the Controller. **All changes to data must go through the controller**. The controller provides functions like set(model), setCollection(model[]) and setField(modelId, fieldName, value).

You can extend the controller by giving it custom functions and give the ExtraController as option when you call createStore(). I started doing this, and that was the thought in the beginning, replicating that the controller contains all business logic. However, I have found another nice pattern: put the business logic in a hook, which also includes the models and/or collections. I made a Sudoku game using this pattern, where in the only data logic in the main component is "const sudoku = useSudoku()". I will try more experiments and the custom controller functionality might be removed.

To make a store, there are no classes involved. You only need a TypeScript type for the model, and thats it. I put the store creation in a separate file, and from that I export useModel, useCollection, useController and useSelected.

The concept of selected is that one model in the collection is set as the current selected model. In many applications, this makes sence. Different parts of the app work on the same model, and it is selected for example from a main screen. In other apps it does not make sense, and you can just ignore the select() and useSelected() in those cases.
