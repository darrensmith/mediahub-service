/*!
* /web/files/{fileKey}/view/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var FileModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		FileModel = service.models.get("file");
		return;
	}

	/**
	 * HEAR
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.head = function(req, res){
		var fs = require("fs");
		FileModel.find({ "where": { key: req.params.fileKey}}, function(err,files){
			if(files && files[0] && files[0].path) {
				fs.stat(files[0].path, function(err, stats) {
					var filenameSplit = files[0].path.split(".");
					var ext = filenameSplit[filenameSplit.length - 1];
					var mimeType = isnode.module("http", "interface").mime(ext);
					res.set("Content-Type", mimeType);
					res.send();
					return;
				});
			} else {
				res.send();
				return;
			}
		});
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		var context = {};
		context.backButtonLink = "/web/files";
		FileModel.find({ "where": { key: req.params.fileKey}}, function(err,files){
			if(files && files[0] && files[0].path) {
				res.sendFile(files[0].path, function(err, fileRes){
					null;
				});
				return;
			} else {
				res.send();
				return;
			}
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