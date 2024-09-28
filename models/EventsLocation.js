const mongoose = require('mongoose');

const eventsLocationSchema = new mongoose.Schema({
    addressLocality: String,
    locationName: String
});


module.exports = mongoose.model('EventsLocation', eventsLocationSchema);
