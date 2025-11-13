 // requiring express
const express = require('express');
// app is calling the use of our express server
const app = express();
// port number our localhost is hosted on
const PORT = 8080;
// avoid cors errors in the server
const cors = require('cors');

app.set('view engine', 'ejs');

// middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());

// testing, render index.ejs in views
// we can pass an additional argument in an object, that allows code to be sent over to views
app.get("/", cors(), (req, res) => {
    res.render("home", {text: "HOME PAGE"})
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