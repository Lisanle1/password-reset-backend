const express=require('express');
const dotenv=require('dotenv');
const cors=require('cors');
const mongo = require("./connect");
const registerRouter=require('./router/registerRouter');
port=process.env.PORT || 3001;

const app=express();
dotenv.config();
mongo.connect(); 


//--------------------------------------------------------------------------

app.use(cors({origin:"*",credentials:true}));
app.use(express.json());

//--------------------------------------------------------------------------

app.get('/',(req,res)=>{
    res.send("Hello welcome to password reset API.....")
});

app.use('/api',registerRouter);



app.listen(port,()=>{
    console.log(`server is listening on the port: ${port}`);
})