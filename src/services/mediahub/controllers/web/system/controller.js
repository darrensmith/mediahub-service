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
			context.hideSystemSettingsYesSelected = "";
			context.hideSystemSettingsNoSelected = "";
			context.hideSignOutLinkYesSelected = "";
			context.hideSignOutLinkNoSelected = "";
			context.hideFilesLinkYesSelected = "";
			context.hideFilesLinkNoSelected = "";
			context.hideRevertToFileYesSelected = "";
			context.hideRevertToFileNoSelected = "";
			context.systemSettingsPassword = "";
			context.announcement = "";
			context.homepageContent = "";
			for (var j = 0; j < objects.length; j++) {
				context[objects[j] + "Selected"] = "";
			}
			for (var i = 0; i < settings.length + 1; i++) {
				if(settings[i] && settings[i].setting == "systemSettingsPassword") {
					if(settings[i].value != "" && (!req.body.password || settings[i].value != req.body.password)) {
						res.redirect("/web/system/authorise");
						return;
					}
				}
				if(settings[i] && settings[i].setting == "folder") {
					context.folder = settings[i].value;
				}
				if(settings[i] && settings[i].setting == "announcement") {
					context.announcement = settings[i].value;
				}
				if(settings[i] && settings[i].setting == "homepageContent") {
					context.homepageContent = settings[i].value;
				}
				if(settings[i] && settings[i].setting == "systemSettingsPassword") {
					context.systemSettingsPassword = settings[i].value;
				}
				if(settings[i] && settings[i].setting == "reindexFreq") {
					context.reindexFreq = settings[i].value;
				}
				if(settings[i] && settings[i].setting == "defaultPageSize" && settings[i].value == "20") {
					context.pageSizeSet = true;
					context.twenty = "selected";
				}
				if(settings[i] && settings[i].setting == "defaultPageSize" && settings[i].value == "50") {
					context.pageSizeSet = true;
					context.fifty = "selected";
				}
				if(settings[i] && settings[i].setting == "defaultPageSize" && settings[i].value == "100") {
					context.pageSizeSet = true;
					context.hundred = "selected";
				}
				if(settings[i] && settings[i].setting == "defaultPageSize" && settings[i].value == "250") {
					context.pageSizeSet = true;
					context.twofifty = "selected";
				}
				if(settings[i] && settings[i].setting == "showObjectTypes") {
					context.objectTypesReturned = true;
					var objectTypes = settings[i].value.split(" ");
					for (var k = 0; k < objects.length; k++) {
						if(objectTypes.includes(objects[k])){
							context[objects[k] + "Selected"] = "checked";
						}
					}
				}
				if(settings[i] && settings[i].setting == "hideSystemSettings" && (settings[i].value == "no" || settings[i].value == "")) {
					context.hideSystemSettingsYesSelected = "";
					context.hideSystemSettingsNoSelected = "selected";
				}
				if(settings[i] && settings[i].setting == "hideSystemSettings" && settings[i].value == "yes") {
					context.hideSystemSettingsYesSelected = "selected";
					context.hideSystemSettingsNoSelected = "";
				}
				if(settings[i] && settings[i].setting == "hideSignOutLink" && (settings[i].value == "no" || settings[i].value == "")) {
					context.hideSignOutLinkYesSelected = "";
					context.hideSignOutLinkNoSelected = "selected";
				}
				if(settings[i] && settings[i].setting == "hideSignOutLink" && settings[i].value == "yes") {
					context.hideSignOutLinkYesSelected = "selected";
					context.hideSignOutLinkNoSelected = "";
				}
				if(settings[i] && settings[i].setting == "hideFilesLink" && (settings[i].value == "no" || settings[i].value == "")) {
					context.hideFilesLinkYesSelected = "";
					context.hideFilesLinkNoSelected = "selected";
				}
				if(settings[i] && settings[i].setting == "hideFilesLink" && settings[i].value == "yes") {
					context.hideFilesLinkYesSelected = "selected";
					context.hideFilesLinkNoSelected = "";
				}
				if(settings[i] && settings[i].setting == "hideRevertToFile" && (settings[i].value == "no" || settings[i].value == "")) {
					context.hideRevertToFileYesSelected = "";
					context.hideRevertToFileNoSelected = "selected";
				}
				if(settings[i] && settings[i].setting == "hideRevertToFile" && settings[i].value == "yes") {
					context.hideRevertToFileYesSelected = "selected";
					context.hideRevertToFileNoSelected = "";
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
				if(req.body.password)
					cxt.password = req.body.password;
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
		SettingModel.find({ where: { setting: "systemSettingsPassword"}}, function(err,settings){
			if(!settings || !settings[0] || settings[0].value == "" || (req.body.password && req.body.password == settings[0].value)){
				var context = {};
				var parametersToUpdate = 0;
				var parametersUpdated = 0;
				if(req.body.folder) { parametersToUpdate ++; };
				if(req.body.reindexFreq) { parametersToUpdate ++; };
				if(req.body.defaultPageSize) { parametersToUpdate ++; };
				if(req.body.hideSystemSettings) { parametersToUpdate ++; };
				if(req.body.hideSignOutLink) { parametersToUpdate ++; };
				if(req.body.hideFilesLink) { parametersToUpdate ++; };
				if(req.body.hideRevertToFile) { parametersToUpdate ++; };
				if(req.body.systemSettingsPassword) { parametersToUpdate ++; };
				if(req.body.announcement) { parametersToUpdate ++; };
				if(req.body.homepageContent) { parametersToUpdate ++; };
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
					if(req.body.hideSystemSettings) {
						SettingModel.updateOrCreate({ "setting": "hideSystemSettings" }, 
						{
							"key": isnode.module("utilities").uuid4(),
							"setting": "hideSystemSettings",
							"value": req.body.hideSystemSettings,
							"dateCreated": currentDate,
							"dateLastModified": currentDate
						}, function(err, setting){
							parametersUpdated ++;
						});
					}
					if(req.body.hideSignOutLink) {
						SettingModel.updateOrCreate({ "setting": "hideSignOutLink" }, 
						{
							"key": isnode.module("utilities").uuid4(),
							"setting": "hideSignOutLink",
							"value": req.body.hideSignOutLink,
							"dateCreated": currentDate,
							"dateLastModified": currentDate
						}, function(err, setting){
							parametersUpdated ++;
						});
					}
					if(req.body.hideFilesLink) {
						SettingModel.updateOrCreate({ "setting": "hideFilesLink" }, 
						{
							"key": isnode.module("utilities").uuid4(),
							"setting": "hideFilesLink",
							"value": req.body.hideFilesLink,
							"dateCreated": currentDate,
							"dateLastModified": currentDate
						}, function(err, setting){
							parametersUpdated ++;
						});
					}
					if(req.body.hideRevertToFile) {
						SettingModel.updateOrCreate({ "setting": "hideRevertToFile" }, 
						{
							"key": isnode.module("utilities").uuid4(),
							"setting": "hideRevertToFile",
							"value": req.body.hideRevertToFile,
							"dateCreated": currentDate,
							"dateLastModified": currentDate
						}, function(err, setting){
							parametersUpdated ++;
						});
					}
					SettingModel.updateOrCreate({ "setting": "systemSettingsPassword" }, 
					{
						"key": isnode.module("utilities").uuid4(),
						"setting": "systemSettingsPassword",
						"value": req.body.systemSettingsPassword,
						"dateCreated": currentDate,
						"dateLastModified": currentDate
					}, function(err, setting){
						parametersUpdated ++;
					});
					SettingModel.updateOrCreate({ "setting": "announcement" }, 
					{
						"key": isnode.module("utilities").uuid4(),
						"setting": "announcement",
						"value": req.body.announcement,
						"dateCreated": currentDate,
						"dateLastModified": currentDate
					}, function(err, setting){
						parametersUpdated ++;
					});
					SettingModel.updateOrCreate({ "setting": "homepageContent" }, 
					{
						"key": isnode.module("utilities").uuid4(),
						"setting": "homepageContent",
						"value": req.body.homepageContent,
						"dateCreated": currentDate,
						"dateLastModified": currentDate
					}, function(err, setting){
						parametersUpdated ++;
					});
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
							ctrl.get(req, res);
						}
					}, 200);
				} else if (req.body.sync == "true") {
					var router = isnode.module("router");
					router.emit("sync");
					ctrl.get(req, res);
					return;
				} else {
					ctrl.get(req, res);
					return;
				}
				return;
			} else {
				res.redirect("/web/system/authorise");
				return;
			}
		});
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