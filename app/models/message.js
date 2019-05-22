'use strict';

var messageModel   = require('../database').models.message;
var User 		= require('../models/user');

var create = function (data, callback){
	var newmessage = new messageModel(data);
	newmessage.save(callback);
};

var find = function (data, callback){
	messageModel.find(data, callback);
}

var findOne = function (data, callback){
	messageModel.findOne(data, callback);
}

var findById = function (id, callback){
	messageModel.findById(id, callback);
}

var findByIdAndUpdate = function(id, data, callback){
	messageModel.findByIdAndUpdate(id, data, { new: true }, callback);
}

/**
 * Add a user along with the corresponding socket to the passed message
 * TODO REVIEW. APPLICABLE?
 */
var addUser = function(message, socket, callback){

	// Get current user's id
	var userId = socket.request.session.passport.user;

	// Push a new connection object(i.e. {userId + socketId})
	var conn = { userId: userId, socketId: socket.id};
	message.connections.push(conn);
	message.save(callback);
}

/**
 * Get all users in a message
 * TODO REVIEW. APPLICABLE?
 */
var getUsers = function(message, socket, callback){

	var users = [], vis = {}, cunt = 0;
	var userId = socket.request.session.passport.user;

	// Loop on message's connections, Then:
	message.connections.forEach(function(conn){

		// 1. Count the number of connections of the current user(using one or more sockets) to the passed message.
		if(conn.userId === userId){
			cunt++;
		}

		// 2. Create an array(i.e. users) contains unique users' ids
		if(!vis[conn.userId]){
			users.push(conn.userId);
		}
		vis[conn.userId] = true;
	});

	// Loop on each user id, Then:
	// Get the user object by id, and assign it to users array.
	// So, users array will hold users' objects instead of ids.
	var loadedUsers = 0;
	users.forEach(function(userId, i){
		User.findById(userId, function(err, user){
			if (err) { return callback(err); }
			users[i] = user;

			// fire callback when all users are loaded (async) from database
			if(++loadedUsers === users.length){
				return callback(null, users, cunt);
			}
		});
	});
}

/**
 * Remove a user along with the corresponding socket from a message
 * TODO REVIEW. APPLICABLE?
 */
var removeUser = function(socket, callback){

	// Get current user's id
	var userId = socket.request.session.passport.user;

	find(function(err, messages){
		if(err) { return callback(err); }

		// Loop on each message, Then:
		messages.every(function(message){
			var pass = true, cunt = 0, target = 0;

			// For every message,
			// 1. Count the number of connections of the current user(using one or more sockets).
			message.connections.forEach(function(conn, i){
				if(conn.userId === userId){
					cunt++;
				}
				if(conn.socketId === socket.id){
					pass = false, target = i;
				}
			});

			// 2. Check if the current message has the disconnected socket,
			// If so, then, remove the current connection object, and terminate the loop.
			if(!pass) {
				message.connections.id(message.connections[target]._id).remove();
				message.save(function(err){
					callback(err, message, userId, cunt);
				});
			}

			return pass;
		});
	});
}

module.exports = {
	create,
	find,
	findOne,
	findById,
	addUser,
	getUsers,
	removeUser
};
