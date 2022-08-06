/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var async = require('async');

var express = require('express');
var app = express();

mongoose.connect('mongodb://localhost/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
const fs = require("fs");

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    User.find({}, function (err, users) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!request.session.user_id){
            response.status(401).send(JSON.stringify(err));
            return;
        }
        let arr = JSON.parse(JSON.stringify(users));
        var user_list = [];
        
        for (let i = 0; i < arr.length; i++) {
            let user = {};
            user._id = arr[i]._id;
            user.first_name = arr[i].first_name;
            user.last_name = arr[i].last_name;
            user_list.push(user);
        }
        response.status(200).send(user_list);
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    var id = request.params.id;

    User.find({_id: id}, function (err, users) {
        if (!request.session.user_id){
            response.status(401).send(JSON.stringify(err));
            return;
        }
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!users){
            response.status(400).send(JSON.stringify(err));
            return;
        }
        var user = JSON.parse(JSON.stringify(users[0]));

        if (user === null) {
            response.status(400).send('invalid user id');
        }
        else {
            delete user.__v;
            delete user.login_name;
            delete user.password;
            //console.log('this is the right test');
            response.status(200).send(user);
        }
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if (!request.session.user_id){
        response.status(401).send(JSON.stringify('need to login'));
            return;
        }
    var id = request.params.id;

    Photo.find({user_id: id}, function (err, photos) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!photos){
            response.status(400).send(JSON.stringify(err));
            return;
        }

        var photo_list = JSON.parse(JSON.stringify(photos));
        
        
        async.each(photo_list, function(photo, outerCallback) {
            if(err){
                response.status(400).send(JSON.stringify(photos));
                return;
            }
            var comments = photo.comments;

            async.each(comments, function(comment, innerCallback) {
                if (comments.length === 0 || !comments) {
                    response.status(400).send('invalid user id');
                    return;
                }

                User.find({_id: comment.user_id}, function (error, users) {
                    if(err){
                        response.status(400).send(JSON.stringify(error));
                        return;
                    }
                    if (!users){
                        response.status(400).send(JSON.stringify(error));
                        return;
                    }

                    //console.log((JSON.stringify(users[0])));
                    // if (!users[0]){
                    //     innerCallback();
                    //     return;
                    // }
                    var user_info = JSON.parse(JSON.stringify(users[0]));

                    // add information for user object
                    var user = {};
                    user._id = user_info._id;
                    user.first_name = user_info.first_name;
                    user.last_name = user_info.last_name;

                    // edit comment object
                    comment.user = user;
                    delete comment.user_id;
                    innerCallback();
                });
            }, function(){  // executed after all comments are filtered for a photo
                if(err){
                    response.status(400).send(JSON.stringify(err));
                    return;
                }
                delete photo.__v;
                outerCallback();
            });
        }, function(){ // executed after all photos are filtered
            if(err){
                response.status(400).send(JSON.stringify(err));
                return;
            }
            console.log(photo_list);
            photo_list.sort(function(a,b){
                if(a.likes.length > b.likes.length){
                    return -1;
                }
                if(a.likes.length < b.likes.length){
                    return 1;
                }
                return 0;
            });
            console.log(photo_list);
            response.status(200).send(JSON.stringify(photo_list));
        });
        
    });
}); 

/*
 * URL /admin/login - Login the User
 */
app.post('/admin/login', function (request, response){
    var login = request.body.login_name;
    var password = request.body.password;

    User.find({login_name: login}, function (err, users) {
        if (!users) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (users.length === 0){
            response.status(400).send(JSON.stringify(err));
            return;
        }
        var user = JSON.parse(JSON.stringify(users[0]));

        if (!user) {
            response.status(401).send('invalid username');
            return;
        }
        var user_id = user._id;

        if (password === user.password){
            request.session.user_id = user_id; 

            response.status(200).send(user);
        }
        else if (password !== user.password){
            response.status(400).send('wrong password');
        }
    });
});

/*
 * URL /admin/logout - Logout the user
 */
app.post('/admin/logout', function (request, response){
    console.log(request.session.user_id);
    
    if (!request.session.user_id){
        response.status(401).send(JSON.stringify('not logged in'));
        return;
    }
    delete request.session.user_id;
    request.session.destroy();
    response.status(200).send('logged out');
});


/*
 * URL /sessionData - access the sessionData
 */
