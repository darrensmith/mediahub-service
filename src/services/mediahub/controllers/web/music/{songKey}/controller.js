/*!
* /web/music/{songKey}/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var SongModel = null;
	var SettingModel = null;
	var FileModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		SongModel = service.models.get("song");
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
		context.backButtonLink = "/web/music";
		SongModel.find({ "where": { key: req.params.songKey }}, function(err,songs){
			context.song = songs[0];
			if(context.song.primaryCategoryKey)
				context.backButtonLink += "?category=" + context.song.primaryCategoryKey;
			var leftnav = require("../../../../lib/leftnav.js");
			leftnav(isnode, context, function(err, cxt){
				SettingModel.find({where: {setting: "hideRevertToFile"}}, function(err2, settings){
					if(!settings || !settings[0] || settings[0].value == "no")
						cxt.showRevertToFile = true;
					else
						cxt.showRevertToFile = false;
					res.render("music/music-details.mustache", cxt);
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
		SongModel.find({ "where": { key: req.params.songKey }}, function(err1, songs){
			if(!songs || err1 || !songs[0]){
				res.redirect("/web/music");
				return;
			}
			FileModel.find({ "where": { key: songs[0].fileKey }}, function(err2, files){
				if(!files || err2 || !files[0]){
					res.redirect("/web/music");
					return;
				}
				if(req.body.revert == "true"){
					var completed = 0;
					songs[0].destroy(function(err3, deletedSong){
						completed ++;
					});
					FileModel.update({ 
						where: { key: songs[0].fileKey } 
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
					res.redirect("/web/music/" + req.params.songKey + "/edit");
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