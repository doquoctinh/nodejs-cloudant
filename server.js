var express = require("express");
var secure = require('express-force-https');
var app = express();
app.use(secure);
var cfenv = require("cfenv");
var bodyParser = require('body-parser');
require('dotenv').config()
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());

var cloudant;

app.get("/api/getUser", async function(req, res){
    var userdb = cloudant.db.use("dipblockchainclient-api");
    var user = await userdb.get("Users:dxcdip-authority1");
    res.send(user);
});


app.post("/api/getAllCountries", cors(), function (request, response) {
    countries_db = cloudant.db.use("countries");
    if (!countries_db) {
        responseError("An error has occured", 400, response);
        return;
    }
    countries_db.find({                                 // search by criteria
        selector: {
            "continent": request.body.continent
        }
    }, function (err, result) {
        if (err) {
            throw err;
        }
        response.status(200);
        response.json(result);
        console.log("List of countries in " + request.body.continent + " " + JSON.stringify(result));
    });
});



app.post("/api/addCity", cors(), function (request, response) {
    let countryID;
    countries_db = cloudant.db.use("countries");
    cities_db = cloudant.db.use("cities");
    if (!countries_db || !cities_db) {
        responseError("An error has occured", 400, response);
        return;
    }
    countries_db.find({
        selector: {
            "name": request.body.toCountry
        }
    }, function (err, result) {
        if (err) {
            throw err;
        }
        countryID = eval(JSON.stringify(result["docs"]))[0]._id;
        cities_db.insert({ name: request.body.name, country_id: countryID }, function (err, result) {     // insert
            if (err) {
                throw err;
            }
            console.log("Current cities list: " + JSON.stringify(result));
        });
        var responseJson =
        {
            "success": true,
            "added city": request.body.name,
            "toCountry": request.body.toCountry

        };
        response.status(200);
        response.json(responseJson);
    });


});



app.post("/api/updateCountry", cors(), function (request, response) {
    findById(id).then((response) => {
        let country = JSON.parse(response.data);
        country.continent = request.body.continent;
        db.insert(list, (err, response) => {
            if (err) {
                console.log('Error occurred: ' + err.message, 'update()');
            } else {
                var responseJson =
                {
                    "success": true,
                    "added city": request.body.name,
                    "toCountry": request.body.toCountry

                };
                response.status(200);
                response.json(responseJson);
            }
        });
    }).catch((err) => {
        console.log('Error occurred: ' + err.message, 'update()');
    });

});



function findById(id) {                                     // search by id
    countries_db = cloudant.db.use("countries");
    return new Promise((resolve, reject) => {
        countries_db.get(id, (err, document) => {
            if (err) {
                if (err.message == 'missing') {
                    console.log('Document id ${id} does not exist.');
                } else {
                    console.log('Error occurred: ' + err.message);
                }
            } else {
                // resolve({ data: JSON.stringify(document), statusCode: 200 });
            }
        });
    });
}


function responseError(message, code, response) {
    let responseJson = {
        "success": false,
        "message": message
    };
    response.status(code);
    response.json(responseJson);
}



// local VCAP configuration and service credentials
let vcapLocal;
try {
    vcapLocal = require('./vcap-local.json');
    console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? {
    vcap: vcapLocal
} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

var Cloudant = require('@cloudant/cloudant');

if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);

    var credentials = env['cloudantNoSQLDB'][0]['credentials'];
    cloudant = new Cloudant({ url: credentials.url, maxAttempt: 25, plugins: { retry: { retryErrors: false, retryStatusCodes: [429] } } });

} else if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/cloudant/)) {

    if (appEnv.services['cloudantNoSQLDB']) {
        cloudant = new Cloudant({ url: appEnv.services['cloudantNoSQLDB'][0].credentials.url, maxAttempt: 25, plugins: { retry: { retryErrors: false, retryStatusCodes: [429] } } });
    } else {
        cloudant = new Cloudant({ url: appEnv.getService(/cloudant/).credentials.url, maxAttempt: 25, plugins: { retry: { retryErrors: false, retryStatusCodes: [429] } } });
    }

} else if (process.env.CLOUDANT_URL) {
    cloudant = new Cloudant({ url: process.env.CLOUDANT_URL, maxAttempt: 25, plugins: { retry: { retryErrors: false, retryStatusCodes: [429] } } });
}

var port = process.env.PORT || 8000
app.listen(port, function () {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});