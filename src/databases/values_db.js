import config from "../config/config.js"
import { Point } from "@influxdata/influxdb-client";
import { InfluxDB } from "@influxdata/influxdb-client";
import {influx_write, influx_read} from "../routes/metricRoute.js";
import buildQuery from "../middleware/query-builder.js"


class values_db {
    // Constructor for the influx class
    constructor() {
        this.token = `${config.values_db.token}`;
        this.org = `${config.values_db.organization}`;
        this.bucket = `${config.values_db.bucket}`;
        this.connector();        
    }

    connector() {
        console.log("Connecting to the influxDB: " + this.org);
        this.client = new InfluxDB({url: `${config.values_db.baseURL}`, token: this.token});
        this.queryApi = this.client.getQueryApi(this.org);
        console.log("Connection to the InfluxDB was succesful!")
    }

    async writeData(data) {
        const writeApi = this.client.getWriteApi(this.org, this.bucket)
        writeApi.useDefaultTags({host: data.data.device_id })

        // Array to save datapoints to
        let points = []

        // Writing the general data
        points.push(new Point("general")
        .stringField("device_id", data.data.device_id)
        .floatField("count", data.data.count))

        // Writing the voltage values
        points.push(new Point('sensors')
        .tag("voltage", "battery")
        .floatField("status", data.data.sensors.voltage.battery.status)
        .floatField("value", data.data.sensors.voltage.battery.value))

        // Writing the light values
        points.push(new Point('sensors')
        .tag("type", "light")
        .floatField("status", data.data.sensors.light.status)
        .floatField("value", data.data.sensors.light.value))

        // Writing the moisture levels
        points.push(new Point('sensors')
        .tag("moisture", "level1")
        .floatField("status", data.data.sensors.moisture.level1.status)
        .floatField("value", data.data.sensors.moisture.level1.value))

        points.push(new Point('sensors')
        .tag("moisture", "level2")
        .floatField("status", data.data.sensors.moisture.level2.status)
        .floatField("value", data.data.sensors.moisture.level2.value))

        points.push(new Point('sensors')
        .tag("moisture", "level3")
        .floatField("status", data.data.sensors.moisture.level3.status)
        .floatField("value", data.data.sensors.moisture.level3.value))

        points.push(new Point('sensors')
        .tag("moisture", "level4")
        .floatField("status", data.data.sensors.moisture.level4.status)
        .floatField("value", data.data.sensors.moisture.level4.value))

        // Writing the temperature values
        points.push(new Point('sensors')
        .tag("temperature", "air")
        .floatField("status", data.data.sensors.temperature.air.status)
        .floatField("value", data.data.sensors.temperature.air.value))

        points.push(new Point("sensors")
        .tag("temperature", "ground")
        .floatField("status", data.data.sensors.temperature.ground.status)
        .floatField("value", data.data.sensors.temperature.ground.value))

        // Writing the meta data
        points.push(new Point("meta")
        .floatField("gateway_cnt", data.data.meta.gateway_cnt)
        .floatField("strongest_rssi", data.data.meta.strongest_rssi)
        .stringField("strongest_gateway", data.data.sensors.strongest_gateway))

        // Writing the points to the DB and checking for errors
        writeApi.writePoints(points)
        writeApi
            .close()
            .then(() => {
              
                console.log('FINISHED')
                //for metrics
                influx_write.inc();
            })
            .catch(e => {
                console.log('\\nFinished ERROR')
                console.error(e)
            })
    }

    async readData(id,defaultTime) {
        // For metrics
        influx_read.inc();

        // Executing the query in the rows function
        return this.getValuesByTime(id, defaultTime)
    }

    async getFluxResult(fluxQuery) {
      // Executing the flux query
      const getRows = (query) => {
        return new Promise((resolve, reject) => {
          let rows = []
          this.queryApi.queryRows(query, {
            next(row, tableMeta) {
              rows.push(tableMeta.toObject(row))
            },
            error(err) {
              reject(err)
            },
            complete() {
              resolve(rows)
            }
          })
        })
      }
      return (await getRows(fluxQuery))
    }

    async getLastSent(IDs, defaultTime) {
      // Query for getting the last data every day last 7 days
      let results = []
      for (let i = 0; i < IDs.length; i++) {
        const fluxQuery = new buildQuery(IDs[i], defaultTime, true).buildQuery();
        results.push((await this.getFluxResult(fluxQuery)));
      }
      return this.formatResult(results.map(d => d[0]).filter(v => v !== undefined));
    }

    async getValuesByTime(id, defaultTime) {
      // Setting up the flux query
      const fluxQuery = new buildQuery(id, defaultTime, false).buildQuery();

      // Executing the Flux request using the Rows functions
      const result = await this.getFluxResult(fluxQuery)

      // Reformatting the data from influx into a different JSON object for more easy access in frontend
      return this.formatResult(result);
    }

    formatResult(result) {
      return result.map(d => d = {
        "host": `${d.host}`,
        "time": `${d._time}`,
          "moisture": [
              {
                "value": `${d._value_mLevel1}`,
                "height": "level 1"
              },
              {
                "value": `${d._value_mLevel2}`,
                "height": "level 2"
              },
              {
                "value": `${d._value_mLevel3}`,
                "height": "level 3"
              },
              {
                "value": `${d._value_mLevel4}`,
                "height": "level 4"
              }
            ],
          "temperature": {
              "air": `${d._value_tAir}`,
              "ground": `${d._value_tGround}`
            },
          "light": `${d._value_light}`,
          "battery_voltage": `${d._value_battVoltage}`
      });
    }
}

export default values_db;