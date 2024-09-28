const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    eventId: String,
    fullName: String,
    email: String,
    dateOfBirth: Date,
    startDate: Date,
    regDate: Date,
    source: String
});

module.exports = mongoose.model('Registration', registrationSchema);

