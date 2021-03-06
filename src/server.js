// IMPORTS
import config from "./config/config.js";
import express from "express";
import cors from "cors";
import http from "http";
import values_db from "./databases/values_db.js"
import WSS from "./modules/websocket.js";
import DeviceRoute from "./routes/deviceRoute.js";
import UserRoute from "./routes/userRoute.js";
import {MetricRoute} from "./routes/metricRoute.js"


import { validate } from "jsonschema";
import { DataChecker } from "./validation/DataChecker.js";
import { TTN } from "./api/ttn.js";
import errorHandlerMiddleware from "./middleware/error-handler.js";


const app = express()
app.use(express.json())
app.use(cors())
const server = http.createServer(app)

let recentLiveData = {}
const wss = new WSS(server, recentLiveData)



app.get('/', (req, res) => {

  res.send(`<h1>Connected to Pulu Backend</h1>
            <p> Go to /livedata to see most recent device data</p>`)
})

// Influx
// Connecting to the Influx client
let api2 = new values_db();


app.get('/livedata', (req, res) => {
  res.status(201).send(recentLiveData)
  // api2.readData().then(result => res.status(200).send(result));
})


app.post('/livedata', (req, res) => {
  // Receiving the data from the device
  const data = req.body

  // JSON validation of the received data to check before writing
  const validation = validate(data, DataChecker.create)
  if (!validation.valid) {
    console.log("The JSON validator gave an error: ", validation.errors)
    res.status(400).send({
      message: 'JSON validation failed',
      details: validation.errors.map(e => e.stack)
    })
    return;
  }

  // Writing the data to the database
  api2.writeData(data)
  .then(res.status(201))
  .catch(e => console.error(e))

  // Making sure new connections always have some data
  recentLiveData = data
  wss.webSocketSend(data)
  res.status(201).json(recentLiveData)
})

app.post('/ttn-device-manager', (req, res) => {
  let credentials = undefined
  console.log(req.body)
  TTN.registerDevice(req.body)
  .then((ttnRes) => {
    console.log(ttnRes.data)
    credentials = ttnRes.data
    res.status(201).json(credentials)
  })
  .catch((err) => {
    console.log(err)
    res.status(400).json({"message": "failed to fetch credentials from ttn"})
  })
})

app.delete('/ttn-device-manager/:id', (req, res) => {
  TTN.removeDevice(req.params.id)
  .then((ttnRes) => {
    console.log(ttnRes.data)
    res.status(200).json({"message": "Device removed from TTN"})
  })
  .catch((err) => {
    console.log(err)
    res.status(400).json({"message": "failed to remove device from ttn"})
  })
})


// Mongo
// Accounts
app.get('/users', UserRoute.list);
app.get('/users/amount', UserRoute.get_amount);
app.post('/users/login', UserRoute.login);
app.post('/users', UserRoute.post);
app.delete('/users', UserRoute.delete);

// Sensors
app.get('/sensors', DeviceRoute.list);
app.get('/sensors/:id', DeviceRoute.get);
app.post('/sensors', DeviceRoute.post);
app.delete('/sensors/:id', DeviceRoute.delete); 
app.put('/sensors/:id', DeviceRoute.put); // TODO change to REST

// Members
app.get('/members',DeviceRoute.members);

// Metrics
app.get('/metrics', MetricRoute.get);

// handle errors middleware
app.use(errorHandlerMiddleware)

// Server
server.listen(config.server.port, () => {
  console.log(`Listening on port ${config.server.port}`)
})
