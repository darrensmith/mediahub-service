/*!
* /web/system/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var SettingModel = null;
	var objects = ["documents", "ebooks", "music", "soundBytes", "television", "movies", "documentaries", "musicVideos", "karaokeClips", "videoClips", "applications", "games", "operatingSystems", "physibles", "images"];

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		SettingModel = service.models.get("setting");
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		var context = {};
		context.backButtonLink = "/web";
		SettingModel.find({ "where": {}}, function(err,settings){
			context.twenty = "";
			context.fifty = "";
			context.hundred = "";
			context.twofifty = "";
			for (var i = 0; i < objects.length; i++) {
				context[objects[i] + "Selected"] = "";
			}
			for (var i = 0; i < settings.length; i++) {
				if(settings[i].setting == "folder") {
					context.folder = settings[i].value;
				}
				if(settings[i].setting == "reindexFreq") {
					context.reindexFreq = settings[i].value;
				}
				if(settings[i].setting == "defaultPageSize" && settings[i].value == "20") {
					context.pageSizeSet = true;
					context.twenty = "selected";
				}
				if(settings[i].setting == "defaultPageSize" && settings[i].value == "50") {
					context.pageSizeSet = true;
					context.fifty = "selected";
				}
				if(settings[i].setting == "defaultPageSize" && settings[i].value == "100") {
					context.pageSizeSet = true;
					context.hundred = "selected";
				}
				if(settings[i].setting == "defaultPageSize" && settings[i].value == "250") {
					context.pageSizeSet = true;
					context.twofifty = "selected";
				}
				if(settings[i].setting == "showObjectTypes") {
					context.objectTypesReturned = true;
					var objectTypes = settings[i].value.split(" ");
					for (var i = 0; i < objects.length; i++) {
						if(objectTypes.includes(objects[i])){
							context[objects[i] + "Selected"] = "checked";
						}
					}
				}
				/*
				if(settings[i].setting == "watch" && settings[i].value == "No") {
					context.watchNoSelected = "selected";
					context.watchYesSelected = "";
				}
				if(settings[i].setting == "watch" && settings[i].value == "Yes") {
					context.watchNoSelected = "";
					context.watchYesSelected = "selected";
				}
				*/
			}
			if(!context.pageSizeSet) {
				context.twenty = "selected";
			}
			if(!context.objectTypesReturned){
				for (var i = 0; i < objects.length; i++) {
					context[objects[i] + "Selected"] = "checked";
				}
			}
			var leftnav = require("../../../lib/leftnav.js");
			leftnav(isnode, context, function(err, cxt){
				res.render("system.mustache", cxt);
			});
		});
		return;
	}

	/**
	 * POST
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.post = function(req, res){
		var context = {};
		var parametersToUpdate = 0;
		var parametersUpdated = 0;
		if(req.body.folder) { parametersToUpdate ++; };
		if(req.body.reindexFreq) { parametersToUpdate ++; };
		if(req.body.defaultPageSize) { parametersToUpdate ++; };
		var showObjectTypes = "";
		for (var i = 0; i < objects.length; i++) {
			if(req.body[objects[i]]) {
				showObjectTypes += objects[i] + " ";
			}
		}
		showObjectTypes = showObjectTypes.trim();
		parametersToUpdate ++;
		/*if(req.body.watch) { parametersToUpdate ++; };*/
		if(req.body.save == "true"){
			var currentDate = isnode.module("utilities").getCurrentDateInISO();
			if(req.body.folder) {
				SettingModel.updateOrCreate({ "setting": "folder" }, 
				{
					"key": isnode.module("utilities").uuid4(),
					"setting": "folder",
					"value": req.body.folder,
					"dateCreated": currentDate,
					"dateLastModified": currentDate
				}, function(err, setting){
					parametersUpdated ++;
				});
			}
			if(req.body.reindexFreq) {
				SettingModel.updateOrCreate({ "setting": "reindexFreq" }, 
				{
					"key": isnode.module("utilities").uuid4(),
					"setting": "reindexFreq",
					"value": req.body.reindexFreq,
					"dateCreated": currentDate,
					"dateLastModified": currentDate
				}, function(err, setting){
					var router = isnode.module("router");
					router.emit("reset-sync");
					parametersUpdated ++;
				});
			}
			if(req.body.defaultPageSize) {
				SettingModel.updateOrCreate({ "setting": "defaultPageSize" }, 
				{
					"key": isnode.module("utilities").uuid4(),
					"setting": "defaultPageSize",
					"value": req.body.defaultPageSize,
					"dateCreated": currentDate,
					"dateLastModified": currentDate
				}, function(err, setting){
					parametersUpdated ++;
				});
			}
			SettingModel.updateOrCreate({ "setting": "showObjectTypes" }, 
			{
				"key": isnode.module("utilities").uuid4(),
				"setting": "showObjectTypes",
				"value": showObjectTypes,
				"dateCreated": currentDate,
				"dateLastModified": currentDate
			}, function(err, setting){
				parametersUpdated ++;
			});
			/*if(req.body.watch) {
				SettingModel.updateOrCreate({ "setting": "watch" }, 
				{
					"key": isnode.module("utilities").uuid4(),
					"setting": "watch",
					"value": req.body.watch,
					"dateCreated": currentDate,
					"dateLastModified": currentDate
				}, function(err, setting){
					parametersUpdated ++;
				});
			}*/
			var interval = setInterval(function(){
				if(parametersUpdated >= parametersToUpdate) {
					clearInterval(interval);
					res.redirect("/web/system?message=update-processed");
				}
			}, 200);
		} 
		if (req.body.sync == "true") {
			var router = isnode.module("router");
			router.emit("sync");
			res.redirect("/web/system?success=sync-started");
		}
		return;
	}

	/**
	 * Shutdown Controller
	 * @param {function} cb - Callback function
	 */
	ctrl.shutdown = function(cb) {
		cb();
	}

	/**
	 * (ENTRY POINT FOR EXECUTION)
	 *
	 * Alter module behaviour based on execution use case: 
	 *
	 * (i) Attempt to Open Command-Line Interface (CLI) - INVALID; or
	 * (ii) Export as Node.JS module for inclusion in another application - VALID
	 */
	if (!module.parent) { 
		console.log("ERROR: Controller cannot be executed independently as it is an isnode application library only.");
	} else { 
		module.exports = ctrl;
	}
}();