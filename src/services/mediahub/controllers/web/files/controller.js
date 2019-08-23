/*!
* /web/files/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var FileModel = null;
	var FolderModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		FileModel = service.models.get("file");
		FolderModel = service.models.get("folder");
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		var context = {};
		var files = [];
		var folders = [];
		var responseCount = 0;
		var parentFolderKey = null;
		if(req.query.folder)
			parentFolderKey = req.query.folder;
		if(!parentFolderKey) {
			context.backButtonLink = "/web";
		} else {
			FolderModel.find({ "where": { objectKey: null, key: parentFolderKey, visible: true }}, function(err,foldersReturned){
				if(!foldersReturned || !foldersReturned[0] || !foldersReturned[0].parentFolderKey)
					context.backButtonLink = "/web/files";
				else
					context.backButtonLink = "/web/files?folder=" + foldersReturned[0].parentFolderKey;
			});
		}
		FileModel.find({ "where": { objectKey: null, parentFolderKey: parentFolderKey, visible: true }}, function(err,filesReturned){
			responseCount ++;
			files = filesReturned;
		});
		FolderModel.find({ "where": { objectKey: null, parentFolderKey: parentFolderKey, visible: true }}, function(err,foldersReturned){
			responseCount ++;
			folders = foldersReturned;
		});
		var interval = setInterval(function(){
			if(responseCount >= 2){
				clearInterval(interval);
				context.files = files;
				context.folders = folders;
				var leftnav = require("../../../lib/leftnav.js");
				leftnav(isnode, context, function(err, cxt){
					res.render("files.mustache", cxt);
				});				
			}
		}, 100);
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