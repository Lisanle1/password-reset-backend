const mongo = require("../connect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const CLIENT_URL ="https://spiffy-pegasus-24fc7c.netlify.app"
exports.signup = async (req, res, next) => {
  //Email id validation
  try {
    const existUser = await mongo.selectedDb
      .collection("users") 
      .findOne({ email: req.body.email });
    if (existUser) {
      return res.send({
        statusCode: 400,
        msg: "You are already a registered user", 
      });
    }

    //conform password checking
    const isSamePassword = checkPassword(
      req.body.password,
      req.body.confirmPassword
    );
    if (!isSamePassword) {
      return res.send({
        statusCode: 400,
        msg: "password doesn't match",
      });
    } else {
      delete req.body.confirmPassword;
    }
    // password Hashing and also return promise
    const ramdomString = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(req.body.password, ramdomString);

    //save in db
    await mongo.selectedDb.collection("users").insertOne({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
      resetLink: "",
    });
    res.send({
      statusCode: 200,
      msg: "Account Created Successfully",
    });
  } catch {
    res.send({
      statusCode: 500,
      msg: "Internal server error",
    });
  }
};
const checkPassword = (password, confirmPassword) => {
  return password !== confirmPassword ? false : true;
};

exports.signin = async (req, res, next) => {
  try {
    const existUser = await mongo.selectedDb
      .collection("users")
      .findOne({ email: req.body.email });
    if (!existUser) {
      return res.send({
        statusCode: 400,
        msg: "User doesn't exists please! signup.",
      });
    }

    //password: Incorrect password
    const isSamePassword = await bcrypt.compare(
      req.body.password,
      existUser.password
    );
    if (!isSamePassword) {
      return res.send({
        statusCode: 400,
        msg: "Incorrect Password",
      });
    }
    // Generate and send token as a response and token is an encrypted form of existing user
    const token = jwt.sign(existUser, process.env.SECRET_KEY, {
      expiresIn: "1hr",
    });
    res.send(token);
  } catch {
    res.send({
      statusCode: 500,
      msg: "Internal server error",
    });
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const existUser = await mongo.selectedDb
      .collection("users")
      .findOne({ email: req.body.email });
    if (!existUser) {
      return res.send({
        statusCode: 400,
        msg: "User with this email I'd doesn't exists.",
      });
    }
    //create token
    const token = jwt.sign(
      { _id: existUser._id },
      process.env.RESET_PASSWORD_KEY,
      { expiresIn: "10m" }
    );
    const URL=`${CLIENT_URL}/resetpassword/${token}`
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ACC_EMAIL,
        pass: process.env.ACC_PASS,
      },
    });
    const mailOptions = {
      from: process.env.ACC_EMAIL,
      to: req.body.email,
      subject: "Password reset mail",
     
      html:` Hi ${existUser.name},<br/><br/>  
      <span>Forgot your password?</span><br/>
      <span>we received a request to reset the password for your account.</span><br/><br/>
      <span>To reset your password, click on the button below:<span/><br/>
      <a href=${URL} target='_blank'><Button style=" background-color:#00A2ED; width:11em; color:white; padding:10px; outline: none; border-radius:12px; border:none; margin-top:5px; " >Reset password</Button></a><br/><br/>
    <div><br/><br/>
        <h6>
          Or copy and paste the URL into your browser:         
        </h6>
        <p>${URL}</p>
    
    </div>
`,
    };

    //set reset link in db
    await mongo.selectedDb
      .collection("users")
      .updateOne({ email: req.body.email }, { $set: { resetLink: token } });
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        res.send(err);
      } else {
        res.send({
         statusCode:200,
          msg:"Email has been sent successfully!"
      });
    }
    });
  } catch {
    res.send({
      statusCode: 500,
      msg: "Internal server error",
    });
  }
};

exports.resetPassword = async (req, res, next) => {
    
      const token = req.params.id;
    //decrypt the token
     jwt.verify(token, process.env.RESET_PASSWORD_KEY,async (err, decodedData) => {
    if (err) {
      return res.send({
        statusCode: 400,
        msg: "Invalid token",
      });
    }

    //to check reset link is exist or not
    const existUser = await mongo.selectedDb.collection("users").findOne({ resetLink: token });
    if (!existUser) {
      return res.send({
        statusCode: 400,
        msg: "Link is expired",
      });
    }
    // to check newPassword and confirmPassword are matches or not.
    const isSamePassword = checkPass(
      req.body.newPassword,
      req.body.confirmPassword
    );
    if (!isSamePassword) {
      return res.send({
        statusCode: 400,
        msg: "password doesn't match",
      });
    } else {
      delete req.body.confirmPassword; // delete the confirmPassword
    }

    //to compare the new password and old password are same or not.
    const existPassword = await bcrypt.compare(req.body.newPassword,existUser.password);
    if (existPassword) {
      return res.send({
        statusCode: 400,
        msg: "New password same as old password",
      });
    }
    try {
    //password hashed
    const randomString = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword,randomString);

    // save in db and empty the resetLink for no longer to access it again.
    await mongo.selectedDb
      .collection("users")
      .updateOne(
        { resetLink: token },
        { $set: { password: hashedPassword, resetLink: "" } }
      );
    return res.send({
      statusCode: 200,
      msg: "Password changed successfully!", 
    });
  } catch{
    res.send({
      statusCode: 500,
      msg:"internal server error",
    });
    
  }
})
};
const checkPass = (newPassword, confirmPassword) => {
  return newPassword !== confirmPassword ? false : true;
};

