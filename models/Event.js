const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    image: String,
    name: String,
    url: String,
    '@type': String,
    startDate: Date,
    locationName: String,
    addressLocality: String,
    status: String
});

module.exports = mongoose.model('Event', eventSchema);

