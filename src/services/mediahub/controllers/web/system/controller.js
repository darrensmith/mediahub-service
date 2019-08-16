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
		SettingModel.find({ "where": { "setting": "folder" }}, function(err,settings){
			if(settings[0]) {
				context.folder = settings[0].value;
				res.render("system.mustache", context);
			} else {
				res.render("system.mustache");
			}
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
		if(req.body.folder){
			var currentDate = isnode.module("utilities").getCurrentDateInISO();
			SettingModel.updateOrCreate({ "setting": "folder" }, 
			{
				"key": isnode.module("utilities").uuid4(),
				"setting": "folder",
				"value": req.body.folder,
				"dateCreated": currentDate,
				"dateLastModified": currentDate
			}, function(err, setting){
				if(err){
					res.redirect("/web/system?error=problem-updating-folder");
				} else {
					res.redirect("/web/system?success=folder-updated");
				}
			});
		} else {
			res.redirect("/web/system");
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