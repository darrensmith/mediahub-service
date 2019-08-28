/*!
* /web/sound-bytes/{soundByteKey}/edit/controller.js
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
		context.backButtonLink = "/web/sound-bytes/" + req.params.soundByteKey;
		SoundByteModel.find({ "where": { key: req.params.soundByteKey }}, function(err, soundBytes){
			context.soundByte = soundBytes[0];
			if (context.soundByte.primaryCategoryKey) {
				CategoryModel.find({ where: { key: context.soundByte.primaryCategoryKey }}, function(err2, categories) {
					if(categories && categories[0] && categories[0].key) {
						if(categories[0].parentCategoryKey) {
							context.childCategoryKey = categories[0].key;
							context.parentCategoryKey = categories[0].parentCategoryKey;
						} else {
							context.childCategoryKey = null;
							context.parentCategoryKey = categories[0].key;
						}
						var leftnav = require("../../../../../lib/leftnav.js");
						leftnav(isnode, context, function(err, cxt){
							res.render("sound-bytes/sound-byte-edit.mustache", cxt);
						});
						return;		
					} else {
						context.childCategoryKey = null;
						context.parentCategoryKey = null;
						var leftnav = require("../../../../../lib/leftnav.js");
						leftnav(isnode, context, function(err, cxt){
							res.render("sound-bytes/sound-byte-edit.mustache", cxt);
						});	
						return;
					}
				});
			} else {
				context.childCategoryKey = null;
				context.parentCategoryKey = null;
				var leftnav = require("../../../../../lib/leftnav.js");
				leftnav(isnode, context, function(err, cxt){
					res.render("sound-bytes/sound-byte-edit.mustache", cxt);
				});		
				return;		
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
		if(req.body.parentCategory && !req.body.childCategory)
			var primaryCategoryKey = req.body.parentCategory;
		else if (req.body.parentCategory && req.body.childCategory)
			var primaryCategoryKey = req.body.childCategory;
		else
			var primaryCategoryKey = null;
		SoundByteModel.update({
			key: req.params.soundByteKey
		}, {
			title: req.body.title,
			shortDesc: req.body.shortDesc,
			longDesc: req.body.longDesc,
			primaryCategoryKey: primaryCategoryKey
		}, function(err, updatedSoundByte) {
			res.redirect("/web/sound-bytes/" + req.params.soundByteKey + "/edit");
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