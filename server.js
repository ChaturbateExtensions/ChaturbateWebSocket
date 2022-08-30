const express = require('express');
var createError = require('http-errors');
const app = express();
const port = 3000;
const path = require("path");
var fs = require('fs');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static('screenshots'));

var tips = [];

app.get('/cb', (request, response) => {
    const model = request.query.model;
    const tipper = request.query.tipper;
    const amount = request.query.amount;
    var dateUnfmt = new Date();
    var dateFmt = (dateUnfmt.getMonth()+1)+"-"+dateUnfmt.getDate()+"-"+dateUnfmt.getFullYear();
    dateUnfmt.toTimeString()
    var obj = {
        model:model,
        tipper:tipper,
        amount:amount,
        date:dateFmt,
        time:dateUnfmt.toTimeString().split(" ")[0]
    }
    tips = tips.concat(obj);
    console.log("Total tips:",tips.length);
    if (tips.length % 10 === 0) {
        console.log("Multiple of 10");
        fs.appendFileSync("tips.csv",convertToCSV(tips),"utf-8");
        console.log(tips[tips.length-1])
        console.log(tips[tips.length-2])
        console.log(tips[tips.length-3])
        console.log(tips[tips.length-4])
        console.log(tips[tips.length-5])
        console.log(tips[tips.length-6])
        console.log(tips[tips.length-7])
        console.log(tips[tips.length-8])
        console.log(tips[tips.length-9])
        console.log(tips[tips.length-10])
        console.log("Appended to file")
        tips = [];
        //console.log(tips)
    }
    response.status(200);
    response.json(obj);
});

app.listen(port, () => console.log(`Tracking app listening on port ${port}!`));

function convertToCSV(arr) {
    var array = typeof arr != 'object' ? JSON.parse(arr) : arr;
    var str = '';
    for (let i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','
            line += array[i][index]
        }
        str += line +'\r\n';
    }
    return str;
}
