'use strict';

var Mongoose  = require('mongoose');

var MessageSchema = new Mongoose.Schema({
    content: { type: String, required: true },
    username: { type: String, required: true },
    date:  { type: String, required: true }
});

var messageModel = Mongoose.model('message', MessageSchema);

module.exports = messageModel;
