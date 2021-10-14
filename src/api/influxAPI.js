const {InfluxDB} = require('@influxdata/influxdb-client')

const client = new InfluxDB({url: 'http://localhost:8086', token: this.token})

class influxAPI {
    // Constructor for the influx class
    constructor() {
        this.token = 'EvJBXGU1Jq1Qxh1djvZjysI8sInszlMY2fjwLSYfHdNhxt3o9Cpmd05qiNs3RLnL4QmKlQUWhVHq5SFMQ2eD9w=='
        this.org = 'projectwerk-2021-pulu'
        this.bucket = 'kokosnoothoofd'
    }

    async connector() {
        console.log("Connecting to the influxDB: " + this.org);
        return this.client.connect();
    }

    async writeData() {
        await this.connector();
        const {Point} = require('@influxdata/influxdb-client')
        const writeApi = client.getWriteApi(org, bucket)
        writeApi.useDefaultTags({host: 'host1'})

        const point = new Point('mem')
        .floatField('used_percent', 23.43234543)
        writeApi.writePoint(point)
        writeApi
            .close()
            .then(() => {
                console.log('FINISHED')
            })
            .catch(e => {
                console.error(e)
                console.log('\\nFinished ERROR')
            })
    }

    async readData() {
        await this.connector();
        const getRows = (query) => {
            return new Promise((resolve, reject) => {
              let rows = []
              queryApi.queryRows(query, {
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
    }
    
}

module.exports = influxAPI;