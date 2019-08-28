/*!
* /web/ebooks/{ebookKey}/edit/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var eBookModel = null;
	var CategoryModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		eBookModel = service.models.get("ebook");
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
		context.backButtonLink = "/web/ebooks/" + req.params.ebookKey;
		eBookModel.find({ "where": { key: req.params.ebookKey }}, function(err, ebooks){
			context.ebook = ebooks[0];
			if (context.ebook.primaryCategoryKey) {
				CategoryModel.find({ where: { key: context.ebook.primaryCategoryKey }}, function(err2, categories) {
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
							res.render("ebooks/ebook-edit.mustache", cxt);
						});
						return;		
					} else {
						context.childCategoryKey = null;
						context.parentCategoryKey = null;
						var leftnav = require("../../../../../lib/leftnav.js");
						leftnav(isnode, context, function(err, cxt){
							res.render("ebooks/ebook-edit.mustache", cxt);
						});	
						return;
					}
				});
			} else {
				context.childCategoryKey = null;
				context.parentCategoryKey = null;
				var leftnav = require("../../../../../lib/leftnav.js");
				leftnav(isnode, context, function(err, cxt){
					res.render("ebooks/ebook-edit.mustache", cxt);
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
		eBookModel.update({
			key: req.params.ebookKey
		}, {
			title: req.body.title,
			shortDesc: req.body.shortDesc,
			longDesc: req.body.longDesc,
			primaryCategoryKey: primaryCategoryKey,
			publisher: req.body.publisher,
			datePublished: req.body.datePublished,
			language: req.body.language,
			series: req.body.series,
			volumeNumber: req.body.volumeNumber,
			ISBN10: req.body.ISBN10,
			ISBN13: req.body.ISBN13,
			mobiAsin: req.body.mobiAsin
		}, function(err, updatedEBook) {
			res.redirect("/web/ebooks/" + req.params.ebookKey + "/edit");
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