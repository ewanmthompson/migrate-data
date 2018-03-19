// migrate-data.js - merge data from two sources to a MongoDB database 
//   for edX - Introduction to NodeJS - Module 3 assignment
// 19 March 2018 - Ewan T.

const MongoClient = require('mongodb').MongoClient
const fs = require('fs')
const path = require('path')
const async = require('async')

const dbConnectionString = 'mongodb://localhost:27017/m3-et-customer'
const custDataFilePath = path.join(__dirname, 'data', 'm3-customer-data.json')
const addressDataFilePath = path.join(__dirname, 'data', 'm3-customer-address-data.json')
var docsInBatch = 10
var docsProcessed = 0
var customerDB
var customerCollection
var jsonCustData
var jsonAddressData
var startTime

var readJSONData = (filePath, callback) => {
  fs.readFile(filePath, {encoding: 'utf-8'}, function (error, data) {
    if (error) {
      console.error("Could not read file: ", filePath, ", error details: ", error)
      return process.exit(1)
    }
  callback(JSON.parse(data))
  })
}

const insertDocument = (customer, address, callback) => {
  customer.country = address.country
  customer.city = address.city
  customer.state = address.state
  customer.phone = address.phone
  //setTimeout(function() {callback(null, 'result');}, 200);
  customerCollection.insert(customer, (error, result) => {
    callback(error, result)
  })
}

function processBatch() {
  // When we have processed all customers, stop the recursion and close the DB client
  if (docsProcessed >= jsonCustData.length) {
    var milliseconds = process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000
    console.log("All records have been processed in", milliseconds, "milliseconds" )
    customerDB.close()
    return
  }
  // Build a batch of inserts to process in parallel
  let batch = []
  for (i = 0; i < docsInBatch; i++) {
    let customerIndex = docsProcessed + i
    if (customerIndex >= jsonCustData.length) break  // handle case where customer count not multiple of docInBatch
    batch[i] = function(callback) {insertDocument(jsonCustData[customerIndex], jsonAddressData[customerIndex], callback)}
  }
  async.parallel(batch, function(error, results) {
    if (error) {
      console.error("Error in async.parallel: ", error)
      return process.exit(1)
    }
    docsProcessed += results.length
    console.log("Processed batch, documents processed = ", docsProcessed)
    // Recursively process the next batch
    processBatch()
    })
}

// Get the batch size from the command line
if (process.argv.length > 2) {
  if (!isNaN(process.argv[2])) {
    docsInBatch = Number(process.argv[2])
  }
}

// Read the customer data and the address data into json collections
readJSONData(custDataFilePath, (jsonData) => {
  jsonCustData = jsonData
  readJSONData(addressDataFilePath, (jsonData) => {
    jsonAddressData = jsonData
    // Sanity check collection sizes
    if (jsonCustData.length != jsonAddressData.length) {
      console.error("Document count mismatch")
      return process.exit(1)
    }
    // Connect to the DB server
    MongoClient.connect(dbConnectionString, (error, db) => {
      if (error) {
        console.error("Could not connect to DB ", dbConnectionString, ", error details: ", error)
        return process.exit(1)
      }
      customerDB = db
      // Drop the collection left over from the last run
      db.collection("m3-et-customer-data").drop(function(err, delOK) {
        if (delOK) console.log("Customer collection deleted");
      });      
      customerCollection = db.collection('m3-et-customer-data')
      startTime = process.hrtime()
      // Process first document batch, processBatch calls itself recursively to process all documents
      processBatch()
    })
  })
})

