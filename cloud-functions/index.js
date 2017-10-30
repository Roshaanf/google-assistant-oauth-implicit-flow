const functions = require('firebase-functions');
const admin = require('firebase-admin');
const _cors = require('cors');
const App = require('actions-on-google').ApiAiApp;
var firebase = require('firebase');
var serviceAccount = require("./agentproject-be016-firebase-adminsdk-glj8l-5d263affa9.json");

var passwordHash = require('password-hash');

// import * as _cors from 'cors';

var cors = _cors({ origin: true });// set these options appropriately According to your case,

//initializing app for firebase client sdk
var config = {
    apiKey: "AIzaSyD7IJiE6Gobgr8l3J0pqaNO4F3L0etGHjQ",
    authDomain: "agentproject-be016.firebaseapp.com",
    databaseURL: "https://agentproject-be016.firebaseio.com",
    storageBucket: "agentproject-be016.appspot.com",
};
firebase.initializeApp(config);

//initializing app for firebase admin sdk
admin.initializeApp(functions.config().firebase);



// a. the action name from the make_name API.AI intent
const BOOK_HOTEL = 'book_hotel';
const WELCOME_INTENT = 'Default_welcome_Intent'
// b. the parameters that are parsed from the make_name intent 
const AREA = 'Area';
const HOTEL = 'Hotel'
const RENT = 'Rent';
var name;


// api.ai web hook
exports.myApp = functions.https.onRequest((request, response) => {

    //var speech = req.body.result.resolvedQuery;


    const app = new App({ request, response });
    console.log('Request headers: ' + JSON.stringify(request.headers));
    console.log('Request body: ' + JSON.stringify(request.body));

    console.log("app.getUser().accessToken", app.getUser().accessToken);



    fetchNamePromise(app.getUser().accessToken).then((data) => {

        name = data;

        let actionMap = new Map();
        actionMap.set(BOOK_HOTEL, myFunction);
        actionMap.set(WELCOME_INTENT,welcomeIntentHandler);
        console.log('promise executing')

        app.handleRequest(actionMap);

    })
        .catch((error) => {

            console.log('overal error ', error)
        })


    // c. The function that generates the silly name
    function myFunction(app) {
        let area = app.getArgument(AREA);
        let hotel = app.getArgument(HOTEL);
        let rent = app.getArgument(RENT);

        app.tell('Alright ' + name + ', your hotel ' + hotel + ' has been booked in  ' +
            area + ' , and your rent is ' + rent +
            '! I hope you like it. See you next time.');
    }

    function welcomeIntentHandler(app) {
        

        app.ask('Hey '+name+" , how may I help you?");
    }



/////////////////////HELPER FUNCTIONS

    function fetchNamePromise(idToken) {

        return new Promise(function (resolve, reject) {


            console.log('i am idToken inside fetch ', idToken);

            verifyToken(idToken).then((uid) => {

                const name = admin.database().ref('/Users/' + uid + '/name').once('value')
                    .then((data) => {
                        console.log('data from db', data.val());

                        //this will be sent if every thing is successful
                        resolve(data.val());

                    })
                    .catch((error) => {

                        console.log("database fetching error ", error);

                        reject(error);
                    });
            })
                .catch((error) => {

                    console.log('error verifying uid ', error)
                })



        });
    }


    function verifyToken(idToken) {

        return new Promise(function (resolve, reject) {


            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {

                    console.log('uid after verifiying ', decodedToken.uid)
                    resolve(decodedToken.uid);

                })
                .catch(function (error) {

                    console.log('error in verifying uid ', error);
                    reject(error);
                });
        });


    }
    ///////////////PREVIOUS CODE
    // const getClientDeviceId = admin.database().ref(`/First/name`).once('value').then((data) => {
    //     console.log(data);
    //     speech = data;
    //     return res.json({

    //         speech: speech,
    //         displayText: speech,
    //         source: 'webhook-echo-sample'
    //     });
    // });

});







//for access token
exports.sendToken = functions.https.onRequest((req, res) => {
    cors(req, res, () => {

        res.setHeader("Content-Type", "text/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        //    res.send(req.body.userEmail);

        // admin.auth().getUserByEmail(req.body.userEmail)
        //     .then(function (userRecord) {
        //         var record = userRecord.toJSON();
        //         // See the UserRecord reference doc for the contents of userRecord.
        //         console.log("Successfully fetched user data:", userRecord.toJSON());
        //         console.log(userRecord.toJSON().uid);
        //         //  console.log("this time"+record.uid+" "+record.metaData,lastSignInTime)
        //         //  res.send(userRecord.toJSON().uid);


        //         var hashedPassword = userRecord.toJSON().passwordHash;
        //         console.log("has" + hashedPassword);
        //         console.log(req.body.userPassword);



        //         res.send("0")
        //     })
        //     .catch(function (error) {
        //         console.log("Error fetching user data:", error);
        //         res.send("0");
        //     });


        const auth = firebase.auth();

        const promise = auth.signInWithEmailAndPassword(req.body.userEmail, req.body.userPassword);
        promise
            .then(user => {
                console.log(user)
                //generating token

                firebase.auth().currentUser.getToken(/* forceRefresh */ true)
                    .then(function (idToken) {

                        console.log('id token ' + idToken);
                        res.send(idToken);

                    }).catch(function (error) {
                        // Handle error
                        console.log("id token " + error);
                        res.send(error);
                    });



            })
            .catch(e => {
                console.log(e.message)

                res.send("0");
            });


    })
});




