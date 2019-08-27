/*!
* /web/television/{episodeKey}/revert/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var EpisodeModel = null;
	var FileModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		EpisodeModel = service.models.get("episode");
		FileModel = service.models.get("file");
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		EpisodeModel.find({ "where": { key: req.params.episodeKey }}, function(err1, episodes){
			if(!episodes){
				res.redirect("/web/television?message=television-episode-not-found");
				return;
			}
			FileModel.find({ "where": { key: episodes[0].fileKey }}, function(err2, files){
				if(!files){
					res.redirect("/web/television?message=file-not-found");
					return;
				}
				var completed = 0;
				episodes[0].destroy(function(err3, deletedEpisode){
					completed ++;
				});
				FileModel.update({ 
					where: { key: episodes[0].fileKey } 
				}, {
					objectType: null,
					objectKey: null
				}, function(err4, updatedFile){
					completed ++;
				});
				var interval = setInterval(function(){
					if(completed >= 2){
						clearInterval(interval);
						res.redirect("/web/television");
					}
				}, 200);		
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