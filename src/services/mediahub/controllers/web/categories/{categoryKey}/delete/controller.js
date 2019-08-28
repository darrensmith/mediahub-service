/*!
* /web/categories/{categoryKey}/delete/controller.js
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
		var type = req.query.type;
		var childCategories = [];
		if(req.query.category)
			var categoryKey = req.query.category;
		else
			var categoryKey = req.params.categoryKey
		var deletedChildren = 0;
		var childCategoryCount = 0;
		childCategories.push(req.params.categoryKey);
		CategoryModel.find({where: {key: req.params.categoryKey}}, function(err, categories){
			if(categories[0]) {
				categories[0].destroy(function(err, deletedCategory) {
					CategoryModel.find({where: {parentCategoryKey: req.params.categoryKey}}, function(err2, categories2){
						childCategoryCount = categories2.length;
						for (var i = 0; i < categories2.length; i++) {
							childCategories.push(categories2[i].key);
							categories2[i].destroy(function(err3, deletedCategory2){
								deletedChildren ++;
							});
						}
						updateObjects(childCategories, function(err4, result) {
							deletedChildren ++;
						});
						var interval = setInterval(function(){
							if(deletedChildren >= childCategoryCount + 1) {
								clearInterval(interval);
								res.redirect("/web/categories?type=" + type);
							}
						}, 100);
					});
				});
			} else {
				res.redirect("/web/categories?type=" + type);
			}
		});
		return;
	}

	/**
	 * Update Objects to Remove Category Reference
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	var updateObjects = function(categories, cb){
		var objectTypes = ["document", "ebook", "song", "soundByte", "episode",
						   "movie", "documentary", "musicVideo", "karaokeClip",
						   "image", "application", "game", "operatingSystem",
						   "physible", "videoClip"];
		var totalUpdates = objectTypes.length * categories.length;
		var updatesComplete = 0;
		for (var i = 0; i < objectTypes.length; i++) {
			var model = null;
			switch(objectTypes[i]) {
				case "document": model = service.models.get("document"); break;
				case "ebook": model = service.models.get("ebook"); break;
				case "song": model = service.models.get("song"); break;
				case "soundByte": model = service.models.get("soundByte"); break;
				case "episode": model = service.models.get("episode"); break;
				case "movie": model = service.models.get("movie"); break;
				case "documentary": model = service.models.get("documentary"); break;
				case "musicVideo": model = service.models.get("musicVideo"); break;
				case "karaokeClip": model = service.models.get("karaokeClip"); break;
				case "image": model = service.models.get("image"); break;
				case "application": model = service.models.get("application"); break;
				case "game": model = service.models.get("game"); break;
				case "operatingSystem": model = service.models.get("operatingSystem"); break;
				case "physible": model = service.models.get("physible"); break;
				case "videoClip": model = service.models.get("videoClip"); break;
				default: break;
			}
			if(model) {
				for (var j = 0; j < categories.length; j++) {
					model.find({where: {primaryCategoryKey: categories[j]}}, function(err, objects) {
						if(objects.length <= 0) {
							updatesComplete ++;
						} else {
							var innerObjectCount = objects.length;
							var innerObjectsUpdated = 0;
							for (var k = 0; k < objects.length; k++) {
								objects[k].update({
									key: objects[i].key
								}, {
									parentCategoryKey: null
								}, function(err2, deletedObj){
									innerObjectsUpdated ++;
								});
							}
							var interval2 = setInterval(function(){
								if(innerObjectsUpdated >= innerObjectCount) {
									clearInterval(interval2);
									updatesComplete ++;
								}
							}, 100);
						}
					});
				}
			} else {
				updatesComplete += categories.length;
			}
			var interval = setInterval(function(){
				if(updatesComplete >= totalUpdates) {
					clearInterval(interval);
					cb(null, {success: true, message: "Updates Completed"});
				}
			}, 100);
		}
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