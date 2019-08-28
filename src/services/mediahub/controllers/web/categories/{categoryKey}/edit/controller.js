/*!
* /web/categories/{categoryKey}/edit/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var CategoryModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
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
		var type = req.query.type;
		context.type = type;
		if(req.query.category)
			context.categoryKey = req.query.category;
		else
			context.categoryKey = req.params.categoryKey;
		context.categoryTag = "&category=" + context.categoryKey;
		context.typeTag = "?type=" + context.type;
		context.backButtonLink = "/web/categories?type=" + type + "&category=" + context.categoryKey;
		var leftnav = require("../../../../../lib/leftnav.js");
		CategoryModel.find({where: {key: req.params.categoryKey}}, function(err, categories){
			context.category = categories[0];
			leftnav(isnode, context, function(err, cxt){
				res.render("categories/category-edit.mustache", cxt);
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
		if(req.params.categoryKey)
			var focusCategory = req.params.categoryKey;
		if(req.body.searchCategory)
			var searchCategory = req.body.searchCategory;
		else
			var searchCategory = focusCategory;
		CategoryModel.update({key: focusCategory}, {
			title: req.body.title,
			shortDesc: req.body.shortDesc
		}, function(err, updatedCategory) {
			res.redirect("/web/categories?type=" + req.body.type + "&category=" + searchCategory);
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