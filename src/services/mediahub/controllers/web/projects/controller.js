/*!
* /web/projects/controller.js
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
		var responseCount = 0;
		context.breadcrumbs = "<a href=\"/web\" style=\"color:white;\">Home</a> > Projects";
		context.backButtonLink = "/web";
		ProjectModel.find({ where: { }}, function(err, projects){
			context.projects = projects;
			responseCount ++;
		});
		var interval = setInterval(function(){
			if(responseCount >= 1){
				clearInterval(interval);
				var leftnav = require("../../../lib/leftnav.js");
				leftnav(isnode, context, function(err, cxt){
					res.render("projects/project.mustache", cxt);
				});
			}
		}, 10);
		return;
	}

	/**
	 * POST
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.post = function(req, res){
		var title = req.body.title;
		var shortDesc = req.body.shortDesc;
		var currentDate = isnode.module("utilities").getCurrentDateInISO();
		ProjectModel.create({
			key: isnode.module("utilities").uuid4(),
			dateCreated: currentDate,
			dateLastModified: currentDate,
			title: title,
			shortDesc: shortDesc
		}, function(err, newProject) {
			if(err) {
				res.redirect("/web/projects?message=error-creating-project");
			} else {
				res.redirect("/web/projects?message=project-created-successfully");
			}
			return;
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