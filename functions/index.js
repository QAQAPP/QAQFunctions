const functions = require('firebase-functions');

// Start writing Firebase Functions
// https://firebase.google.com/functions/write-firebase-functions

// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// })

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

// exports.sendNotification2 = functions.database.ref("Suggestions")
// .onWrite(event => {
// 	// This registration token comes from the client FCM SDKs.
// 	var registrationToken = "eY9GK_jgkUk:APA91bG9FP0me2iz2zzx2FPP-yhA9YGg3ME6LQ3vk1GHoBPHwak20PW2AcMLWupH_4gxhsDbnFo1Va9ECufkVKmL7ef4bOoHI5PXk7EYMI6kj4BgQP76O0oIiCV_gqjUCvtGcIg2jItm";

// 	// See the "Defining the message payload" section below for details
// 	// on how to define a message payload.
// 	var payload = {
// 	    "notification" : {
// 	      "body" : "great match!",
// 	      "title" : "Portugal vs. Denmark",
// 	      "icon" : "myicon"
// 	    },
// 	    "data" : {
// 	      "Nick" : "Mario",
// 	      "Room" : "PortugalVSDenmark"
// 	    }
// 	};

// 	// Send a message to the device corresponding to the provided
// 	// registration token.
// 	admin.messaging().sendToDevice(registrationToken, payload)
// 	  .then(function(response) {
// 	    // See the MessagingDevicesResponse reference documentation for
// 	    // the contents of response.
// 	    console.log("Successfully sent message:", response);
// 	  })
// 	  .catch(function(error) {
// 	    console.log("Error sending message:", error);
// 	  });
// })

exports.sendNotification = functions.database.ref("Questions-v1/{qid}/options/{oid}/val")
.onWrite(event => {
	var request = event.data.val();
	var payload = {
		data:{
			username:"Zhenyang Zhong",
			email:"zhenyanz@lazy-y.com"
		}
	};
	var db = admin.database();
	db.ref("Questions-v1").child(event.params.qid).child("owner").once("value", function(snapshot){
		var ref = db.ref("Users-v1").child(snapshot.val()).child("info").child("FCM Token");
		ref.once("value", function(snapshot) {
			var payload = {
			    "notification" : {
			      "body" : "Your question was answered!",
			      "title" : "Question answered!"
			    }
			};
			const token = snapshot.val();
			admin.messaging().sendToDevice(token, payload).then(function(response){
				console.log("Successfully sent message: ", response);
			}).catch(function(error){
				console.log("Error sending message: ", error);
			})
		});
	})

	// console.log("request", request);
	// console.log("uid", event.params.uid);
	// console.log("val", functions.database.ref("Suggestions/" + event.params.uid).val());
	// functions.database.ref("Users-v1").child(event.params.uid).child("notifications");
})

