module.exports = async function (context, req) {
 
    var did = await createCEKeyPair().then(function(cekeypair) {
    
    var ceobj = JSON.parse(cekeypair);
    return createRSAKeyPair();
    
    }).then(function(rsakeypair) {
    
    var rsaobj = JSON.parse(rsakeypair);
    return generateJws(rsaobj.privateKey, rsaobj.publicKey);
    
    }).then(function(json) {
    
    var obj = JSON.parse(json); 
    return registerDid(obj.signedRegistrationRequest, obj.privateKey);
    
    }).then(function(json) {
    
    var obj = JSON.parse(json); 
    return registerKeyVault(obj.did, obj.privateKey);
    
    }).then(function(did) {
    
    return did;
    
    });
    
    context.res = {
    body : did
    }
    
   };
    
   function createCEKeyPair() {
    return new Promise(function (resolve) {
    
    var crypto = require('crypto');
    
    var keytype = 'ec';
    var encoding = {
    namedCurve: 'P-256',
    publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
    },
    privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
    }
    };
    crypto.generateKeyPair(keytype, encoding, function (err, publicKey, privateKey) {
    if (err) {
    console.log('ERROR: cannot create ec key pair');
    throw err;
    } 
    console.log('SUCCE: create ec key pair'); 
    //TODO register keyvault
    
    keyjson = JSON.stringify({
    "publicKey": publicKey,
    "privateKey": privateKey
    });
    
    resolve(keyjson);
    
    });
    
    });
   };
    
   function createRSAKeyPair() {
    return new Promise(function (resolve) {
    
    var crypto = require('crypto');
    
    var keytype = 'rsa';
    var encoding = {
    modulusLength: 2048
    , publicKeyEncoding: {
    type: 'spki'
    , format: 'pem'
    }
    , privateKeyEncoding: {
    type: 'pkcs1' //openssl = pkcs1
    , format: 'pem'
    }
    };
    
    crypto.generateKeyPair(keytype, encoding, function (err, publicKey, privateKey) {
    if (err) {
    console.log('ERROR: cannot create rsa key pair');
    throw err;
    }
    keyjson = JSON.stringify({
    "publicKey": publicKey,
    "privateKey": privateKey
    });
    
    resolve(keyjson);
    
    });
    });
   };
    
   function generateJws(privateKey, publicKey){
    return new Promise(async function (resolve) {
    
    var RsaPrivateKey = require('@decentralized-identity/did-auth-jose/dist/lib/crypto/rsa/RsaPrivateKey');
    var didAuth = require('@decentralized-identity/did-auth-jose');
    
    const keyId = "key-1";
    
    var pemJwk = require('pem-jwk');
    const jwkPriv = pemJwk.pem2jwk(privateKey);
    
    jwkPriv.kid = keyId;
    
    const jwkPub = pemJwk.pem2jwk(publicKey);
    jwkPub.kid = keyId;
    const preSignedPrivKey = new RsaPrivateKey.default({
    id: jwkPriv.kid,
    type: 'RsaVerificationKey2018',
    publicKeyJwk: jwkPriv
    });
    body = {
    didMethod: 'test',
    hubUri: 'https://beta.personal.hub.microsoft.com',
    publicKey: [jwkPub],
    }
    
    const cryptoFactory = new didAuth.CryptoFactory([new didAuth.RsaCryptoSuite()]);
    const token = new didAuth.JwsToken(JSON.stringify(body), cryptoFactory);
    const signedRegistrationRequest = await token.sign(preSignedPrivKey);
    
    json = JSON.stringify({
    "signedRegistrationRequest": signedRegistrationRequest,
    "privateKey": privateKey
    });
    
    resolve(json);
    });
   };
    
   function registerDid(signedRegistrationRequest, privateKey){
    return new Promise(function (resolve) {
    
    //register did
    var post_data = signedRegistrationRequest;
    
    // An object of options to indicate where to post to
    var post_options = {
    host: 'beta.register.did.microsoft.com',
    path: '/api/v1.1',
    method: 'POST',
    headers: {
    'Content-Type': 'application/jwt',
    'Content-Length': Buffer.byteLength(post_data)
    }
    };
    
    var http = require('https');
    var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8'); 
    res.on('data', function (chunk) {
    console.log('Response: ' + chunk); 
    var obj = JSON.parse(chunk);
    
    json = JSON.stringify({
    "did": obj.did,
    "privateKey": privateKey
    });
    
    resolve(json);

    console.log(json);
    
    });
    });
    
    // post the data
    post_req.write(post_data);
    post_req.end();
    
    });
   };
    
   function registerKeyVault(did, privateKey){
    return new Promise(function (resolve) {
    
    console.log(did); 
    
    // register private key(jwt) to key vault
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
    "did": did.split(':')[2],
    "pk": privateKey 
    })
    };
    request.post(options, function(error, response, body){
    resolve(did);
    });
    
    });
   };