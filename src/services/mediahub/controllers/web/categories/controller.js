/*!
* /web/categories/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
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
		var responseCount = 0;
		var parentCategoryKey = null;
		if(req.query.category)
			parentCategoryKey = req.query.category;
			context.parentTag = "?category=" + parentCategoryKey;
		if(!parentCategoryKey) {
			context.parentTag = "";
			context.backButtonLink = "/web";
			responseCount ++;
		} else {
			CategoryModel.find({ "where": { key: parentCategoryKey, status: "active" }}, function(err,categoriesReturned){
				if(!categoriesReturned || !categoriesReturned[0] || !categoriesReturned[0].parentCategoryKey) {
					context.backButtonLink = "/web/categories";
				} else {
					context.backButtonLink = "/web/categories?category=" + categoriesReturned[0].parentCategoryKey;
				}
				responseCount ++;
			});
		}
		CategoryModel.find({ where: { status: "active", parentCategoryKey: parentCategoryKey }}, function(err, categories){
			context.categories = categories;
			responseCount ++;
		});
		var interval = setInterval(function(){
			if(responseCount >= 2){
				clearInterval(interval);
				var leftnav = require("../../../lib/leftnav.js");
				leftnav(isnode, context, function(err, cxt){
					res.render("categories.mustache", cxt);
				});			
			}
		}, 100);
		return;
	}

	/**
	 * POST
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.post = function(req, res){
		var context = {};
		if(req.body.parentCategoryKey && req.body.parentCategoryKey != null && req.body.parentCategoryKey != "")
			var parentCategoryKey = req.body.parentCategoryKey;
		else
			var parentCategoryKey = null;
		var title = req.body.title;
		var shortDesc = req.body.shortDesc;
		var currentDate = isnode.module("utilities").getCurrentDateInISO();
		CategoryModel.create({
			key: isnode.module("utilities").uuid4(),
			dateCreated: currentDate,
			dateLastModified: currentDate,
			title: title,
			status: "active",
			shortDesc: shortDesc,
			parentCategoryKey: parentCategoryKey
		}, function(err, newCategory) {
			if(parentCategoryKey)
				var categoryString = "&category=" + parentCategoryKey;
			else
				var categoryString = "";
			if(err) {
				res.redirect("/web/categories?message=error-creating-category" + categoryString);
			} else {
				res.redirect("/web/categories?message=category-created-successfully" + categoryString);
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