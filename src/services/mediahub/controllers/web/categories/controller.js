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
		context.showEdit = false;
		if(!req.query.type) {
			context.types = [
				{label: "Applications", url: "/web/categories?type=application"},
				{label: "Documentaries", url: "/web/categories?type=documentary"},
				{label: "Documents", url: "/web/categories?type=document"},
				{label: "eBooks", url: "/web/categories?type=ebook"},
				{label: "Games", url: "/web/categories?type=game"},
				{label: "Images", url: "/web/categories?type=image"},
				{label: "Karaoke Clips", url: "/web/categories?type=karaokeClip"},
				{label: "Movies", url: "/web/categories?type=movie"},
				{label: "Music", url: "/web/categories?type=music"},
				{label: "Music Videos", url: "/web/categories?type=musicVideo"},
				{label: "Operating Systems", url: "/web/categories?type=operatingSystem"},
				{label: "Physibles", url: "/web/categories?type=physible"},
				{label: "Sound Bytes", url: "/web/categories?type=soundByte"},
				{label: "Television", url: "/web/categories?type=television"},
				{label: "Video Clips", url: "/web/categories?type=videoClip"},
			];
			context.backButtonLink = "/web";
			context.showCreateCategory = false;
			var leftnav = require("../../../lib/leftnav.js");
			leftnav(isnode, context, function(err, cxt){
				res.render("categories/categories.mustache", cxt);
			});	
			return;
		} else {
			var type = req.query.type;
			context.typeTag = "?type=" + type;
			if(req.query.category) {
				parentCategoryKey = req.query.category;
				context.parentTag = "?category=" + parentCategoryKey;
			}
			if(!parentCategoryKey) {
				context.showCreateCategory = true;
				context.keyTag = "?type=" + type;
				context.backButtonLink = "/web/categories";
				context.categoryLink = "/web/categories?type=" + type + "&category=";
				responseCount ++;
			} else {
				CategoryModel.find({ "where": { key: parentCategoryKey, status: "active" }}, function(err,categoriesReturned){
					if(!categoriesReturned || !categoriesReturned[0] || !categoriesReturned[0].parentCategoryKey) {
						context.keyTag = "?type=" + type + "&category=" + req.query.category;
						context.showCreateCategory = true;
						context.backButtonLink = "/web/categories?type=" + type;
						context.categoryLink = "/web/categories/";
						context.endCategoryLink = "/edit?type=" + type + "&category=" + parentCategoryKey;
						if(categoriesReturned[0]){
							context.showEdit = true;
							context.category = categoriesReturned[0];
						}
					} else {
						context.showEdit = true;
						context.category = categoriesReturned[0];
					}
					responseCount ++;
				});
			}
			CategoryModel.find({ where: { status: "active", parentCategoryKey: parentCategoryKey, objectType: type }}, function(err, categories){
				context.categories = categories;
				responseCount ++;
			});
			var interval = setInterval(function(){
				if(responseCount >= 2){
					clearInterval(interval);
					var leftnav = require("../../../lib/leftnav.js");
					leftnav(isnode, context, function(err, cxt){
						res.render("categories/categories.mustache", cxt);
					});			
				}
			}, 100);
			return;
		}

	}

	/**
	 * POST
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.post = function(req, res){
		if(req.body.parentCategoryKey && req.body.parentCategoryKey != null && req.body.parentCategoryKey != "")
			var parentCategoryKey = req.body.parentCategoryKey;
		else
			var parentCategoryKey = null;
		var type = req.body.type;
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
			parentCategoryKey: parentCategoryKey,
			objectType: type
		}, function(err, newCategory) {
			if(parentCategoryKey)
				var categoryString = "&category=" + parentCategoryKey;
			else
				var categoryString = "";
			var typeString = "&type=" + type;
			if(err) {
				res.redirect("/web/categories?message=error-creating-category" + categoryString + typeString);
			} else {
				res.redirect("/web/categories?message=category-created-successfully" + categoryString + typeString);
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