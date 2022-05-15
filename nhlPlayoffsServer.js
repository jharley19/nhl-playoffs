/* Important */
process.stdin.setEncoding("utf8");

let http = require("http");
let path = require("path");
let express = require("express");   /* Accessing express module */
let app = express();  /* app is a request handler function */
require("dotenv").config({ path: path.resolve(__dirname, 'credentials/.env') })  
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));;

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

 /* Our database and collection */
const databaseAndCollection = {db: "NHL_PLAYOFFS", collection:"teams"};
const { MongoClient, ServerApiVersion } = require('mongodb');

let port = process.argv[2];

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");


var json; 
var numWins = 0;


// Get API and store result into var json
async function getJSONData() {
  const result = await fetch(
    "https://nhl-score-api.herokuapp.com/api/scores?startDate=2022-5-2&endDate=2022-5-15"
  );
  const data = await result.json();

  return data;
}

/* Using IIFE */
(async () => {
  try {
    json = await getJSONData();
  } catch (e) {
    console.log("ERROR, ERROR: " + e);
  }
})();

  
// run the server
process.stdout.write("Web Server started and running at http://localhost:" + port + "\n");
let prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
  let dataInput = process.stdin.read();
  if (dataInput !== null) {
    let command = dataInput.trim();
    if (command.toUpperCase() === "STOP") {
      process.stdout.write("Shutting down the server\n");
      process.exit(0);
    } 
  }
});


// display homepage
app.get("/", (request, response) => { 
    response.render("index");
}); 
// display the myTeams page
app.get("/myTeams", (request, response) => { 
    response.render("myTeams");
});
// display myTeamsUpdate page by calling displayTeams
app.get("/myTeamsUpdate", (request, response) => { 
  displayTeams(response)
});
app.get("/removeAll", (request, response) => { 
  response.render("removeAll");
});
app.get("/removeOne", (request, response) => { 
  response.render("removeOne");
});

let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));

app.post("/processMyTeams", (request, response) => {
    let {name} = request.body;
    
    var today = new Date();

    const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
    let d = today.getDay();
    let day = daysOfWeek[d];

    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let m = today.getMonth();
    let month = months[m];

    let dateTime = "Task completed at " + day + " " + month + " " + today.getDate() + " " + today.getFullYear()+" "+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + " GMT-0400 (Eastern Daylight Time)";
    name = name.toUpperCase();

    teamExists(name, dateTime, response);
});

app.get("/reviewMyTeams", (request, response) => {
    lookUpAllTeams(response);
});

app.post("/processRemoveOne", (request, response) => {
  let {name} = request.body;
  removeOne(response, name);
});

app.post("/processRemoveAll", (request, response) => {
  removeAll(response);
});




