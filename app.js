const express = require("express")
const app = express()

const path = require("path")
const request = require("request")
const favicon = require("serve-favicon");
const engine = require("consolidate")
const socketIo = require("socket.io")

require("dotenv").config();

const PORT = process.env.PORT || 3000
const ORIGIN=process.env.ORIGIN || `http://localhost:${PORT}`
const LTA_API_KEY=process.env.LTA_API_KEY

// set up router
var router = express.Router();
router.use(
  express.urlencoded({
    extended: true
  })
)
router.use(express.json())
router.use((req, res, next) => { // router middleware
    res.header("Access-Control-Allow-Origin", ORIGIN || "*");
    next();
});

// REGISTER ALL ROUTES -------------------------------
// all of the routes will be prefixed with /api
app.use("/api", router);

// set up express app properties
app.use(express.static(path.join(__dirname, "public")))
.set("views", path.join(__dirname, "views"))
.engine("html", engine.mustache)
.use(favicon(path.join(__dirname, "public", "img/favicon.ico")))
.set("view engine", "html")
.get("/", (req, res) => res.render("index.html"))

const server = app.listen(PORT, () => {
  console.log(`SG Transportation App [using Forward Proxy] is listening on port ${PORT}!`);
});

// set up web socket
const io = socketIo(server);

let updateInterval;
io.on("connection", (socket) => {
  console.log("server side socket connection established");
  if(updateInterval) {
    clearInterval(updateInterval);
  }
  function retrieveLatestBusArrivals(bus_stop_code) {
    let baseUrl = "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=";
    request({
        url: `${baseUrl}${bus_stop_code}`,
        method: "GET",
        headers: {
          "AccountKey" : LTA_API_KEY,
          "accept" : "application/json"
        }
    }, (err, response, body) => {
      if (err || response.statusCode !== 200) {
          return (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unable to retrieve data from datamall.lta.gov.sg Bus Arrival API.";
      } else {
          let result=JSON.parse(body);
          let resultStr=JSON.stringify(result["Services"])
          setInterval(()=> {
            socket.emit("bus_arrivals", resultStr);
          }, 10000);
          return resultStr;
      }
    });
  }
  
  socket.on("bus_arrivals", (selectedBusStop) => {
    console.log(`requested bus stop: ${selectedBusStop}`)
    retrieveLatestBusArrivals(selectedBusStop);
  });
 
  socket.on("disconnect", () => {
    console.log("socket disconnected");
  });
});

const API_ENDPOINT = "http://datamall2.mytransport.sg/ltaodataservice"
const PAGE_SIZE = 500 // How many records the API returns in a page.

function resolveAsyncCall(reqOptions) {
  return new Promise(resolve => {
    request(reqOptions, function(err, res, body) {
        let result=body.value;
        resolve(result);
    })
  }).catch((error) => {
    console.log(error);
    console.log("The error is handled, continue normally");
  });
}

async function asyncCall(transportation) {
  var arr_result=[];
  var offset = 0;

  var options={
    url: `${API_ENDPOINT}/${transportation}?$skip=${offset}`,
    method: "GET",
    timeout: 480000,
    json: true,
    headers: {
      "AccountKey" : LTA_API_KEY,
      "accept" : "application/json"
    }
  };

  var result = [];
  var toContinue=true;
  while(toContinue) {
    if(offset==0 || result.length==PAGE_SIZE) {
      result = await resolveAsyncCall(options);
      offset += PAGE_SIZE;
      options.url=`${API_ENDPOINT}/${transportation}?$skip=${offset}`;
    } else if(result.length < PAGE_SIZE) {
      toContinue=false;
    }
    arr_result=arr_result.concat(result);
  }
  return new Promise(resolve => {
    resolve(arr_result);
  }).catch((error) => {
    console.log(error);
    console.log("The error is handled, continue normally");
  });
};

//http://datamall2.mytransport.sg/ltaodataservice/PV/ODBus
// api/ltaodataservice/BusServices | BusServices | BusRoutes | BusStops
// http://datamall2.mytransport.sg/ltaodataservice/BusRoutes?$skip=500

//const fs = require("fs")

router.get("/ltaodataservice/:transportation", async (req, res) => {
  try {
    let params=req.params;
    let transportation=params["transportation"];
    let entireListing=await asyncCall(transportation);
    
    /*
    let dataFile=path.join(__dirname, "public/data", `${transportation}.json`);

    fs.open(dataFile, "w", (err, fd) => {
        if (err) {
            throw err;
        }
        fs.writeFile(fd, JSON.stringify(entireListing), (err) => {
            if (err) throw err;
            fs.close(fd, () => {
                console.log(`Wrote ${transportation}.json successfully`);
                return res.status(200).json({ 
                  type: "success",
                  message: `Wrote ${transportation}.json successfully`
                })
            });
        });
    });*/
    return res.status(200).json(entireListing)
  } catch(err) {
    return res.status(404).json({ 
      type: "error",
      message: (err !== null && typeof err.message !== "undefined") ? err.message : `Error. Unable to retrieve data from datamall.lta.gov.sg ${transportation} Routing API.`
    })
  }
});