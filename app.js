const express = require('express')
const app = express()

const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://callum1h1:eP1TLNS5QrSPMsIL@cluster0.eywkujf.mongodb.net/';
const WEB_PORT = process.env.WEB_PORT || 3010;
const LOGIN_SERVER_URL = process.env.LOGIN_SERVER_URL || 'http://127.0.0.1:3005';

const mongoose = require('mongoose');
const axios = require('axios').default;

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }))

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

app.post('/createlist/', async (req, res) => {
    try {
        const { token, description, phoneNumber, lat, long } = req.body;

        // Messy code
        if (!token) return res.status(401).json({ error: 'Invalid Request' });
        if (!description || description.length < 1  || description.length > 255) return res.status(401).json({ error: 'Invalid Request' });
        if (!phoneNumber || phoneNumber.length < 1  || phoneNumber.length > 32) return res.status(401).json({ error: 'Invalid Request' });
        if (!lat) return res.status(401).json({ error: 'Invalid Request' });
        if (!long) return res.status(401).json({ error: 'Invalid Request' });

        // Verifying the users token and getting their username.
        const username = await VerifyUser(token);

        if (!username) return res.status(401).json({ error: 'Invalid Request' });

        // Finds the listing that is already created 
        const listing = await Listing.findOne({ username });

        // If it already exists delete it.
        if (listing)
        {
            await listing.deleteOne();
        }

        // Saves the listing to the database
        const new_listing = new Listing({ username, description: description, phoneNumber: phoneNumber, lat: lat, long: long });
        await new_listing.save();

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
        } 
        
        return res.status(200).json({success: 'Successful'});
    }
    catch (error) 
    {
        return res.status(401).json({ error: 'Invalid Request' });
    }
})

app.listen(WEB_PORT, () => console.log('server ready'))




