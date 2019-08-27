/*!
* /web/karaoke-clips/{karaokeClipKey}/revert/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var KaraokeClipModel = null;
	var FileModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		FileModel = service.models.get("file");
		KaraokeClipModel = service.models.get("karaokeClip");
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		KaraokeClipModel.find({ "where": { key: req.params.karaokeClipKey }}, function(err1, karaokeClips){
			if(!karaokeClips){
				res.redirect("/web/karaoke-clips?message=karaoke-clip-not-found");
				return;
			}
			FileModel.find({ "where": { key: karaokeClips[0].fileKey }}, function(err2, files){
				if(!files){
					res.redirect("/web/karaoke-clips?message=file-not-found");
					return;
				}
				var completed = 0;
				karaokeClips[0].destroy(function(err3, deletedKaraokeClip){
					completed ++;
				});
				FileModel.update({ 
					where: { key: karaokeClips[0].fileKey } 
				}, {
					objectType: null,
					objectKey: null
				}, function(err4, updatedFile){
					completed ++;
				});
				var interval = setInterval(function(){
					if(completed >= 2){
						clearInterval(interval);
						res.redirect("/web/karaoke-clips");
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