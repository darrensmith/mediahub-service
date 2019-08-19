/*!
* /web/ebooks/{ebookKey}/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var eBookModel = null;
	var FileModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		eBookModel = service.models.get("ebook");
		FileModel = service.models.get("file");
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		var context = {};
		context.backButtonLink = "/web/ebooks";
		eBookModel.find({ "where": { key: req.params.ebookKey }}, function(err,ebooks){
			context.ebook = ebooks[0];
			var leftnav = require("../../../../lib/leftnav.js");
			leftnav(isnode, context, function(err, cxt){
				res.render("ebook-details.mustache", cxt);
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
		eBookModel.find({ "where": { key: req.params.ebookKey }}, function(err1, ebooks){
			if(!ebooks || err1 || !ebooks[0]){
				res.redirect("/web/ebooks");
				return;
			}
			FileModel.find({ "where": { key: ebooks[0].fileKey }}, function(err2, files){
				if(!files || err2 || !files[0]){
					res.redirect("/web/ebooks");
					return;
				}
				if(req.body.revert == "true"){
					var completed = 0;
					ebooks[0].destroy(function(err3, deletedEBook){
						completed ++;
					});
					FileModel.update({ 
						where: { key: ebooks[0].fileKey } 
					}, {
						objectType: null,
						objectKey: null
					}, function(err4, updatedFile){
						completed ++;
					});
					var interval = setInterval(function(){
						if(completed >= 2){
							clearInterval(interval);
							res.redirect("/web/files");
						}
					}, 200);
				} else if (req.body.edit == "true") {
					res.redirect("/web/ebooks/" + req.params.ebookKey + "/edit");
				}			
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