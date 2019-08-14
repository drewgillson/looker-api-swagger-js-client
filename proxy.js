require('dotenv').config();
var Swagger = require('swagger-client');
var hash = require('object-hash');
var faunadb = require('faunadb'),
  q = faunadb.query;

let host = "https://raw.githubusercontent.com/drewgillson/looker-api-swagger-js-client/master/swagger.json"

Swagger(host)
  .then( client => {
    client.execute({operationId: 'login',
                    parameters: {client_id: process.env.CLIENT_ID,
                                 client_secret: process.env.CLIENT_SECRET}}).then(function(response) {

      if (response.status === 200) {
        access_token = response.body.access_token
        
        Swagger({url: host,
          authorizations: {
            Bearer: "token " + access_token
          }
        })
        .then( client => {
          client.execute({operationId: 'run_look',
                          parameters: {look_id: 1,
                                       result_format: 'json'}}).then(function(response) {

            var client = new faunadb.Client({
              secret: process.env.FAUNA_KEY
            });
            
            // Calculate a unique hash for this Looker API response
            key = hash(response)
            response.key = key

            // run_look_by_key is the name of a FaunaDB index that stores responses from the Looker API. The index key is the hash of the response.
            client.query(q.Paginate(q.Match(q.Index("run_look_by_key"), key)))
              .then((ret) => { 

                // Search for an augmented response for this request in the FaunaDB index
                const retrieveDocForRef = ret.data.map((ref) => {
                  return q.Get(ref)
                })
                return client.query(retrieveDocForRef).then((faunaDoc) => {
                  if (faunaDoc.length) {
                    // If we have an augmented response in FaunaDB, show it to the user instead of showing the most recent Looker API response
                    // (This is a simple comparison, in a real use case we would need to compare timestamps to make sure the Looker response isn't newer)
                    console.log("Cached result returned from FaunaDB", faunaDoc)
                  }
                  else {
                    // There isn't an augmented response, so trust the response from Looker
                    console.log('Result returned from Looker API', response)

                    // Pretend that the user now places an order for bananas in our application.
                    // Now the quantity_on_order for the 'bananas' row in our response is 10, even though Looker will still report 0
                    response.body[1]["product.quantity_on_order"] = 10

                    // Persist the augmented response with the correct quantity_on_order value of 10 to FaunaDB
                    var createP = client.query(q.Create(q.Collection('run_look'), { data: response }));
                  }
                })
              })
          })
          .catch(function(error) {
            console.log(error)
          })
        })
      }
    })
    .catch(function(error) {
      console.log(error)  
    })
  })
