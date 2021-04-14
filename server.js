const express = require('express');
const app = express();
const path = require(`path`);
const bodyParser = require('body-parser');
const {Datastore} = require('@google-cloud/datastore');
const datastore = new Datastore();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

const BOAT = "boat"
const SLIP = "slip"
var address = "https://assignment3-310600.wn.r.appspot.com";

function fromDatastore(item){
    item.id = item[Datastore.KEY].id;
    return item;
	
}



/* ------------- Begin Boat Model Functions ------------- */
function post_Boat(name, type, length){
    var key = datastore.key(BOAT);
	const new_Boat = {"name": name, "type": type, "length": length};
	return datastore.save({"key":key, "data":new_Boat}).then(() => {return key});
}

async function get_Boat(key){
	var [boat] = await datastore.get(key);
	if(boat == null){
		return null;
	}
	boat.id = key.id;
	boat = boatSelf(boat);
	return boat;
}

function get_Boats(){
	const q = datastore.createQuery(BOAT);
	return datastore.runQuery(q).then( (entities) => {
			output = entities[0].map(fromDatastore);
			output = output.map(boatSelf);
			return output;
		});
}

function delete_Boat(id){
    const key = datastore.key([BOAT, parseInt(id,10)]);
    return datastore.delete(key);
}

function update_Boat(id,name, type, length){
    const key = datastore.key([BOAT, parseInt(id,10)]);
	const new_Boat = {"name": name, "type": type, "length": length};
	return datastore.update({"key":key, "data":new_Boat}).then(() => {return key});
}

function boatSelf(item){
	 item.self = address +"/boats/" + item.id;
	 return item;
}



/* ------------- End Boat Model Functions ------------- */
function post_Slip(number){
    var key = datastore.key(SLIP);
	const new_Slip = {"number": number, "current_boat": null};
	return datastore.save({"key":key, "data":new_Slip}).then(() => {return key});
}

async function get_Slip(key){
	var [slip] = await datastore.get(key);
	if(slip == null){
		return null;
	}
	slip.id = key.id;
	slip = slipSelf(slip);
	return slip;
}

function slipSelf(item){
	 item.self = address +"/slips/" + item.id;
	 return item;
}

function get_Slips(){
	const q = datastore.createQuery(SLIP);
	return datastore.runQuery(q).then( (entities) => {
			output = entities[0].map(fromDatastore);
			output = output.map(slipSelf);
			return output;
		});
}


function delete_Slip(id){
    const key = datastore.key([SLIP, parseInt(id,10)]);
    return datastore.delete(key);
}

async function slip_AddBoat(slip_id,boat_id){
    const slip_key = datastore.key([SLIP, parseInt(slip_id,10)]);
	var [slip] = await datastore.get(slip_key);
	slip.current_boat = boat_id;
	await datastore.update({"key":slip_key, "data":slip});
}

async function slip_RemoveBoat(slip_id,boat_id){
    const slip_key = datastore.key([SLIP, parseInt(slip_id,10)]);
	var [slip] = await datastore.get(slip_key);
	if(slip.current_boat != boat_id){
		return false;
	}
	slip.current_boat = null;
	await datastore.update({"key":slip_key, "data":slip});
	return true;
}

/* ------------- Begin Slip Model Functions ------------- */


/* ------------- End Slip Model Functions ------------- */
/* ------------- Boat Routes -------------------------- */
app.get('/boats', async (req, res) => {
	var boats = get_Boats()
	.then( (boats) => {
        res.status(200).json(boats);
    });
});



app.post('/boats', async (req, res) => {
	if(!req.body.name || !req.body.type || !req.body.length){
		error = {"Error": "The request object is missing at least one of the required attributes"}
		res.status(400).send(error);
		return;
	}
	else{
	post_Boat(req.body.name, req.body.type, req.body.length)
    .then( key => {get_Boat(key).then(data => {res.status(201).send(data)});
		});
	}
});

