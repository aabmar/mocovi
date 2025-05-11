# Mocovi State Management Library




Restructure
===========

- Remove data type throughout
- useStore(<collection name>, [id], [field, field...]) only entry for use
- setState() from collection change if only "collection name" given.
- setState() only to model change if "id" is given
- setState() only to field change if fields given
- useStore() will get store from StoreContext.


