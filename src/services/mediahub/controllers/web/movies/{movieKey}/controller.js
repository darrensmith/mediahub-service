/*!
* /web/movies/{movieKey}/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var MovieModel = null;
	var SettingModel = null;
	var FileModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		MovieModel = service.models.get("movie");
		SettingModel = service.models.get("setting");
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
		context.backButtonLink = "/web/movies";
		MovieModel.find({ "where": { key: req.params.movieKey }}, function(err,movies){
			context.movie = movies[0];
			if(context.movie.primaryCategoryKey)
				context.backButtonLink += "?category=" + context.movie.primaryCategoryKey;
			var leftnav = require("../../../../lib/leftnav.js");
			leftnav(isnode, context, function(err, cxt){
				SettingModel.find({where: {setting: "hideRevertToFile"}}, function(err2, settings){
					if(!settings || !settings[0] || settings[0].value == "no")
						cxt.showRevertToFile = true;
					else
						cxt.showRevertToFile = false;
					res.render("movies/movie-details.mustache", cxt);
				});
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
		MovieModel.find({ "where": { key: req.params.movieKey }}, function(err1, movies){
			if(!movies || err1 || !movies[0]){
				res.redirect("/web/movies");
				return;
			}
			FileModel.find({ "where": { key: movies[0].fileKey }}, function(err2, files){
				if(!files || err2 || !files[0]){
					res.redirect("/web/movies");
					return;
				}
				if(req.body.revert == "true"){
					var completed = 0;
					movies[0].destroy(function(err3, deletedMovie){
						completed ++;
					});
					FileModel.update({ 
						where: { key: movies[0].fileKey } 
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
					res.redirect("/web/movies/" + req.params.movieKey + "/edit");
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