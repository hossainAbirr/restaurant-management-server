const express = require('express');
const cors = require('cors');
const app = express();
const port =process.env.PORT || 2500;

// middlwares
app.use(express.json())
app.use(cors())

app.get('/', (req, res) =>{
    res.send('Restaurant management server is running')
})

app.listen(port, () =>{
    console.log(`Restaurant management is runnning on: ${port}`);
})