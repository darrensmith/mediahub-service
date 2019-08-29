/*!
* /web/sound-bytes/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var SoundByteModel = null;
	var CategoryModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		SoundByteModel = service.models.get("soundByte");
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
		context.breadcrumbs = "<a href=\"/web\" style=\"color:white;\">Home</a>";
		var responseCount = 0;
		var parentCategoryKey = null;
		context.backButtonLink = "/web";
		var type = "soundByte";
		context.typeTag = "?type=" + type;
		if(req.query.category) {
			parentCategoryKey = req.query.category;
			context.parentTag = "?category=" + parentCategoryKey;
		}
		if(!parentCategoryKey) {
			context.keyTag = "?type=" + type;
			context.categoryLink = "/web/sound-bytes?category=";
			context.breadcrumbs += " > Sound Bytes";
			responseCount ++;
			responseCount ++;
		} else {
			CategoryModel.find({ "where": { key: parentCategoryKey, status: "active" }}, function(err,categoriesReturned){
				if(!categoriesReturned || !categoriesReturned[0] || !categoriesReturned[0].parentCategoryKey) {
					context.keyTag = "?category=" + req.query.category;
					context.backButtonLink = "/web/sound-bytes";
					context.categoryLink = "/web/sound-bytes?category=";
					context.breadcrumbs += " > <a href=\"/web/sound-bytes\" style=\"color:white;\">Sound Bytes</a> > " + categoriesReturned[0].title;
					responseCount ++;
				} else {
					context.backButtonLink = "/web/sound-bytes?category=" + categoriesReturned[0].parentCategoryKey;
					CategoryModel.find({ "where": { key: categoriesReturned[0].parentCategoryKey, status: "active" }}, function(err2,categoriesReturned2){
						context.breadcrumbs += " > <a href=\"/web/sound-bytes\" style=\"color:white;\">Sound Bytes</a> > <a href=\"/web/sound-bytes?category=" + categoriesReturned2[0].key + "\" style=\"color:white;\">" + categoriesReturned2[0].title + "</a> > " + categoriesReturned[0].title;
						responseCount ++;
					});
				}
				responseCount ++;
			});
		}
		CategoryModel.find({ where: { status: "active", parentCategoryKey: parentCategoryKey, objectType: type }}, function(err, categories){
			context.categories = categories;
			responseCount ++;
		});
		SoundByteModel.find({ where: { status: "active", primaryCategoryKey: parentCategoryKey }}, function(err, soundBytes){
			context.soundBytes = soundBytes;
			responseCount ++;
		});
		var interval = setInterval(function(){
			if(responseCount >= 4){
				clearInterval(interval);
				var leftnav = require("../../../lib/leftnav.js");
				leftnav(isnode, context, function(err, cxt){
					res.render("sound-bytes/sound-bytes.mustache", cxt);
				});
			}
		}, 10);
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