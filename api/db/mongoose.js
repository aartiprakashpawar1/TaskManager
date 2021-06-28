// to handle all the connection  logic to the mongodb


const mongoose = require('mongoose');
 mongoose.Promise = global.Promise;
 
 mongoose.connect('mongodb://localhost:27017/TaskManager', {useNewUrlParser : true}).then(() => {
 console.log("connected to mongodb successfully :");
 }).catch((e) => {
     console.log("error while attempting to connect Mongodb")
     console.log(e);
 })

module.exports ={
    mongoose
}