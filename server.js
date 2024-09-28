const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
