require('dotenv').config();
var Swagger = require('swagger-client');

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
          client.execute({operationId: 'me'}).then(function(response) {
            console.log('Success! ', response)
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