async function insertTeam(newTeam) {
 
  const uri = `mongodb+srv://${userName}:${password}@cluster0.avw5l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newTeam);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
  
}

async function lookUpAllTeams(response) {
  const uri = `mongodb+srv://${userName}:${password}@cluster0.avw5l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    let filter = {};
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter).toArray();
    
    if (result){
     
      var today = new Date();

      const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
      let d = today.getDay();
      let day = daysOfWeek[d];
  
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      let m = today.getMonth();
      let month = months[m];
  
      let dateTime = "Task completed at " + day + " " + month + " " + today.getDate() + " " + today.getFullYear()+" "+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + " GMT-0400 (Eastern Daylight Time)";
      
      let teamList= "<table border=1><tr><th>Team Name</th><th>Captain</th><th>Reg. Season Pts Leader</th><th>Last Cup</th></tr>";
      result.forEach( x => teamList+= "<tr><td>" + JSON.stringify(x.name).replace(/"/g,"")  +"</td>" + "<td>"+ JSON.stringify(x.captain).replace(/"/g,"") +"</td>" + "<td>"+ JSON.stringify(x.pointLeader).replace(/"/g,"") +"</td>"+ "<td>"+ JSON.stringify(x.lastCup).replace(/"/g,"") +"</td>"+ "</tr>");
      teamList+= "</table>";

      let table = {
        teamList: teamList,
        dateTime: dateTime
      };
      response.render("reviewMyTeams", table);
    } else {
      var today = new Date();

      const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
      let d = today.getDay();
      let day = daysOfWeek[d];
  
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      let m = today.getMonth();
      let month = months[m];
  
      let dateTime = "Task completed at " + day + " " + month + " " + today.getDate() + " " + today.getFullYear()+" "+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + " GMT-0400 (Eastern Daylight Time)";
      let table = {
        teamList: "EMPTY!",
        dateTime: dateTime
      };
      response.render("reviewMyTeams", table);
    }

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function teamExists(name, dateTime, response) {
  const uri = `mongodb+srv://${userName}:${password}@cluster0.avw5l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {

    await client.connect();
    let filter = {name: name};
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(filter);
    if (result){  
      let table = {
        name: name,
      };
      response.render("oops", table);
    } else {
      switch(name) {
        case "BOS":
          captain = "Patrice Bergeron";
          pointLeader = "Brad Marchand 80pts";
          lastCup = "2011";
          break;
        case "CAR":
            captain = "Jordan Staal";
            pointLeader = "Sebastian Aho 81pts";
            lastCup = "2006";
            break;
        case "CGY":
            captain = "N/A";
            pointLeader = "Johnny Gaudreau 115pts";
            lastCup = "1989";
            break;
        case "COL":
            captain = "Gabriel Landeskog";
            pointLeader = "Mikko Rantanen 92pts";
            lastCup = "2001";
            break;
        case "DAL":
            captain = "Jamie Benn";
            pointLeader = "Joe Pavelski 81pts";
            lastCup = "1999";
            break;
        case "EDM":
            captain = "Connor McDavid";
            pointLeader = "Connor McDavid 122pts";
            lastCup = "1990";
            break;
        case "FLA":
            captain = "Aleksander Barkov";
            pointLeader = "Jonathan Huberdeau 115pts";
            lastCup = "Never";
            break;
        case "LAK":
            captain = "Anze Kopitar";
            pointLeader = "Anze Kopitar 66pts";
            lastCup = "2014";
            break;
        case "MIN":
            captain = "Jared Spurgeon";
            pointLeader = "Kirill Kaprizov 108pts";
            lastCup = "Never";
            break;
        case "NSH":
            captain = "Roman Josi";
            pointLeader = "Roman Josi 96pts";
            lastCup = "Never";
            break;
        case "NYR":
            captain = "None";
            pointLeader = "Artemi Panarin 96pts";
            lastCup = "1994";
            break;
        case "PIT":
            captain = "Sidney Crosby";
            pointLeader = "Sidney Crosby 84pts";
            lastCup = "2017";
            break;
        case "STL":
            captain = "Vladimir Tarasenko";
            pointLeader = "Vladimir Tarasenko 96pts";
            lastCup = "2014";
            break;
        case "TBL":
            captain = "Steven Stamkos";
            pointLeader = "Steven Stamkos 106pts";
            lastCup = "2021";
            break;
        case "TOR":
            captain = "Auston Matthews";
            pointLeader = "Auston Matthews 106pts";
            lastCup = "1967";
            break;
        case "WSH":
            captain = "Alex Ovechkin";
            pointLeader = "Alex Ovechkin 90pts";
            lastCup = "2018";
            break; 
          
      }
      let table = {
        name: name,
        captain: captain,
        pointLeader: pointLeader,
        lastCup: lastCup,
        dateTime: dateTime
      };

      insertTeam(table);
      response.render("processMyTeams", table);
    }
   
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}
// let tab = "<table border=1><tr><th>Name</th><th>GPA</th></tr>";
// result.forEach( x => tab += "<tr><td>" + JSON.stringify(x.name).replace(/"/g,"")  +"</td>" + "<td>"+ JSON.stringify(x.gpa).replace(/"/g,"") + "</tr>");
// tab += "</table>";

// let final = {
//   orderTable: tab
// };

// response.render("processAdminGPA", final);

// called by myTeamsUpdate
async function displayTeams(response){
  const uri = `mongodb+srv://${userName}:${password}@cluster0.avw5l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    let filter = {};
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter).toArray();
    
    // check if there is stuff in database
    if (result){    
      // get datetime
      var today = new Date();

      const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
      let d = today.getDay();
      let day = daysOfWeek[d];
  
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      let m = today.getMonth();
      let month = months[m];
      
      let dateTime = "Task completed at " + day + " " + month + " " + today.getDate() + " " + today.getFullYear()+" "+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + " GMT-0400 (Eastern Daylight Time)";
      
      // get a list of all the teams currently in the database
      let listOfTeamsString = "";
      result.forEach(x => listOfTeamsString += JSON.stringify(x.name).replace(/"/g,"") +",");
      let listOfTeams = listOfTeamsString.slice(0, -1).split(",");

      let teamList="";
      let currGame = 1;
      let currTeam = "";

      // for each team, go through the JSON and find the relevant data
      listOfTeams.forEach(throughJSON);

      function throughJSON(team){
        currGame = 1;
        currTeam = team;
        // make a new table for eacj team
        teamList += "<hr/><h2>" + team + "</h2><br/><table border=1><tr><th>Game</th><th>Opponent</th><th>Score</th><th>Result</th></tr>";
        // call this helper function to go through the game array for every date (json is indexed by dates)
        json.forEach(makeTable);
        teamList+= "</table>";
        winsLeft = 4-numWins;
        teamList += "<br/>" + currTeam + " needs only " + winsLeft  + " wins to advance!" ; 
        numWins = 0; 
      }

      // go through each day
      function makeTable(x){
        // so x is a date, thus we need to investigate the games array for that date
        let games = x.games;
        // go through each game on that day to find matches
        games.forEach(actuallyMakeTable) ;
    
      }
      
      // go through all games on a day
      function actuallyMakeTable(game){
        // check if the away team is the current team we are making the table for
        if(game.teams.away.abbreviation === currTeam){
          let homeTeam = game.teams.home.abbreviation;
          let score = JSON.stringify(game.scores).split(",");
          let homeScore = 0;
          let awayScore = Number(score[0].charAt(score[0].length-1));
          if (score.length == 2){
            homeScore = Number(score[1].charAt(score[1].length-2));
          } else {
            homeScore = Number(score[1].charAt(score[1].length-1));
          }
          let duborL = "L";
          if (homeScore < awayScore){
            duborL = "W";
            numWins = numWins + 1;
            teamList+= "<tr><td>"+currGame+"</td><td>"+ "@ " + homeTeam + "</td><th>" + awayScore + "-" + homeScore + "</td><td>"+duborL+"</td></tr>";
          } else {
            teamList+= "<tr><td>"+currGame+"</td><td>"+ "@ " + homeTeam + "</td><th>" + homeScore + "-" + awayScore + "</td><td>"+duborL+"</td></tr>";
          }
          currGame = currGame+1;
        }
        // check if the home team is the current team we are making the table for
        else if (game.teams.home.abbreviation === currTeam){
          let awayTeam = game.teams.away.abbreviation;
          let score = JSON.stringify(game.scores).split(",");
          let homeScore = 0;
          let awayScore = Number(score[0].charAt(score[0].length-1));
          if (score.length == 2){
            homeScore = Number(score[1].charAt(score[1].length-2));
          } else {
            homeScore = Number(score[1].charAt(score[1].length-1));
          }
          let duborL = "W";
          if (homeScore < awayScore){
            duborL = "L";
            teamList+= "<tr><td>"+currGame+"</td><td>"+ "vs " + awayTeam + "</td><th>" + awayScore + "-" + homeScore + "</td><td>"+duborL+"</td></tr>";
          } else {
            numWins = numWins + 1;
            teamList+= "<tr><td>"+currGame+"</td><td>"+ "vs " + awayTeam + "</td><th>" + homeScore + "-" + awayScore + "</td><td>"+duborL+"</td></tr>";
          }
          
          currGame = currGame+1;
        }
      }

      let table = {
        orderTable: teamList,
        dateTime: dateTime
      };
      response.render("myTeamsUpdate", table);
    } else {
      var today = new Date();

      const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
      let d = today.getDay();
      let day = daysOfWeek[d];
  
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      let m = today.getMonth();
      let month = months[m];
  
      let dateTime = "Task completed at " + day + " " + month + " " + today.getDate() + " " + today.getFullYear()+" "+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + " GMT-0400 (Eastern Daylight Time)";
      let table = {
        orderTable: "EMPTY!",
        dateTime: dateTime
      };
      response.render("myTeamsUpdate", table);
    }

  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
  var today = new Date();

  const daysOfWeek = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
  let d = today.getDay();
  let day = daysOfWeek[d];

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let m = today.getMonth();
  let month = months[m];

  let dateTime = "Task completed at " + day + " " + month + " " + today.getDate() + " " + today.getFullYear()+" "+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds() + " GMT-0400 (Eastern Daylight Time)";
  
  let table = {
    orderTable: "error occurred",
    dateTime: dateTime
  };
  
  response.render("myTeamsUpdate", table);
}


async function removeAll(response) {
  const uri = `mongodb+srv://${userName}:${password}@cluster0.avw5l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  try {
    await client.connect();
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
    let table  = {
      numRemoved: result.deletedCount
    };


    response.render("processRemoveAll", table);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

async function removeOne(response, targetName) {
  const uri = `mongodb+srv://${userName}:${password}@cluster0.avw5l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
  let filter = {name: targetName};
  try {
    await client.connect();
    const result = await client.db(databaseAndCollection.db)
                 .collection(databaseAndCollection.collection)
                 .deleteOne(filter);
    let table = {
      team: targetName
    };
    response.render("processRemoveOne", table);
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  }
}

http.createServer(app).listen(port);



