
keyvaultUrl = "https://prod-00.japaneast.logic.azure.com:443/workflows/d3923656a7e543f384373b0e3af0ff1a/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4SSBVb8pL8RKl3ZnR7rqg3vtQMly_uhex_6YKEUeU04"
console.log(keyvaultUrl);
    var request = require('request');
    var options = {
    "uri": keyvaultUrl,
    "headers": {
    "Content-type": "application/json",
    },
    "body": 
    JSON.stringify({
    "did": "test",
    "pk": "testkey" 
    })
    };
    request.post(options, function(error, response, body){
    resolve(did);
    });
