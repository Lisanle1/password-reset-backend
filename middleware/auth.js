const jwt = require ('jsonwebtoken');

// Authentication
exports.authenticateUser =async(req,res,next)=>{
    // Check whether access token exists in headers
    const token =req.headers.accesstoken;
    if(!token){
        return res.send({
            statusCode:400,
            message:"Token not found"
        });
    }
    // Verify Token
        try{
            const user=await jwt.verify(token, process.env.SECRET_KEY)
            req.body.currentuser=user;
            next();
        }
        catch {
            res.send({
                statusCode:401,
                message:"Unauthorised"
            })
        }
    }
