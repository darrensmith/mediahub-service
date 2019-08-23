/*!
* lib/leftnav.js
*
* Builds the left hand nav based on user settings
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var isnode = null;
	var service = null;
	var SettingModel = null;

	/**
	 * Initialises the library
	 * @param {object} isnode - The parent isnode object
	 * @param {object} context - The original context from the controller
	 * @param {function} cb - Callback function
	 */
	var lib = function(isnodeObj, context, cb){

		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		SettingModel = service.models.get("setting");

		SettingModel.find({ where: {}}, function(err, settings) {
			var setting = "";
			var hideSystemSettings = "no";
			var hideSignOutLink = "no";
			var hideFilesLink = "no";
			var hideCategoriesLink = "no";
			var announcement = "";
			for (var i = 0; i < settings.length; i++) {
				if(settings[i].setting == "showObjectTypes"){
					setting = settings[i].value;
				}
				if(settings[i].setting == "hideSystemSettings"){
					hideSystemSettings = settings[i].value;
				}
				if(settings[i].setting == "hideSignOutLink"){
					hideSignOutLink = settings[i].value;
				}
				if(settings[i].setting == "hideFilesLink"){
					hideFilesLink = settings[i].value;
				}
				if(settings[i].setting == "announcement"){
					announcement = settings[i].value;
				}			
			}

			if(announcement) {
				context.announcement = announcement;
			}

			var objects = setting.split(" ");

			context.leftnav  = "";
			context.leftnav += "<p><i class=\"fas fa-home\"></i><a href=\"/web\">Home</a></p>\n";
			
			if(objects.includes("documents") || objects.includes("ebooks")){
				context.leftnav += "<p style=\"margin-top:50px;\"><strong>Reading Material</strong></p>\n";
				if(objects.includes("documents"))
					context.leftnav += "<p><i class=\"fas fa-file-alt\"></i><a href=\"/web/documents\">Documents</a></p>\n";
				if(objects.includes("ebooks"))
					context.leftnav += "<p><i class=\"fas fa-book\"></i><a href=\"/web/ebooks\">eBooks</a></p>\n";
			}

			if(objects.includes("music") || objects.includes("soundBytes")){
				context.leftnav += "<p style=\"margin-top:50px;\"><strong>Audio</strong></p>\n";
				if(objects.includes("music"))
					context.leftnav += "<p><i class=\"fas fa-music\"></i><a href=\"/web/music\">Music</a></p>\n";
				if(objects.includes("soundBytes"))
					context.leftnav += "<p><i class=\"fas fa-file-audio\"></i><a href=\"/web/sound-bytes\">Sound Bytes</a></p>\n";
			}

			if(objects.includes("television") || objects.includes("movies") || objects.includes("documentaries") || objects.includes("musicVideos") || objects.includes("karaokeClips") || objects.includes("videoClips")){
				context.leftnav += "<p style=\"margin-top:50px;\"><strong>Video</strong></p>\n";
				if(objects.includes("television"))
					context.leftnav += "<p><i class=\"fas fa-tv\"></i><a href=\"/web/television\">Television Series</a></p>\n";
				if(objects.includes("movies"))
					context.leftnav += "<p><i class=\"fas fa-ticket-alt\"></i><a href=\"/web/movies\">Movies</a></p>\n";
				if(objects.includes("documentaries"))
					context.leftnav += "<p><i class=\"fas fa-film\"></i><a href=\"/web/documentaries\">Documentaries</a></p>\n";
				if(objects.includes("musicVideos"))
					context.leftnav += "<p><i class=\"fas fa-volume-up\"></i><a href=\"/web/music-videos\">Music Videos</a></p>\n";
				if(objects.includes("karaokeClips"))
					context.leftnav += "<p><i class=\"fas fa-volume-down\"></i><a href=\"/web/karaoke-clips\">Karaoke Clips</a></p>\n";
				if(objects.includes("videoClips"))
					context.leftnav += "<p><i class=\"fas fa-video\"></i><a href=\"/web/video-clips\">Video Clips</a></p>\n";
			}

			if(objects.includes("applications") || objects.includes("games") || objects.includes("operatingSystems")){
				context.leftnav += "<p style=\"margin-top:50px;\"><strong>Software</strong></p>\n";
				if(objects.includes("applications"))
					context.leftnav += "<p><i class=\"fas fa-tablet-alt\"></i><a href=\"/web/applications\">Applications</a></p>\n";
				if(objects.includes("games"))
					context.leftnav += "<p><i class=\"fas fa-gamepad\"></i><a href=\"/web/games\">Games</a></p>\n";
				if(objects.includes("operatingSystems"))
					context.leftnav += "<p><i class=\"fab fa-ubuntu\"></i>&nbsp;&nbsp;<a href=\"/web/operating-systems\">Operating Systems</a></p>\n";
			}

			if(objects.includes("physibles")){
				context.leftnav += "<p style=\"margin-top:50px;\"><strong>Physibles</strong></p>\n";
				context.leftnav += "<p><i class=\"fas fa-paw\"></i><a href=\"/web/physibles\">Physibles</a></p>\n";
			}

			if(objects.includes("images")){
				context.leftnav += "<p style=\"margin-top:50px;\"><strong>Images</strong></p>\n";
				context.leftnav += "<p><i class=\"fas fa-images\"></i><a href=\"/web/images\">Images</a></p>\n";
			}

			if(hideFilesLink == "yes" && hideSystemSettings == "yes" && hideSignOutLink == "yes") {
				null;
			} else {
				context.leftnav += "<p style=\"margin-top:50px;\"><strong>System</strong></p>\n";
			}
			if(hideFilesLink == "no") {
				context.leftnav += "<p><i class=\"fas fa-file\"></i><a href=\"/web/files\">Files</a></p>\n";
			}
			if(hideCategoriesLink == "no") {
				context.leftnav += "<p><i class=\"fas fa-images\"></i><a href=\"/web/categories\">Categories</a></p>\n";
			}
			if(hideSystemSettings == "no") {
				context.leftnav += "<p><i class=\"fas fa-cogs\"></i><a href=\"/web/system\">System Settings</a></p>\n";
			}
			if(hideSignOutLink == "no") {
				context.leftnav += "<p><i class=\"fas fa-sign-out-alt\"></i><a href=\"/web/sign-out\">Sign Out</a></p>\n";
			}
			cb(null, context);

		});
		return;
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
		module.exports = lib;
	}
}();