app.get('/sessionData', function (request, response) {
    response.status(200).send(request.session);
});

/*
 * URL /commentsOfPhoto/:photo_id - add new comments to photo
 */
app.post('/commentsOfPhoto/:photo_id', function (request, response){
    if (!request.session.user_id){
        response.status(401).send('need to log in');
        return;
    }
    var newComment = request.body.newComment;
    if (newComment.length === 0){
        response.status(400).send('cannot post an empty comment');
    }

    var photo_id = request.body.photo_id;
    var user_id = request.session.user_id;
    var time = Date();

    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            console.log('cannot get photo');
            response.status(400).send(JSON.stringify(err));
        }

        if (!photo){
            response.status(400).send('no photo found');
            return;
        }

        var new_comment_obj = {};
        new_comment_obj.comment = newComment;
        new_comment_obj.date_time = time;
        new_comment_obj.user_id = user_id;

        const comments = photo.comments;
        comments.push(new_comment_obj);

        photo.save(function(){
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            response.status(200).send('new comment success');
        });
    });
});

/*
 * URL /photos/new - Add new photos
 */
app.post('/photos/new', function (request, response){

    processFormBody(request, response, function (err) {
        if (err || !request.file) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!request.session.user_id){
            response.status(400).send(JSON.stringify(err));
            return;
        }
        var loggedInUserID = request.session.user_id;
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes
        if (request.file.fieldname !== 'uploadedphoto'){
            response.status(400).send(JSON.stringify(err));
            return;
        }

        console.log('tried to add photo');

        //request.file.originalname = 
        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        const timestamp = new Date().valueOf();
        const filename = 'U' +  String(timestamp) + request.file.originalname;
    
        fs.writeFile("./images/" + filename, request.file.buffer, function () {
          // XXX - Once you have the file written into your images directory under the name
          // filename you can create the Photo object in the database
          if (err) {
            response.status(400).send('unable to write file');
            return;
          }
          Photo.create({file_name: filename, date_time: timestamp, user_id: loggedInUserID, comments:[], likes: []});
        
          response.status(200).send('new photo upload');
        });

        // check photo_list
        Photo.find({user_id: loggedInUserID}, function (err, photos) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
    
            if (!photos){
                response.status(400).send(JSON.stringify(err));
            }
        });
    });
});


/*
 * URL /user - Register new user
 */
app.post('/user', function (request, response){
    var first_name = request.body.first_name;
    var last_name = request.body.last_name;
    var username = request.body.username;
    var password = request.body.password;
    var location = request.body.location;
    var description = request.body.description;
    var occupation = request.occupation;

    if (first_name === '' || last_name === '' || username === '' || password === ''){
        console.log('do not leave field empty');
        response.status(400).send(JSON.stringify('do not leave field empty'));
        return;
    }

    User.findOne({login_name: username}, function (err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        console.log(user);
        if (user) {
            response.status(401).send('username already exists');
            return;
        }

    
        const timestamp = new Date().valueOf();
        const id = 'U' +  String(timestamp) + first_name + last_name;
    
        User.create(
            {first_name: first_name, last_name:last_name, location: location, description: description, occupation:occupation, login_name: username, password: password, _id: id});
    });
    response.status(200).send('successfully added user');
});

/*
 * URL /likePhoto - like/unlike a photo
 */
app.post('/likePhoto', function(request, response){
    var photo_id = request.body.photo_id;
    var user_id = request.session.user_id;
    var has_liked = request.body.has_liked;


    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            console.log('cannot get photo');
            response.status(400).send(JSON.stringify(err));
        }


        if (!photo){
            response.status(400).send('no photo found');
            return;
        }
        
        // if desired action is to like
        if (has_liked === false){
            if (!photo.likes.includes(user_id)){
                photo.likes.push(user_id);
            }
        }

        // if desired action is to unlike
        if (has_liked === true){
            if (photo.likes.includes(user_id)){
                for (let i = 0; i < photo.likes.length; i++){
                    if (photo.likes[i] === user_id){  // find and unlike
                        photo.likes.splice(i, 1);
                    }
                }
            }
        }
    
        photo.save(function(){
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        response.status(200).send(JSON.stringify());
        });
    });
});

/*
 * URL /deleteComment - delete a comment
 */
