const express = require('express')
const app = express()
const port = 3000
const start = Date.now()


app.get('/health', (req, res) => {
    const uptime = Date.now() - start;

    res.json({
        nama: "Riyan Fadli Amazzadin",
        nrp: "5025241068",
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: uptime
    })
})

app.listen(port, () => {
    console.log(`API running on port ${port}`)
})