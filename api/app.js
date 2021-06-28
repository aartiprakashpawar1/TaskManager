const express = require('express');

const app = express();

const {mongoose} = require('./db/mongoose')
const bodyParser = require('body-parser');
//load mongoose models
 const { List,Task,User} = require('./db/models')
  const jwt = require('jsonwebtoken')
// load middleware
app.use(bodyParser.json());





// CORS HEADERS MIDDLEWARE
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});



//check whether the request has a valid jwt access token
let authenticate = (req,res,next) =>{
 let token = req.header('x-access-token')
 // verify jwt 
 jwt.verify(token, User.getJWTSecret(), (err,decoded) =>{
   
if(err){
    res.status(401).send(err);
}
else {
    req.user_id = decoded._id;
    next();

}
 })

}



// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
// grab the refresh token from the request header
let refreshToken = req.header('x-refresh-token');

// grab the _id from the request header
let _id = req.header('_id');

User.findByIdAndToken(_id, refreshToken).then((user) => {
if (!user) {
    // user couldn't be found
    return Promise.reject({
        'error': 'User not found. Make sure that the refresh token and user id are correct'
    });
}


// if the code reaches here - the user was found
// therefore the refresh token exists in the database - but we still have to check if it has expired or not

req.user_id = user._id;
req.userObject = user;
req.refreshToken = refreshToken;

let isSessionValid = false;

user.sessions.forEach((session) => {
    if (session.token === refreshToken) {
        // check if the session has expired
        if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
            // refresh token has not expired
            isSessionValid = true;
        }
    }
});

if (isSessionValid) {
    // the session is VALID - call next() to continue with processing this web request
    next();
} else {
    // the session is not valid
    return Promise.reject({
        'error': 'Refresh token has expired or the session is invalid'
    })
}

}).catch((e) => {
res.status(401).send(e);
})
}



//app.use(cors());
///cors   headers middleware
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD"); // update to match the domain you will make the request from
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
//   });



  

const { JsonWebTokenError } = require('jsonwebtoken');



app.get('/',(req,res) =>{
    res.send("hello world")
})
/*route handler */

/* list routes */
 /*
 *get/ lists 
* purpose: get all lists
  */
app.get('/lists' , authenticate ,(req,res) => {
  // we wannt to return an array of all the list that belong to the authenticate user
  List.find({
 _userId: req.user_id
  }).then((lists) => {
      res.send(lists);
  }).catch((e) => {
      res.send(e);
  })
})

 /*
 *post/ lists 
* purpose: create a lists
  */
app.post('/lists',authenticate, (req,res) =>{
    //we want to create a new list and return the new list document back  to the user (which inclules the id)
// the list information (feilds) will be passed in via the json request body 
let  title = req.body.title;

let newList = new List({
          title,
         _userId: req.user_id
    });
    newList.save().then((listDoc) =>{
        //the full list document is requred (inc . id)
        res.send(listDoc);
    })

})

 /*
 *path  /lists/:id 
* purpose: update a specified list 
  */

app.patch('/lists/:id',authenticate,(req,res) =>{
    //we want to update the specified list (list document with id in the url) with the new values specified in the json json body of the request
        List.findOneAndUpdate({_id:req.params.id , _userId: req.user_id},{
            $set:req.body
        }).then(() => {
            res.send({ 'message':'updated Successfully'});
        })


})

 /*
 *delete   lists/:id
* purpose: delete a list
  */

app.delete('/lists/:id',authenticate,(req,res) =>{
    //we want to delete the specified list (document with id in the url)
    List.findOneAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedListDoc) =>{
        res.send(removedListDoc);
//delete all the list  
        deleteTasksFormList(removedListDoc._id)

    })
})


/*
get /lists/:listId/tasks
purpose get all task in a specific list
 */
app.get('/lists/:listId/tasks',authenticate, (req,res) =>{
    // we want to return all tasks that belong to a specific list by listId)
Task.find({
    _listId: req.params.listId,
  
}).then((tasks) =>{
    res.send(tasks);
})
})

 //we can get a same lidtid as well as same taskid


// app.get('/lists/:listId/tasks/:taskId',(req,res) =>{
//     Task.findOne({
//         _id: req.params.taskId,
//         _listId: req.params.listId
//     }).then((task) =>{
//         res.send(task);
//     })
// })

/**
 * post /lists/:listId/tasks
 * purpose  : create a new task in a list specified by listId
 */
app.post('/lists/:listId/tasks',authenticate, (req,res) =>{
 // we want to create a new task in a list specified by listId

List.findOne({
    _id:req.params.listId,
    _userId: req.user_id
}).then((list) =>{
    if(list){
        //list obj valid ( specified conditions is valid)
        //therefore currently authenticate user can create new tasks
        return true
    }
    // list obj undefind
    return false;
}).then((canCreateTask)  => {
   if (canCreateTask){
    let newTask = new Task({
        title: req.body.title,
        _listId : req.params.listId
    })
    newTask.save().then((newTaskDoc) =>{
     res.send(newTaskDoc);
    })
   } else {
       res.sendStatus(404);
   }
})

    
})

/**
 * patch   /lists/:listId/tasks/:taskId
 *  purpose : update an existing task
 */ 
app.patch('/lists/:listId/tasks/:taskId',authenticate,(req,res) =>{
    //we want to upate an existing task (specified by taskid)

List.findOne({
    _id:req.params.listId,
    _userId:req.user_id
}).then((list) =>{
    if(list){
   //     list obj specified condtions was found
   // there 4 currently authenticated user can make update  to tasks with in the list 
        return true
    }
    return false
}).then((canUpdateTasks) => {
 
    if(canUpdateTasks){
        //currently authenticate user and update task
        Task.findOneAndUpdate({
            _id : req.params.taskId,
            _listId : req.params.listId},
            {
                    $set: req.body
            }).then(() =>{
                res.send({message : 'Updated Successfully'});
            })
          } else {
              res.sendStatus(404)
          }

        })

   
    })


/**
 * delete  /lists/:listId/tasks/:taskId
 * purpose : delete a task
 */

 app.delete('/lists/:listId/tasks/:taskId', authenticate,(req,res) =>{

    List.findOne({
        _id:req.params.listId,
        _userId:req.user_id
    }).then((list) =>{
    if(list){
    return true;
        }
    return false;
    }).then((canDeleteTasks) =>{
        if(canDeleteTasks){
            Task.findOneAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removedTaskDoc) =>{
                res.send(removedTaskDoc)
            })
        } else{
            res.sendStatus(404)
        }
    })
      
 })




/* USER ROUTES */

/**
 * POST /users
 * Purpose: Sign up
 */
app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we geneate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})

 /**
 * POST /users/login
 * Purpose: Login
 */
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session created successfully - refreshToken returned.
            // now we geneate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                // access auth token generated successfully, now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})


/**
 * get   /users/me/access-token
 *  purpose : generates and returns an access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
 
// we know the user authenticated and we have user id and user obj is avail to us
 req.userObject.generateAccessAuthToken().then((accessToken) =>{
     res.header('x-access-token', accessToken).send({ accessToken})
 }).catch((e) =>   {
             res.status(400).send(e);
     } )
 })



 /**
  * helper msg
  */
 let deleteTasksFormList = (_listId) => {
Task.deleteMany({
    _listId 
}).then(() =>{
    console.log("Tasts form" + _listId  +'were deleted !')
})
 }

app.listen(3000, () =>  {
    console.log("server is listening on 3000");

} )
