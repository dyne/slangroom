/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ffzsqtnsh1w2ayd")

  collection.listRule = "owners.id = @request.auth.id"
  collection.viewRule = "owners.id = @request.auth.id"
  collection.updateRule = "owners.id = @request.auth.id"
  collection.deleteRule = "owners.id = @request.auth.id"

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ffzsqtnsh1w2ayd")

  collection.listRule = ""
  collection.viewRule = ""
  collection.updateRule = ""
  collection.deleteRule = ""

  return dao.saveCollection(collection)
})
