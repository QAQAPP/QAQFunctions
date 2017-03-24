const functions = require('firebase-functions');

// Start writing Firebase Functions
// https://firebase.google.com/functions/write-firebase-functions

// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// })

const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

function sendNotification(token, payload){
	admin.messaging().sendToDevice(token, payload).then(function(response){
		console.log("Successfully sent message: ", response);
	}).catch(function(error){
		console.log("Error sending message: ", error);
	})
}

exports.newAnswer = functions.database.ref("Questions-v1/{qid}/Users/{uid}").onWrite(event => {
	var db = admin.database();
	db.ref("Questions-v1").child(event.params.qid).child("content").child("askerID").once("value", function(snapshot){
		var ref = db.ref("Users-v1").child(snapshot.val()).child("info").child("FCM Token");
		ref.once("value", function(snapshot) {
			const token = snapshot.val();
			var ref = db.ref("Users-v1").child(event.params.uid).child("info").child("username").once("value", function(snapshot){
				var user = "Unknown user"
				if (snapshot.val() != "") user = snapshot.val();
				var bodyText = user + " answered your question";
				var payload = {
				    notification : {
				      body : bodyText
				      // title : "Question answered!"
				    }
				};
				sendNotification(token, payload);
			})
		});
	})
});

exports.numAnswer = functions.database.ref("Questions-v1/{qid}/content/val").onWrite(event => {
	var val = event.data.val();
	if (val > 0 && val%5 == 0){
		var copy = val;
		while (copy%2 == 0) copy /= 2;
		if (copy == 5){
			var db = admin.database();
			db.ref("Questions-v1").child(event.params.qid).child("content").child("askerID").once("value", function(snapshot){
				var ref = db.ref("Users-v1").child(snapshot.val()).child("info").child("FCM Token");
				ref.once("value", function(snapshot) {
					var bodyText = "Your question got " + val.toString() + " responses.";
					var payload = {
					    notification : {
					      body : bodyText
					    }
					};
					const token = snapshot.val();
					sendNotification(token, payload);
				});
			})
		}
	}
});


exports.questionConclude = functions.database.ref("Questions-v1/{qid}/content/conclusion").onWrite(event => {
	var oid = event.data.val();
	if (oid != "nil"){
		const db = admin.database();
		var ref = db.ref("Questions-v1").child(event.params.qid).child("options").child(oid).child("offerBy");
		ref.once("value", function(snapshot){
			const uid = snapshot.val();
			var ref = db.ref("Users-v1").child(uid).child("info").child("FCM Token");
			ref.once("value", function(snapshot){
				const token = snapshot.val();
				const ref = db.ref("Questions-v1").child(event.params.qid).child("content").child("askerID")
				ref.once("value", function(snapshot){
					const askerID = snapshot.val();
					const ref = db.ref("Users-v1").child(uid).child("info").child("username");
					ref.once("value", function(snapshot){
						const user = snapshot.val();
						const bodyText = "Congratulations! " + user + " accepted your answer.";
						payload = {
						    notification : {
						      body : bodyText
						    }
						};
						sendNotification(token, payload);
					});
				});
			});
		});
	}
});