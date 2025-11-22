 // requiring express
const express = require('express');
// app is calling the use of our express server
const app = express();
// port number our localhost is hosted on
const PORT = 8080;
// avoid cors errors in the server
const cors = require('cors');

app.set('view engine', 'ejs');


app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());


app.use(express.static("styles"));


app.get("/", cors(), (req, res) => {
    res.render("home", {text: "HOME PAGE"})
});

app.get("/project", cors(), (req, res) => {
    res.send("projects page")
});

app.get("/analysis", cors(), (req, res) => {
    res.send("analysis page");
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
}); 