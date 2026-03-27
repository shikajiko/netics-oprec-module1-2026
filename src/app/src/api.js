const express = require('express')
const app = express()
const port = 3000
const start = Date.now()

function formatUptime(ms) {
    const totalSecond = Math.floor(ms / 1000);
    const hour = Math.floor(totalSecond / 3600);
    const minute = Math.floor((totalSecond % 3600) / 60);
    const second = totalSecond % 60;
    return `${hour}h ${minute}m ${second}s`;
}

app.get('/health', (req, res) => {
    const uptime = Date.now() - start;

    res.json({
        nama: "Riyan Fadli Amazzadin",
        nrp: "5025241068",
        status: "UP",
        timestamp: new Date().toISOString(),
        uptime: formatUptime(uptime)
    })
})

app.listen(port, () => {
    console.log(`API running on port ${port}`)
})