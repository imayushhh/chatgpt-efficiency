 // requiring express
const express = require('express');
// app is calling the use of our express server
const app = express();
// port number our localhost is hosted on
const PORT = 8080;
// avoid cors errors in the server
const cors = require('cors');

// middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

// testing
app.get("/", cors(), (req, res) => {
    res.send("home page");
});

app.get("/about", cors(), (req, res) => {
    res.send("about page");
});

app.get("/project", cors(), (req, res) => {
    res.send("projects page")
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
}); 