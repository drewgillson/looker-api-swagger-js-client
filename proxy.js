require('dotenv').config();
var Swagger = require('swagger-client');
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
            console.log('Success! ', response)

            var client = new faunadb.Client({
              secret: process.env.FAUNA_KEY
            });
            
            var createP = client.query(q.Create(q.Collection('run_look'), { data: response }));

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
