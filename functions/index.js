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

function addNotification(uid, details, qid, type){
	const db = admin.database();
	var newNotiRef = db.ref("Users-v1").child(uid).child("notifications").push();
	newNotiRef.set({
		details: details,
		qid: qid,
		type: type,
		viewed: false
	});
	return newNotiRef.key
}

exports.questionAnswered = functions.database.ref("Questions-v1/{qid}/Users/{uid}").onWrite(event => {
	var db = admin.database();
	db.ref("Questions-v1").child(event.params.qid).child("content").child("askerID").once("value", function(snapshot){
		const uid = snapshot.val();
		var ref = db.ref("Users-v1").child(uid).child("info").child("FCM Token");
		ref.once("value", function(snapshot) {
			const token = snapshot.val();
			var ref = db.ref("Users-v1").child(event.params.uid).child("info").child("username").once("value", function(snapshot){
				var user = "Unknown user"
				if (snapshot.val() != "") user = snapshot.val();
				var bodyText = user + " answered your question";
				const nid = addNotification(uid, event.params.uid, event.params.qid, "questionAnswered");
				var payload = {
				    notification : {
				      body : bodyText
				      // title : "Question answered!"
				    },
				    data :{
				    	qid : event.params.qid,
				    	nid : nid
				    }
				};
				sendNotification(token, payload);
			})
		});
	})
});

exports.questionViewed = functions.database.ref("Questions-v1/{qid}/content/val").onWrite(event => {
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
					const nid = addNotification(uid, val, event.params.qid, "questionViewed");
					var payload = {
					    notification : {
					      body : bodyText
					    },
					    data :{
					    	qid : event.params.qid,
					    	nid : nid
					    }
					};
					const token = snapshot.val();
					sendNotification(token, payload);
				});
			})
		}
	}
});


exports.questionConcluded = functions.database.ref("Questions-v1/{qid}/content/conclusion").onWrite(event => {
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
					const ref = db.ref("Users-v1").child(askerID).child("info").child("username");
					ref.once("value", function(snapshot){
						const user = snapshot.val();
						const bodyText = "Congratulations! " + user + " accepted your answer.";
						nid = addNotification(uid, askerID, event.params.qid, "questionConcluded");
						payload = {
						    notification : {
						      body : bodyText
						    },
						    data :{
						    	qid : event.params.qid,
						    	nid : nid
						    }
						};
						sendNotification(token, payload);
					});
				});
			});
		});
	}
});