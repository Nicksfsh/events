<h1>Events Registration App</h1>


Links:<br>
Solution URL: https://github.com/Nicksfsh/Events<br>
Live Site URL: https://adsenger.online/


<h2>Prerequisites</h2>


Before running the application, make sure you have the following installed:<br>
NodeJS <br>
NPM <br>
MongoDB


<h2>Installation</h2>

- Clone the repository: git clone https://github.com/Nicksfsh/Events.<br>
- Navigate to the project directory.<br>
- Install the dependencies: 'npm install'.<br>
- Rename file .env.example to .env and change all configuration settings to your own.<br>
<h2>Usage</h2>


To start the service, run the following command:
'npm start'


<h2>Filling the database with data and updating data in the database</h2>

A list of events can be populated and updated in the database via a seed script (app) in the 'dbfiller' directory. At the first launch, the database will be filled with event data. The next runs of this script will update the events data. The process lasts nearly 15 minutes.


1. Navigate to the ‘dbfiller’ directory.<br>
2. Rename file .env.example to .env and change all configuration settings to your own.<br>
3. Install the dependencies: 'npm install'.<br>
4. To populate or update  the database, run command ‘npm start’. <br>



