/*!
* /web/karaoke-clips/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var KaraokeClipModel = null;
	var CategoryModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		KaraokeClipModel = service.models.get("karaokeClip");
		CategoryModel = service.models.get("category");
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
		var parentCategoryKey = null;
		context.backButtonLink = "/web";
		var type = "karaokeClip";
		context.typeTag = "?type=" + type;
		if(req.query.category) {
			parentCategoryKey = req.query.category;
			context.parentTag = "?category=" + parentCategoryKey;
		}
		if(!parentCategoryKey) {
			context.keyTag = "?type=" + type;
			context.categoryLink = "/web/karaoke-clips?category=";
			responseCount ++;
		} else {
			CategoryModel.find({ "where": { key: parentCategoryKey, status: "active" }}, function(err,categoriesReturned){
				if(!categoriesReturned || !categoriesReturned[0] || !categoriesReturned[0].parentCategoryKey) {
					context.keyTag = "?category=" + req.query.category;
					context.backButtonLink = "/web/karaoke-clips";
					context.categoryLink = "/web/karaoke-clips?category=";
				} else {
					context.backButtonLink = "/web/karaoke-clips?category=" + categoriesReturned[0].parentCategoryKey;
				}
				responseCount ++;
			});
		}
		CategoryModel.find({ where: { status: "active", parentCategoryKey: parentCategoryKey, objectType: type }}, function(err, categories){
			context.categories = categories;
			responseCount ++;
		});
		KaraokeClipModel.find({ where: { status: "active", primaryCategoryKey: parentCategoryKey }}, function(err, karaokeClips){
			context.karaokeClips = karaokeClips;
			responseCount ++;
		});
		var interval = setInterval(function(){
			if(responseCount >= 3){
				clearInterval(interval);
				var leftnav = require("../../../lib/leftnav.js");
				leftnav(isnode, context, function(err, cxt){
					res.render("karaoke-clips/karaoke-clips.mustache", cxt);
				});	
			}
		}, 100);
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