app.delete('/boats/:id', async (req, res) => {
	const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
	boat = await get_Boat(key);
	if(boat == null){
		error = {"Error": "No boat with this boat_id exists"  }
		res.status(404).send(error);
		return;
	}
	else{
		delete_Boat(req.params.id).then(res.status(204).end());
	}
});

app.patch('/boats/:id', async (req, res) => {
	if(!req.body.name || !req.body.type || !req.body.length){
		error = {"Error": "The request object is missing at least one of the required attributes"}
		res.status(400).send(error);
		return;
	}
	else{
		const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
		boat = await get_Boat(key);
		if(boat == null){
			error = {"Error": "No boat with this boat_id exists"}
			res.status(404).send(error);
			return;
		}else{
			update_Boat(req.params.id,req.body.name, req.body.type, req.body.length).then(key => {get_Boat(key).then(data => {res.status(200).send(data)});
			});
		}
	}
});

app.get('/boats/:id', async (req, res) => {
	const key = datastore.key([BOAT, parseInt(req.params.id,10)]);
	boat = await get_Boat(key);
	if(boat == null){
		error = {"Error": "No boat with this boat_id exists"  }
		res.status(404).send(error);
		return;
	}else{
		res.status(200).send(boat);
	}
	
});


/* ------------- Slip Routes -------------------------- */

app.post('/slips', async (req, res) => {
	if(!req.body.number){
		error = {"Error": "The request object is missing the required number"}
		res.status(400).send(error);
		return;
	}
	else{
	post_Slip(req.body.number)
    .then( key => {get_Slip(key).then(data => {res.status(201).send(data)});
		});
	}
});

app.get('/slips/:id', async (req, res) => {
	const key = datastore.key([SLIP, parseInt(req.params.id,10)]);
	slip = await get_Slip(key);
	if(slip == null){
		error = {"Error": "No slip with this slip_id exists"  }
		res.status(404).send(error);
		return;
	}else{
		res.status(200).send(slip);
	}
	
});

app.get('/slips', async (req, res) => {
	var slips = get_Slips()
	.then( (slips) => {
        res.status(200).json(slips);
    });
});

app.delete('/slips/:id', async (req, res) => {
	const key = datastore.key([SLIP, parseInt(req.params.id,10)]);
	slip = await get_Slip(key);
	if(slip == null){
		error = {"Error": "No slip with this slip_id exists" }
		res.status(404).send(error);
		return;
	}
	else{
		delete_Slip(req.params.id).then(res.status(204).end());
	}
});

app.put('/slips/:slip_id/:boat_id', async (req, res) => {
	const slip_key = datastore.key([SLIP, parseInt(req.params.slip_id,10)]);
	slip = await get_Slip(slip_key);
	const boat_key = datastore.key([BOAT, parseInt(req.params.boat_id,10)]);
	boat = await get_Boat(boat_key);
	if(slip == null || boat == null){
		error = {"Error": "The specified boat and/or slip does not exist" }
		res.status(404).send(error);
		return;
	}
	else if(slip.current_boat!=null){
		error = {"Error": "The slip is not empty" }
		res.status(403).send(error);
		return;
	}
	else{
		slip_AddBoat(req.params.slip_id,req.params.boat_id).then(res.status(204).end());
	}
});

app.delete('/slips/:slip_id/:boat_id', async (req, res) => {
	const slip_key = datastore.key([SLIP, parseInt(req.params.slip_id,10)]);
	slip = await get_Slip(slip_key);
	const boat_key = datastore.key([BOAT, parseInt(req.params.boat_id,10)]);
	boat = await get_Boat(boat_key);
	if(slip == null || boat == null){
		error = {"Error": "No boat with this boat_id is at the slip with this slip_id" }
		res.status(404).send(error);
		return;
	}
	else{
		var response = await slip_RemoveBoat(req.params.slip_id,req.params.boat_id);
		if(response){
			res.status(204).end()
		}else{
			error = {"Error": "No boat with this boat_id is at the slip with this slip_id" }
			res.status(404).send(error);
			return;
		}
	}
});



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
var server = app.listen(PORT, () => {
});