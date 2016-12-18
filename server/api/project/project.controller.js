/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/projects              ->  index
 * POST    /api/projects              ->  create
 * GET     /api/projects/:id          ->  show
 * PUT     /api/projects/:id          ->  upsert
 * PATCH   /api/projects/:id          ->  patch
 * DELETE  /api/projects/:id          ->  destroy
 */

'use strict';

import jsonpatch from 'fast-json-patch';
import Project from './project.model';
import User from '../user/user.model';
import AWS from 'aws-sdk';
import fs from 'fs';

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if(entity) {
      return res.status(statusCode).json(entity);
    }
    return null;
  };
}

function patchUpdates(patches) {
  return function(entity) {
    try {
      jsonpatch.apply(entity, patches, /*validate*/ true);
    } catch(err) {
      return Promise.reject(err);
    }

    return entity.save();
  };
}

function removeEntity(res) {
  return function(entity) {
    if(entity) {
      return entity.remove()
        .then(() => {
          res.status(204).end();
        });
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if(!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Projects
export function index(req, res) {
  return Project.Project.find().populate('type').exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a list of My Projects
export function myProjects(req, res) {
  return Project.Project.find({builder:req.params.id}).populate('type').exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a single Project from the DB
export function show(req, res) {
  return Project.Project.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a new Project in the DB
export function create(req, res) {
  var body = req.body.data;
  var total = body.type.rps.base + body.type.rps.devCharges + body.type.rps.others;
  body.type.rps.total = total;
  var imagesInt = body.imagesInt;  
  var imagesExt = body.imagesExt;
  if(body.type.type==1)
    delete body.type['bSize'];
  else if(body.type.type==2)
    delete body.type['lSize'];
  
  console.log(body);
  return Project.ProjectType.create(body.type)
    .then(function(projectType){
      body.type = projectType._id;
      body.builder = req.user._id;
      var newProject = new Project.Project(body);

      newProject.images = [
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_1.jpg',
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_2.jpg',
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_1.jpg',
        'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_2.jpg'
      ];
      newProject.brochure = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/brochure/'+newProject._id+'.jpg';
      newProject.offerPic = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/offer/'+newProject._id+'.jpg';
      
      newProject.save()
      .then(respondWithResult(res, 201))
      .catch(handleError(res));
    })
    .catch(handleError(res));
  // return Project.Project.create(req.body)
  //   .then(respondWithResult(res, 201))
  //   .catch(handleError(res));
}
var addjson = function(i, prj, res){
  User.find({email:prj[i].mailId.toLowerCase()}).exec()
  .then(user => {
    if(!user.length){
      var newUser = new User({
        name: prj[i].Builder_Name,
        password: 'nesthunt',
        role: 'builder',
        email: prj[i].mailId,
        phone: prj[i].phone,
        provider: 'local'
      })
      newUser.save().then(user=>{
        var budget = prj[i].budget.split('-');
        if(budget.length==1)
          budget.push(budget[0]);
        var status;
        var type = 2;
        if(prj[i].progress=="Completed")
          status = 0;
        else if(prj[i].progress=="Under Construction")
          status = 1;
        else if(prj[i].progress=="Vacant land")
        {
          type=1;
          status = 0;
        }
        var body = {
          name: prj[i].name,
          location:{name:prj[i].locationName, lat:prj[i].lat, lng:prj[i].lng},
          type:{type:type, 
            rps:{base:prj[i].base, devCharges:0,others:0, total:prj[i].base}, 
            budget:{min:budget[0]*100000,max:budget[1]*100000}, 
            nUnits:prj[i].nUnits,
            nUnsold:prj[i].nUnsold
          },
          techBy: prj[i].techBy,
          legalBy:prj[i].legalBy,
          mailId:prj[i].mailId,
          budget:user._id,
          status:status
        }
        var size;
        if(prj[i]['Number of 1 BHKunits']!='NA'){
          size = prj[i]['Number of 1 BHKunits'].split('(')[1].split('-');
          if(size[1])
            size[1] = size[1].split(' ')[0];
          else{
            size[0] = size[0].split(' ')[0];
            size[1] = size[0];
          }
        }
        else if(prj[i]['Number of  2 BHKunits']!='NA'){
          size = prj[i]['Number of  2 BHKunits'].split('(')[1].split('-');
          if(size[1])
            size[1] = size[1].split(' ')[0];
          else{
            size[0] = size[0].split(' ')[0];
            size[1] = size[0];
          }
        }
        else if(prj[i]['Number of 3 BHKunits']!='NA'){
          size = prj[i]['Number of 3 BHKunits'].split('(')[1].split('-');
          if(size[1])
            size[1] = size[1].split(' ')[0];
          else{
            size[0] = size[0].split(' ')[0];
            size[1] = size[0];
          }
        }
        console.log(size, i);
        if(type==1)
          body.type.lSize = {min:size[0], max:size[1]};
        else
          body.type.bSize = {min:size[0], max:size[1]};

        Project.ProjectType.create(body.type)
          .then(function(projectType){
            body.type = projectType._id;
            var newProject = new Project.Project(body);

            newProject.images = [
              'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_1.jpg',
              'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_2.jpg',
              'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_1.jpg',
              'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_2.jpg'
            ];
            newProject.brochure = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/brochure/'+newProject._id+'.jpg';
            newProject.offerPic = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/offer/'+newProject._id+'.jpg';
            
            newProject.save()
            .then(project=>{
              console.log('projectSave: '+i, 'User New');
              if((i+1)<prj.length)
                addjson(i+1, prj, res);
            })
            .catch(handleError(res));
          })
          .catch(handleError(res));
        
      })
    }
    else{
      var budget = prj[i].budget.split('-');
      if(budget.length==1)
        budget.push(budget[0]);
      var status;
      var type = 2;
      if(prj[i].progress=="Completed")
        status = 0;
      else if(prj[i].progress=="Under Construction")
        status = 1;
      else if(prj[i].progress=="Vacant land")
      {
        type=1;
        status = 0;
      }
      var body = {
        name: prj[i].name,
        location:{name:prj[i].locationName, lat:prj[i].lat, lng:prj[i].lng},
        type:{type:type, rps:{base:prj[i].base, devCharges:0,others:0, total:prj[i].base}, budget:{min:budget[0],max:budget[1]}, nUnits:prj[i].nUnits,nUnsold:prj[i].nUnsold},
        techBy: prj[i].techBy,
        legalBy:prj[i].legalBy,
        mailId:prj[i].mailId,
        budget:user._id,
        status:status
      }

        var size;
        if(prj[i]['Number of 1 BHKunits']!='NA'){
          size = prj[i]['Number of 1 BHKunits'].split('(')[1].split('-');
          if(size[1])
            size[1] = size[1].split(' ')[0];
          else{
            size[0] = size[0].split(' ')[0];
            size[1] = size[0];
          }
        }
        else if(prj[i]['Number of  2 BHKunits']!='NA'){
          size = prj[i]['Number of  2 BHKunits'].split('(')[1].split('-');
          if(size[1])
            size[1] = size[1].split(' ')[0];
          else{
            size[0] = size[0].split(' ')[0];
            size[1] = size[0];
          }
        }
        else if(prj[i]['Number of 3 BHKunits']!='NA'){
          size = prj[i]['Number of 3 BHKunits'].split('(')[1].split('-');
          if(size[1])
            size[1] = size[1].split(' ')[0];
          else{
            size[0] = size[0].split(' ')[0];
            size[1] = size[0];
          }
        }
        console.log(size, i);
        if(type==1)
          body.type.lSize = {min:size[0], max:size[1]};
        else
          body.type.bSize = {min:size[0], max:size[1]};

      Project.ProjectType.create(body.type)
        .then(function(projectType){
          body.type = projectType._id;
          var newProject = new Project.Project(body);

          newProject.images = [
            'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_1.jpg',
            'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesInt/'+newProject._id+'_2.jpg',
            'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_1.jpg',
            'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/imagesExt/'+newProject._id+'_2.jpg'
          ];
          newProject.brochure = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/brochure/'+newProject._id+'.jpg';
          newProject.offerPic = 'https://'+process.env.BUCKET+'.cellar.services.clever-cloud.com/offer/'+newProject._id+'.jpg';
          
          newProject.save()
          .then(project=>{
            console.log('projectSave: '+i, 'User exists');
            if((i+1)<prj.length)
                addjson(i+1, prj, res);
          })
          .catch(handleError(res));
        })
        .catch(handleError(res));
    }

  })
  
}
export function addJson(req, res) {


  addjson(0, prj, res);
}

// Upserts the given Project in the DB at the specified ID
export function upsert(req, res) {
  if(req.body._id) {
    delete req.body._id;
  }
  return Project.Project.findOneAndUpdate(req.params.id, req.body, {upsert: true, setDefaultsOnInsert: true, runValidators: true}).exec()

    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Updates an existing Project in the DB
export function patch(req, res) {
  if(req.body.data._id)
    delete req.body.data._id;

  console.log(req.body);
  return Project.Project.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(patchUpdates(req.body.data))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

export function uploadfile(req, res) {
  AWS.config.update({accessKeyId: process.env.CELLAR_ADDON_KEY_ID, secretAccessKey: process.env.CELLAR_ADDON_KEY_SECRET});
  var ep = new AWS.Endpoint(process.env.CELLAR_ADDON_HOST);
  var s3 = new AWS.S3({
   endpoint: ep, 
   signatureVersion: 'v2'
  });
  var body = fs.createReadStream(req.files.file.path);
  fs.rename(req.files.file.path,req.files.file.path+'.jpg',function(err){
    if ( err )console.log('ERROR: ' + err);

    body.path=body.path+'.jpg';
    var params = {Bucket: process.env.BUCKET, Key: req.body.key, Body: body, ACL: 'public-read'};
    var request = s3.putObject(params).on('httpUploadProgress', function(progress) {
      console.log(progress);
    }).send(function(err,data){
      console.log(err);
      if (err) return handleError(res, {message:"Unable to upload image. Try again & Check your internet!"});
      return res.send(200);
    }); 
  }) 

}

// Deletes a Project from the DB
export function destroy(req, res) {
  return Project.Project.findById(req.params.id).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}



var prj = [
    {
      "S.No": "1",
      "name": "Krishnan Nandhavanam",
      "Builder_Name": "GK Bulders",
      "locationName": "Plot No. 3, S. No. 39/1A2B Part, Krishnana Nandhavanam, Mangadu, Chennai – 600122",
      "Area": "Mangadu",
      "Pin code": "600122",
      "Contact_person": "GK Builders",
      "phone": "9444152739",
      "mailId": "gkbuilders@gmail.com",
      "nUnits": "6",
      "Sold": "3",
      "nUnsold": "3",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "6 (570-826 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "3500",
      "budget": "20-28",
      "lat": "13.04159",
      "lng": "80.104936",
      "techBy": "Anbusivam valuers",
      "legalBy": "Sangraham"
    },
    {
      "S.No": "2",
      "name": "Praneel Indira",
      "Builder_Name": "Praneel developers pvt ltd",
      "locationName": "Praneel Indira, Plot No. 21 North Part, 1st Street, Indira Nagar, Ambattur, Chennai – 600053",
      "Area": "Ambattur",
      "Pin code": "600053",
      "Contact_person": "Prasanna",
      "phone": "9789093602",
      "mailId": "Praneeldevelopers@gmail.com",
      "nUnits": "6",
      "Sold": "2",
      "nUnsold": "4",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "6 (518-853 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "3600",
      "budget": "18-30",
      "lat": "13.130363",
      "lng": "80.169139",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "3",
      "name": "Praneel Shanthi",
      "Builder_Name": "RRG Developers",
      "locationName": "Praneel Shanthi, Plot No. 16A & 16B, Venkatapuram Extension, Sukkal Street (Shanthi Street), Ambattur, Chennai – 600053",
      "Area": "Ambattur",
      "Pin code": "600053",
      "Contact_person": "Prasanna",
      "phone": "9789093602",
      "mailId": "Praneeldevelopers@gmail.com",
      "nUnits": "12",
      "Sold": "3",
      "nUnsold": "9",
      "Number of 1 BHKunits": "8 (499-874 Sq.ft)",
      "Number of  2 BHKunits": "4 (908-966 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "4600",
      "budget": "41-44",
      "lat": "13.11972",
      "lng": "80.160668",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "4",
      "name": "Praneel Prime",
      "Builder_Name": "Praneel developers pvt ltd",
      "locationName": "Door Nos. 53, 54 & 55 (A, B & C),Perumal Koil Street, Thiru Vi Ka Nagar Annexe,Thundalam, Chennai - 600077",
      "Area": "Thundalam",
      "Pin code": "600077",
      "Contact_person": "Prasanna",
      "phone": "9789093602",
      "mailId": "Praneeldevelopers@gmail.com",
      "nUnits": "18",
      "Sold": "3",
      "nUnsold": "15",
      "Number of 1 BHKunits": "11 (495-881 Sq.ft)",
      "Number of  2 BHKunits": "7 (904-1022 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "4200",
      "budget": "20-42",
      "lat": "13.04673",
      "lng": "80.141126",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "5",
      "name": "Dhakshinamoorthy flats",
      "Builder_Name": "NTM Foundation",
      "locationName": "Plot no. 102, Vijay Nagar, Rathinamangalam Village, Chengalpet Taluk,Kancheepuram District",
      "Area": "Rathinamangalam",
      "Pin code": "600048",
      "Contact_person": "Moorthy",
      "phone": "9789865185",
      "mailId": "moorthy291979@gmail.com",
      "nUnits": "6",
      "Sold": "4",
      "nUnsold": "2",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "6 (599-886 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "3500",
      "budget": "20-31",
      "lat": "12.86606",
      "lng": "80.13738",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "6",
      "name": "Harini Flats",
      "Builder_Name": "Ajantha Homes",
      "locationName": "Plot No. 39, Indra Nagar Second Street,Kattupakkam, Chennai – 600056",
      "Area": "Kattupakkam",
      "Pin code": "600056",
      "Contact_person": "T.R.Sreekanth",
      "phone": "9841164409",
      "mailId": "ajanthahomes@gmail.com",
      "nUnits": "4",
      "Sold": "3",
      "nUnsold": "1",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "4 (820-933 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "3500",
      "budget": "27-33",
      "lat": "13.037068",
      "lng": "80.119569",
      "techBy": "Anbusivam valuers",
      "legalBy": "Sangraham"
    },
    {
      "S.No": "7",
      "name": "Lotplus",
      "Builder_Name": "JM Homes",
      "locationName": "Plot No. 7B, Ramdev Street, Sri Chakra Nagar Phase III, Mangadu, Chennai – 600122",
      "Area": "Mangadu",
      "Pin code": "600122",
      "Contact_person": "Bala",
      "phone": "9087000730",
      "mailId": "jmhomes@gmail.com",
      "nUnits": "6",
      "Sold": "1",
      "nUnsold": "5",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "6 (625-625 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "4100",
      "budget": "25",
      "lat": "13.033281",
      "lng": "80.108547",
      "techBy": "Anbusivam valuers",
      "legalBy": "Poornima & Saradha"
    },
    {
      "S.No": "8",
      "name": "VGN Coasta",
      "Builder_Name": "VGN developers pvt ltd",
      "locationName": "VGN Coasta, East Coast Road, muttukadu Village, Chenglepet Taluk, Kancheepuram District",
      "Area": "Muttukadu",
      "Pin code": "603112",
      "Contact_person": "Ramesh",
      "phone": "9600010049",
      "mailId": "legal2@vgn.in",
      "nUnits": "119",
      "Sold": "24",
      "nUnsold": "95",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "2 (2251-2311 Sq.ft)",
      "Number of 3 BHKunits": "91 (1539-2870 Sq.ft)",
      "Number of 4 BHKunits": "26 (4204-4612 Sq.ft)",
      "progress": "Under Construction",
      "base": "4500",
      "budget": "69-200",
      "lat": "12.826423",
      "lng": "80.239639",
      "techBy": "Anbusivam valuers",
      "legalBy": "NA"
    },
    {
      "S.No": "9",
      "name": "Compact Homes-Manjari",
      "Builder_Name": "Arun excello realty pvt ltd",
      "locationName": "S. Nos. 229/8B,229/11A2, 230/8, 230/9B, 230/9C, 230/9D, 230/9E,230/9F, 230/9H, 230/12B Part in Mevalukuppam Village, Sriperumbudur Taluk, Kancheepuram District",
      "Area": "Mevalurkuppam",
      "Pin code": "602105",
      "Contact_person": "Hemnath",
      "phone": "9500031328",
      "mailId": "hemnath@arunexcello.com",
      "nUnits": "208",
      "Sold": "54",
      "nUnsold": "154",
      "Number of 1 BHKunits": "2 (440 Sq.ft)",
      "Number of  2 BHKunits": "206 (595-635 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "3100",
      "budget": "13-20",
      "lat": "13.019418",
      "lng": "79.998666",
      "techBy": "Anbusivam valuers",
      "legalBy": "Sree law pundits"
    },
    {
      "S.No": "10",
      "name": "KVR Lakshmi",
      "Builder_Name": "KVR Builders",
      "locationName": "Door No. 11, Maduraiveeran Street, Kallikuppam,Korattur, Chennai- 600053",
      "Area": "Ambattur",
      "Pin code": "600053",
      "Contact_person": "Neelakandan",
      "phone": "9551789206",
      "mailId": "kvrbuilders14@yahoo.in",
      "nUnits": "6",
      "Sold": "5",
      "nUnsold": "1",
      "Number of 1 BHKunits": "1 (528 Sq.ft)",
      "Number of  2 BHKunits": "5 (757-951 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "3900",
      "budget": "20-37",
      "lat": "13.12696",
      "lng": "80.169302",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "11",
      "name": "Ananda Habitat",
      "Builder_Name": "Ananda green manthra developers pvt ltd",
      "locationName": "S. No. 196/5, 191/1, 190/1A,190/1B1, 190/1C1, 191/2, 192, 210/2, 210/6, 211,193 Part, Mettupalayam Village, Sriperumbudur Taluk, Kancheepuram District",
      "Area": "Mettupalayam",
      "Pin code": "631604",
      "Contact_person": "Raju/Padma",
      "phone": "9677715505",
      "mailId": "support@anandagreenmanthra.in",
      "nUnits": "242",
      "Sold": "47",
      "nUnsold": "195",
      "Number of 1 BHKunits": "242 Vacant lands (587-9220 Sq.ft)",
      "Number of  2 BHKunits": "NA",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Vacant land",
      "base": "1000",
      "budget": "5-92",
      "lat": "12.880798",
      "lng": "79.913493",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "12",
      "name": "Adroit-District S",
      "Builder_Name": "Adroit urban developers pvt ltd",
      "locationName": "S. No. 80/8 Part, Thazhambur Main Road, Thazhambur Village, Chengalpet Taluk, Kancheepuram District",
      "Area": "Thalambur",
      "Pin code": "600130",
      "Contact_person": "Nidhi Tak",
      "phone": "9840004294",
      "mailId": "office@adroiturban.com",
      "nUnits": "394",
      "Sold": "146",
      "nUnsold": "248",
      "Number of 1 BHKunits": "70 (606-624 Sq.ft)",
      "Number of  2 BHKunits": "134 (922-1058 Sq.ft)",
      "Number of 3 BHKunits": "190 (1151-1419 Sq.ft)",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "3800",
      "budget": "23-54",
      "lat": "12.84724",
      "lng": "80.201255",
      "techBy": "Anbusivam valuers",
      "legalBy": "NA"
    },
    {
      "S.No": "13",
      "name": "Krishna kamalam",
      "Builder_Name": "Acacia Homes & promoters india pvt ltd",
      "locationName": "Plot No. 1892, Old S. No. 134/2 Part, T.S. No. 215, Block No. 42, 18th Street, I – Block, Thiruvalluvar Kudiyiruppu, Anna Nagar West, Chennai – 600040",
      "Area": "Anna nagar west",
      "Pin code": "600040",
      "Contact_person": "Sangeetha",
      "phone": "9445035026",
      "mailId": "edacaciahomes@gmail.com",
      "nUnits": "4",
      "Sold": "2",
      "nUnsold": "2",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "4 (1651-1681 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "16000",
      "budget": "231-268",
      "lat": "13.093302",
      "lng": "80.202687",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "14",
      "name": "Shradhas Aiswariyam",
      "Builder_Name": "Swetha builders",
      "locationName": "Plot Nos. I, II, III, IV, V, S. Nos.248/1 Part & 248/2 Part, Sankaralinganar Street,Gerugambakkam, Chennai – 600122",
      "Area": "Gerugambakkam",
      "Pin code": "600122",
      "Contact_person": "Jebasingh",
      "phone": "9381041335",
      "mailId": "swethabuilders@yahoo.com",
      "nUnits": "20",
      "Sold": "4",
      "nUnsold": "16",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "20 (805-1127 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "4200",
      "budget": "33-47",
      "lat": "13.009797",
      "lng": "80.139385",
      "techBy": "Anbusivam valuers",
      "legalBy": "Magesh"
    },
    {
      "S.No": "15",
      "name": "Nandhini homes",
      "Builder_Name": "Nandhini homes",
      "locationName": "Plot No. 22, Manohar Nagar 4th Street, Pallikaranai, Chennai – 600100",
      "Area": "Pallikaranai",
      "Pin code": "600100",
      "Contact_person": "Kumarakurubaran",
      "phone": "8438117800",
      "mailId": "nandhinihomes@gmail.com",
      "nUnits": "5",
      "Sold": "1",
      "nUnsold": "4",
      "Number of 1 BHKunits": "1 (400 Sq.ft)",
      "Number of  2 BHKunits": "1 (555 sq.ft)",
      "Number of 3 BHKunits": "3 (785-1225 Sq.ft)",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "5000",
      "budget": "20-61",
      "lat": "12.93543",
      "lng": "80.209605",
      "techBy": "Anbusivam valuers",
      "legalBy": "Poornima & Saradha"
    },
    {
      "S.No": "16",
      "name": "Salim's Golden park",
      "Builder_Name": "Civil Engineering enterprises",
      "locationName": "Plot No. 2, S. No. 11/1A1, Sree Hari Nagar, Goparasanallur, Chennai – 600056",
      "Area": "Goparasanallur",
      "Pin code": "600056",
      "Contact_person": "Sai lakshmi",
      "phone": "9840055895",
      "mailId": "salimcee@gmail.com",
      "nUnits": "6",
      "Sold": "1",
      "nUnsold": "5",
      "Number of 1 BHKunits": "1 (461 Sq.ft)",
      "Number of  2 BHKunits": "3 (663-893 Sq.ft)",
      "Number of 3 BHKunits": "2 (951-1115 Sq.ft)",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "3800",
      "budget": "17-42",
      "lat": "13.04758",
      "lng": "80.128333",
      "techBy": "Anbusivam valuers",
      "legalBy": "Magesh"
    },
    {
      "S.No": "17",
      "name": "Sri Jai Aishwaryam",
      "Builder_Name": "Vani homes & constructions",
      "locationName": "Plot Nos. 133A & 133B, S. No.639/2, Sub Division S. No. 639/2A2, R.S. No. 639/2 Part, T.S. No. 109, Second Cross Street, M.G.R. Nagar, Madhavaram, Chennai – 600060",
      "Area": "Madhavaram",
      "Pin code": "600060",
      "Contact_person": "Jaishankar",
      "phone": "9840585003",
      "mailId": "vanihomesandconstructions@gmail.com",
      "nUnits": "9",
      "Sold": "5",
      "nUnsold": "4",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "9 (683-737 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "4000",
      "budget": "27-30",
      "lat": "13.153792",
      "lng": "80.211731",
      "techBy": "Anbusivam valuers",
      "legalBy": "Poornima & Saradha"
    },
    {
      "S.No": "18",
      "name": "Mangai enclave",
      "Builder_Name": "Abilash homes",
      "locationName": "Plot No. 13, Badala Vignewar Nagar, guduvanchery,Chennai-603202",
      "Area": "Guduvanchery",
      "Pin code": "603202",
      "Contact_person": "Ramesh",
      "phone": "9843053398",
      "mailId": "abilashhomes14@gmail.com",
      "nUnits": "5",
      "Sold": "3",
      "nUnsold": "2",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "5 (620 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "4200",
      "budget": "26",
      "lat": "12.860262",
      "lng": "80.058932",
      "techBy": "Anbusivam valuers",
      "legalBy": "Magesh"
    },
    {
      "S.No": "19",
      "name": "Guru Ganesha",
      "Builder_Name": "Guru kamalam Associates",
      "locationName": "Plot No.2, GURU GANESHA FLATS, Govindasamy Nagar 3rd Cross Street, Madipakkam, Chennai – 600091",
      "Area": "Madipakkam",
      "Pin code": "600091",
      "Contact_person": "Rajendiran",
      "phone": "9445711167",
      "mailId": "rajasiva78@gmail.com",
      "nUnits": "5",
      "Sold": "2",
      "nUnsold": "3",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "5 (714-968 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "4300",
      "budget": "30-41",
      "lat": "12.961748",
      "lng": "80.201997",
      "techBy": "Sreenidhi Management services",
      "legalBy": "Poornima & Saradha"
    },
    {
      "S.No": "20",
      "name": "Sri Nanda",
      "Builder_Name": "Kriya Infrastructures pvt ltd",
      "locationName": "Plot Nos. 77 & 78, S. No. 106/2 Part & 106/3 Part, as per Patta S. No. 106/10 & 106/11, Majestic Residency, Semmancheri, Chennai – 600119",
      "Area": "Semmanchery",
      "Pin code": "600119",
      "Contact_person": "Seenivasan",
      "phone": "9094948110",
      "mailId": "contact@kriyainfra.com",
      "nUnits": "6",
      "Sold": "3",
      "nUnsold": "3",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "6 (1079-1121 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "3800",
      "budget": "41-43",
      "lat": "12.85579",
      "lng": "80.229347",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "21",
      "name": "MSK Flats",
      "Builder_Name": "MSK Foundations",
      "locationName": "Plot No. 8, 5th Street, Bharathi Nagar,Thirumullaivoyal, Chennai – 600062",
      "Area": "Thirumullaivoyal",
      "Pin code": "600062",
      "Contact_person": "Babu",
      "phone": "7200728280",
      "mailId": "mskfoundations@gmail.com",
      "nUnits": "6",
      "Sold": "2",
      "nUnsold": "4",
      "Number of 1 BHKunits": "1 (749 Sq.ft)",
      "Number of  2 BHKunits": "3 (849-873 Sq.ft)",
      "Number of 3 BHKunits": "2 (1059 Sq.ft)",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "3500",
      "budget": "26-37",
      "lat": "13.125823",
      "lng": "80.133347",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "22",
      "name": "Radiance Mercury",
      "Builder_Name": "Radiance realty developers pvt ltd",
      "locationName": "S. Nos. 260/1, 260/2, 260/3A,260/3V, 265/3, 266/1, 266/4, 267/1A, 268/1A,268/1B, 268/2 & 268/3, Off Nookampalayam Road,Gandhi Nagar, Perumbakkam, Chennai – 600100",
      "Area": "Perumbakkam",
      "Pin code": "600100",
      "Contact_person": "Tamilselvan",
      "phone": "9952014925",
      "mailId": "tamil@radiancerealty.in",
      "nUnits": "546",
      "Sold": "248",
      "nUnsold": "298",
      "Number of 1 BHKunits": "84 (500-620 Sq.ft)",
      "Number of  2 BHKunits": "458 (614-1067 Sq.ft)",
      "Number of 3 BHKunits": "4 (1475 Sq.ft)",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "3400",
      "budget": "14-50",
      "lat": "12.894819",
      "lng": "80.20215",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "23",
      "name": "Sudharma Phase-III",
      "Builder_Name": "Radiance realty developers pvt ltd",
      "locationName": "Plot Nos. A & B, S. No.6/2 Part, Pozhichalur Village, Alandur Taluk, Kancheepuram District",
      "Area": "Pozhichalur",
      "Pin code": "600074",
      "Contact_person": "Senthilkumar",
      "phone": "8939803231",
      "mailId": "senthil@radianrealty.in",
      "nUnits": "11",
      "Sold": "6",
      "nUnsold": "5",
      "Number of 1 BHKunits": "11 vacant plots (895-1032 Sq.ft)",
      "Number of  2 BHKunits": "NA",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Vacant land",
      "base": "2000",
      "budget": "16-21",
      "lat": "12.993407",
      "lng": "80.147674",
      "techBy": "Anbusivam valuers",
      "legalBy": "Magesh"
    },
    {
      "S.No": "24",
      "name": "Vijay Raja's Classic",
      "Builder_Name": "Vijay Raja homes pvt ltd",
      "locationName": "Plot Nos. 1, 2, 3, 4, 5, 6, 7, 8, 9, 13 and Shop Site No. 1,S. Nos. 43/1A, 1B, 2A Part, 42/4F, 4G, 35/1C, 1D & 2 of Unmanchery Village, Kancheepuram Taluk and\nDistrict",
      "Area": "Unamanchery",
      "Pin code": "600048",
      "Contact_person": "Pandiyan",
      "phone": "8056117771",
      "mailId": "legal@vijayrajagroup.com",
      "nUnits": "29",
      "Sold": "9",
      "nUnsold": "20",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "NA",
      "Number of 3 BHKunits": "29 (1106-2310 Sq.ft)",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "4000",
      "budget": "44-92",
      "lat": "12.862616",
      "lng": "80.108546",
      "techBy": "Anbusivam valuers",
      "legalBy": "Sree law pundits"
    },
    {
      "S.No": "25",
      "name": "RS Elegance Phase I",
      "Builder_Name": "R.S Properties & developers pvt ltd",
      "locationName": "S. Nos. 153/3A, 3B1, 3B2, 3C1,3C2 & 153/4, Vadakkupattu Road, Medavakkam,Chennai – 600100",
      "Area": "Medavakkam",
      "Pin code": "600100",
      "Contact_person": "Arun",
      "phone": "8220051562",
      "mailId": "info@rspd.in",
      "nUnits": "80",
      "Sold": "15",
      "nUnsold": "65",
      "Number of 1 BHKunits": "NA",
      "Number of  2 BHKunits": "80 (960-1220 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "4200",
      "budget": "40-51",
      "lat": "12.92606",
      "lng": "80.18946",
      "techBy": "Anbusivam valuers",
      "legalBy": "Mothilal & Goda"
    },
    {
      "S.No": "26",
      "name": "Navganesh Tulip",
      "Builder_Name": "Navaganesh realities",
      "locationName": "Plot Nos. B-1, B-2, B-3, B-4, B-5 & B-6, S. No. 1451, T.S. No. 87/3, Block No. 4, Ward – D, Kanchi Nagar Extension, Kolathur, Chennai – 600099",
      "Area": "Kolathur",
      "Pin code": "600099",
      "Contact_person": "Dinagar",
      "phone": "8939994757",
      "mailId": "navganesh@hotmail.com",
      "nUnits": "26",
      "Sold": "12",
      "nUnsold": "14",
      "Number of 1 BHKunits": "19 (321-516 Sq.ft)",
      "Number of  2 BHKunits": "7 (663-737 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "4300",
      "budget": "13-31",
      "lat": "13.140786",
      "lng": "80.208283",
      "techBy": "Anbusivam valuers",
      "legalBy": "Magesh"
    },
    {
      "S.No": "27",
      "name": "Malainur Rajam",
      "Builder_Name": "Malainur properties pvt ltd",
      "locationName": "Plot No. 35, Bharathiyar Street, Venkatesa Nagar,Ayanavaram, Chennai – 600023",
      "Area": "Aynavaram",
      "Pin code": "600023",
      "Contact_person": "Arumugam",
      "phone": "9884005837",
      "mailId": "info@malainurbuilders.com",
      "nUnits": "6",
      "Sold": "4",
      "nUnsold": "2",
      "Number of 1 BHKunits": "1 (510 Sq.ft)",
      "Number of  2 BHKunits": "4 (840-990 Sq.ft)",
      "Number of 3 BHKunits": "190 (1010 Sq.ft)",
      "Number of 4 BHKunits": "NA",
      "progress": "Completed",
      "base": "5400",
      "budget": "27-54",
      "lat": "13.110029",
      "lng": "80.220535",
      "techBy": "Anbusivam valuers",
      "legalBy": "Sangraham"
    },
    {
      "S.No": "28",
      "name": "Janani Elite",
      "Builder_Name": "Bakkiam Foundations",
      "locationName": "Plot No. 3, Abinandan Nagar 3rd Main Road,Nanmangalam, Chennai – 600117",
      "Area": "Nanmangalam",
      "Pin code": "600117",
      "Contact_person": "Subramani",
      "phone": "9884837268",
      "mailId": "bakkiyamfoundation@gmail.com",
      "nUnits": "5",
      "Sold": "3",
      "nUnsold": "2",
      "Number of 1 BHKunits": "1 (447 Sq.ft)",
      "Number of  2 BHKunits": "4 (605-665 Sq.ft)",
      "Number of 3 BHKunits": "NA",
      "Number of 4 BHKunits": "NA",
      "progress": "Under Construction",
      "base": "4200",
      "budget": "17-28",
      "lat": "12.941998",
      "lng": "80.175551",
      "techBy": "Anbusivam valuers",
      "legalBy": "Magesh"
    }
  ]