app.post('/deleteComment', function (request, response){
    var comment_id = request.body.comment_id;
    var photo_id = request.body.photo_id;

    if (comment_id === ''){
        response.status(400).send(JSON.stringify('no comment given'));
        return;
    }

    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!photo) {
            response.status(401).send('photo not found');
            return;
        }

        // search for the comment with comment_id
        for (let i = 0; i < photo.comments.length; i++){
            // remove if found
            if (JSON.stringify(photo.comments[i]._id) === JSON.stringify(comment_id)){
                photo.comments.splice(i, 1);
            }
        }

        photo.save(function(){
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            response.status(200).send('successfully liked/unliked');
        });
    });
});

/*
 * URL /deletePhoto - Delete a photo
 */
app.post('/deletePhoto', function (request, response){
    var photo_id = request.body.photo_id;

    if (photo_id === ''){
        response.status(400).send(JSON.stringify('no photo id given'));
        return;
    }

    Photo.deleteOne({_id: photo_id}, function(){
        response.status(200).send(JSON.stringify('photo deleted'));
    });

});

/*
 * URL /deleteUser - Delete a user
 */
app.post('/deleteUser', function (request, response){
    var user_id = request.body.user_id;
    
    if (user_id === ''){
        response.status(400).send(JSON.stringify('no user id given'));
        return;
    }

    Photo.find({}, function (err, photos) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }

        if (!photos){
            response.status(400).send(JSON.stringify(err));
            return;
        }

        for (let i = 0; i < photos.length; i++){

            for (let j = 0; j < photos[i].comments.length; j++){
                if (JSON.stringify(photos[i].comments[j].user_id) === JSON.stringify(user_id)){
                    photos[i].comments.splice(j, 1);
                }
            }

            for (let k = 0; k < photos[i].likes.length; k++){
                if (photos[i].likes[k] === user_id){
                    photos[i].likes.splice(k, 1);
                }
            }

            photos[i].save(function(){
                if (err) {
                    response.status(400).send(JSON.stringify(err));
                }
            });
        }
        
    });
    
    Photo.deleteMany({user_id: user_id}, function(){
        console.log('deleted user photos');
    });

    User.deleteOne({_id: user_id}, function(){
        response.status(200).send(JSON.stringify('user deleted'));
    });
});

/*
 * URL /favoritePhoto - Favorite a photo
 */
app.post('/favoritePhoto', function(request, response){
    var photo_id = request.body.photo_id;
    var user_id = request.session.user_id;
    var has_favorited = request.body.has_favorited;

    User.findOne({_id: user_id}, function (err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!user) {
            response.status(401).send('user not found');
            return;
        }

        // if desired action is to favorite
        if (has_favorited === false){
            if (!user.favorites.includes(photo_id)){
                user.favorites.push(photo_id);
            }
        }

        // if desired action is to unfavorite
        if (has_favorited === true){
            if (user.favorites.includes(photo_id)){
                for (let i = 0; i < user.favorites.length; i++){
                    if (JSON.stringify(user.favorites[i]) === JSON.stringify(photo_id)){  // find and unfavorite
                        user.favorites.splice(i, 1);
                    }
                }
            }
        }

        user.save(function(){
            if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
            }
            response.status(200).send(JSON.stringify('favorited/ unfavorited'));
            });
    });

});

/*
 * URL /getFavoritePhotosOfUser/:id - Get a user's favorite photos
 */
app.get('/getFavoritePhotosOfUser/:id', function (request, response) {
    if (!request.session.user_id){
        response.status(401).send(JSON.stringify('need to login'));
            return;
        }
    var user_id = request.params.id;

    User.findOne({_id: user_id}, function (err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (!user) {
            response.status(401).send('user not found');
            return;
        }

        var favorites = user.favorites;
        var photo_list = [];

        async.each(favorites, function(photo_id, callback){
            if(err){
                response.status(400).send(JSON.stringify('error'));
                return;
            }

            Photo.findOne({_id: photo_id}, function(err, photo){
                if(err){
                    response.status(400).send(JSON.stringify('photo not found'));
                    return;
                }
                photo_list.push(photo);
                callback();
            });
        }, function(){ // executed after all photos are filtered
            if(err){
                response.status(400).send(JSON.stringify(err));
                return;
            }
            console.log(photo_list);
            response.status(200).send(JSON.stringify(photo_list));
        });
    });

}); 



var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});