const functions = require('firebase-functions');

const admin = require("firebase-admin");
const cors = require('cors')
const express = require('express')
const serviceAccount = require("./permissions.json");
const firebase = require('firebase');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://auto247remediesdev.firebaseio.com"
});
const firebaseConfig = require('./config')
firebase.initializeApp(firebaseConfig.firebaseConfig)
const app = express()
app.use(cors({origin:true}))
const db = admin.firestore();
const auth = admin.auth();
app.post('/register', (request,response)=>{
    (async()=>{
        try{
            const email = request.body.email
            const firstname = request.body.firstname
            const lastname = request.body.lastname
            const password = request.body.password
            const role = request.body.role
            if(email === '' || firstname === '' || lastname === '' || lastname === undefined || password === '' || email === undefined || firstname === undefined || password === undefined || role === undefined || role ==='')
                return response.status(401).json({
                    message:'invalid inputs. email, password, first name, last name and role are required',
                    status:'input error',
                    statusCode:401
                })
            if(password.length < 6)
            return response.status(402).json({
                message:'password character must be greater than 6',
                status:'password length',
                statusCode:402
            })
            const user = await auth.createUser({
                email,
                password,
                displayName:firstname
            })
            await  db.collection('users').doc(user.uid).set({firstname,lastname,email,role})
            const userData = await auth.getUser(user.uid);
            let userMetaData = await db.collection('users').doc(user.uid).get();
            userMetaData =  userMetaData.data();
            return response.status(200).json({
                message:'created successfully',
                statusCode:200,
                status:'success',
                data:{
                    id:userData.uid,
                    email:userData.email,
                    firstname:userMetaData.firstname,
                    lastname:userMetaData.lastname,
                    role:userMetaData.role
                }
            })
        }
        catch(err){
            if(err.code === 'auth/email-already-exists')
            return response.status(403).json({status:'invalid',statusCode:403,message:'Email already exists.'})
            return response.status(500).json({status:'internal server error',statusCode:500,message:'failed.'})
        }
    })()
})
app.get('/user/:id', (request, response)=>{
    (async()=>{
        try{
            if(request.params.id === '' || request.params.id === undefined)
                return response.status(403).json({
                    status:'invalid',
                    statusCode:403,
                    message:'user ID is required'
                })
           let user = await db.collection('users').doc(request.params.id).get()
            user = user.data();
            if(!user)
            return response.status(404).json({status:'Not found',statusCode:404,message:'User does not exist.'})

            return response.status(200).json({
                statusCode:200,
                status:'success',
                message:'successfully',
                data:{
                    id:user.id,
                    email:user.email,
                    firstname:user.firstname,
                    lastname:user.lastname,
                    role:user.role
                }
            })
        }
        catch(err){
            return response.status(500).json({status:'internal server error',statusCode:500,message:'failed.'})
        }
    })()
})
app.post('/login', (request , response)=>{
    (async()=>{
        try{
            const {email, password} = request.body;
            if(email === '' || email === undefined || password === '' || password === undefined)
            return response.status(401).json({
                message:'invalid inputs. email and password are required',
                status:'input error',
                statusCode:401
            })
          const user =  await firebase.auth().signInWithEmailAndPassword(email, password)
          let userData = await db.collection('users').doc(user.user.uid).get()
          userData = userData.data();
          return response.status(200).json({
              message:'successfully logged in',
              status:'success',
              statusCode:200,
              data:{
                  id:user.user.uid,
                  email:userData.email,
                  firstname:userData.firstname,
                  lastname:userData.lastname,
                  role:userData.role
              }
          })
        }
        catch(err){
            return response.status(500).json({status:'internal server error',statusCode:500,message:'failed.'})
        }
    })()
})
exports.api = functions.https.onRequest(app)


