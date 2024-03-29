/*!
* /web/projects/{projectKey}/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var ProjectModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		ProjectModel = service.models.get("project");
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		var context = {};
		context.backButtonLink = "/web/projects";
		var toggle = req.cookies.activeProject;
		if(toggle && toggle == req.params.projectKey) {
			context.toggleMsg = "Deactivate This Project";
			context.toggleState = "on";
		} else {
			context.toggleMsg = "Set as Active Project";
			context.toggleState = "off";
		}
		ProjectModel.find({ "where": { key: req.params.projectKey }}, function(err,projects){
			context.project = projects[0];
			context.breadcrumbs = "<a href=\"/web\" style=\"color:white;\">Home</a> &gt; <a href=\"/web/projects\" style=\"color:white;\">Projects</a> &gt; " + context.project.title;
			var leftnav = require("../../../../lib/leftnav.js");
			leftnav(isnode, context, function(err, cxt){
				res.render("projects/project-details.mustache", cxt);
			});
		});
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