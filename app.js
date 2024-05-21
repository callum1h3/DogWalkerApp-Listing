const express = require('express')
const app = express()
const http = require('http');

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://callum1h1:eP1TLNS5QrSPMsIL@cluster0.eywkujf.mongodb.net/';
const WEB_PORT = process.env.WEB_PORT || 3010;
var LOGIN_SERVER_URL = process.env.LOGIN_SERVER_URL || 'http://127.0.0.1:3005';

const https = require('https');

https.get('https://v4.ident.me/', res => {
  let data = [];
  const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';

  res.on('data', chunk => {
    data.push(chunk);
  });

  res.on('end', () => {
    LOGIN_SERVER_URL = 'http://'+data+':3005';
  });
}).on('error', err => {
  console.log('Error: ', err.message);
});

const mongoose = require('mongoose');
const axios = require('axios').default;

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET");
    res.setHeader("Access-Control-Allow-Headers", "*");

    next();
});

// Connect to the database.
mongoose.connect(MONGO_URL);

// This defines the user in the database so we can include it later in the main part of the login system.
const listingSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    description: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    lat: { type: String, required: true },
    long: { type: String, required: true }
});

const Listing = mongoose.model('Listing', listingSchema);

// Asks the login server if the user's token is still valid and gets their username.
async function VerifyUser(token)
{
    try {
        const data = {
            token: token
        };
        
        const response = await axios.post(LOGIN_SERVER_URL + "/verify/", data, {headers: {'content-type': 'application/x-www-form-urlencoded'}});

        if (response.status == 200)
        {
            const username = response.data.decoded.username;
            return username;
        }
    }
    catch (error) { return null; }
    return null;
}

//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function calcCrow(lat1, lon1, lat2, lon2) 
{
    var R = 6371; // km
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) 
{
    return Value * Math.PI / 180;
}

app.post('/createlist/', async (req, res) => {
    try {
        const { token, description, phoneNumber, lat, long } = req.body;

        // Messy code
        if (!token) return res.status(401).json({ error: 'Invalid Token' });
        if (!description || description.length < 1  || description.length > 255) return res.status(401).json({ error: 'Invalid Description' });
        if (!phoneNumber || phoneNumber.length < 1  || phoneNumber.length > 32) return res.status(401).json({ error: 'Invalid Phone Number' });
        if (!lat) return res.status(401).json({ error: 'Invalid Lat' });
        if (!long) return res.status(401).json({ error: 'Invalid Long' });

        // Verifying the users token and getting their username.
        const username = await VerifyUser(token);

        if (!username) return res.status(401).json({ error: 'Invalid Request' });

        // Finds the listing that is already created 
        const listing = await Listing.findOne({ username });

        // If it already exists delete it.
        if (listing)
        {
            console.log("Removed old listing of user: " + username);
            await listing.deleteOne();
        }

        // Saves the listing to the database
        const new_listing = new Listing({ username, description: description, phoneNumber: phoneNumber, lat: lat, long: long });
        await new_listing.save();

        console.log("Created new listing for user: " + username);

        return res.status(200).json({success: 'Successful'});
    }
    catch (error) 
    {
        return res.status(401).json({ error: 'Invalid Request' });
    }
})

app.post('/deletelist/', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) return res.status(401).json({ error: 'Invalid Request' });

        // Verifying the users token and getting their username.
        const username = await VerifyUser(token);

        if (!username) return res.status(401).json({ error: 'Invalid Request' });
        
        // Finds the listing that is already created 
        const listing = await Listing.findOne({ username });

        // If it already exists delete it.
        if (listing)
        {
            await listing.deleteOne();
            console.log("Removed old listing of user: " + username);
        } 
        
        return res.status(200).json({success: 'Successful'});
    }
    catch (error) 
    {
        return res.status(401).json({ error: 'Invalid Request' });
    }
})

app.post('/search/', async (req, res) => {
    try {
        // Gets the database.
        const cursor = Listing.find().select().cursor();

        // Distance is km
        const { lat, long, distance } = req.body;

        var arr = [];
        if (lat && long && distance)
        {
            // Checks if the listing is within the maximum distance set by the user.
            for (let document = await cursor.next(); document != null; document = await cursor.next()) 
            {
                const calculated_distance = calcCrow(lat, long, document.lat, document.long);

                if (calculated_distance < distance)
                    arr.push(document);
            }
        }
        else
        {
            // Just a global search.
            for (let document = await cursor.next(); document != null; document = await cursor.next()) 
            {
                arr.push(document);
            }
        }

        return res.status(200).json({listings: arr})
    }
    catch (error) 
    {
        return res.status(401).json({ error: 'Error with Search' });
    }
})

const httpServer = http.createServer(app);
httpServer.listen(3010, () => console.log('server ready'))




