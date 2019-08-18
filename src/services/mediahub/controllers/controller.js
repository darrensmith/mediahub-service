/*!
* system/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var SettingModel = null;
	var interval = null;
	var FileModel = null;
	var FolderModel = null;
	var DocumentModel = null;
	var eBookModel = null;
	var SongModel = null;
	var EpisodeModel = null;
	var MovieModel = null;
	var ImageModel = null;
	var SoundByteModel = null;
	var DocumentaryModel = null;
	var MusicVideoModel = null;
	var KaraokeClipModel = null;
	var log = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		log = isnode.module("logger").log;
		var router = isnode.module("router");
		router.on('sync', function() { sync(); });
		router.on('reset-sync', function() { resetSync(); });
		service = isnode.module("services").service("mediahub");
		SettingModel = service.models.get("setting");
		FileModel = service.models.get("file");
		FolderModel = service.models.get("folder");
		DocumentModel = service.models.get("document");
		eBookModel = service.models.get("ebook");
		SongModel = service.models.get("song");
		SoundByteModel = service.models.get("soundByte");
		EpisodeModel = service.models.get("episode");
		MovieModel = service.models.get("movie");
		ImageModel = service.models.get("image");
		DocumentaryModel = service.models.get("documentary");
		MusicVideoModel = service.models.get("musicVideo");
		KaraokeClipModel = service.models.get("karaokeClip");
		sync();
		startReindexLoop();
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		res.redirect("/web");
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
	 * Resets the Sync Reindex Loop
	 */
	var resetSync = function() {
		clearInterval(interval);
		startReindexLoop();
	}

	/**
	 * Starts the Reindex Loop
	 */
	var startReindexLoop = function() {
		SettingModel.find({ "where": { "setting": "reindexFreq" }}, function(err,settings){
			var reindexFreq = settings[0].value;
			interval = setInterval(function(){
				sync();
			}, reindexFreq * 1000);
		});
	}

	/**
	 * Synchronises the Filesystem w/ the Database
	 */
	var sync = function(){
		log("debug","MediaHub Filesystem Sync > Synchronising Filesystem w/ Database...");
		var files = {};
		var folders = {};
		var createFiles = {
			success: 0,
			failed: 0
		};
		var createFolders = {
			success: 0,
			failed: 0
		};
		SettingModel.find({ "where": { "setting": "folder" }}, function(err,settings){
			if(!err && settings[0]) {
				var filewalker = require("../lib/filewalker.js");
				var createHash = require('crypto').createHash;
				filewalker(settings[0].value)
				  .on('dir', function(p) {
				  	var fullPath = settings[0].value + "/" + p;
				  	folders[fullPath] = true;
				    checkAndCreateFolder(settings[0].value, p, function(err2, res){
				    	if(err2){
				    		createFolders.failed = createFolders.failed + 1;
				    	} else {
				    		createFolders.success = createFolders.success + 1;
				    	}
				    });
				  })
				  .on('stream', function(rs, p, s, completePath) {
				  	var hash = createHash('md5');
				  	rs.on('data', function(data) {
				  		hash.update(data);
				  	});
				  	rs.on('end', function(data) {
				  		var completeHash = hash.digest('hex');
					  	var fullPath = settings[0].value + "/" + p;
					  	files[fullPath] = true;
					    checkAndCreateFile(settings[0].value, p, completeHash, function(err2, res){
					    	if(err2){
					    		createFiles.failed = createFiles.failed + 1;
					    	} else {
					    		createFiles.success = createFiles.success + 1;
					    	}
					    });
				  	});
				  })
				  .on('error', function(err) {
				  	log("error","MediaHub Filesystem Sync > " + err);
				  })
				  .on('done', function() {
				  	log("debug","MediaHub Filesystem Sync > Folders - " + createFolders.success + " created successfully, " + createFolders.failed + " failed.");
				    log("debug","MediaHub Filesystem Sync > Files - " + createFiles.success + " created successfully, " + createFiles.failed + " failed.");
				  	removeDeletedFoldersFromDB(folders);
				  	removeDeletedFilesFromDB(files);
				  	log("debug","MediaHub Filesystem Sync > " + this.dirs + " dirs, " + this.files + " files, " + this.bytes + " bytes");
				  })
				.walk();
			} else {
				log("error","MediaHub Filesystem Sync > Cannot find folder setting...");
				return;
			}
		});
		return;
	}

	/**
	 * Check if Folder Exists in DB and Create if Not
	 * @param {string} base - The base path
	 * @param {string} folder - The name of the folder
	 */
	var checkAndCreateFolder = function(base, folder, cb){
		var currentDate = isnode.module("utilities").getCurrentDateInISO();
		var fullPath = base + "/" + folder;
		var folderSplit = folder.split("/");
		var name = folderSplit[folderSplit.length-1];
		FolderModel.find({ where: { path: fullPath}}, function(err, folders){
			if(folders && folders[0] && folders[0].path) {
				cb({error: "Folder Already Exists in DB"}, null);
			} else {
				FolderModel.create({
					key : isnode.module("utilities").uuid4(),
					path : fullPath,
					folderName: name,
					parentFolderKey: null,
					dateCreated: currentDate,
					dateLastModified: currentDate
			    }, function(err, newFolder){
			    	if(err || !newFolder) {
			    		cb({error: err}, null);
			    	} else {
			    		cb(null, {success: newFolder});
			    	}
				});
			}
		});
	}

	/**
	 * Check if File Exists in DB and Create if Not
	 * @param {string} base - The base path
	 * @param {string} file - The name of the file
	 */
	var checkAndCreateFile = function(base, file, hash, cb){
		var currentDate = isnode.module("utilities").getCurrentDateInISO();
		var fullPath = base + "/" + file;
		var fileSplit = file.split("/");
		var name = fileSplit[fileSplit.length-1];
		var extSplit = name.split(".");
		var ext = extSplit[extSplit.length-1];
		if(name == ".DS_Store")
			return;
		FileModel.find({ "where": { path: fullPath }}, function(err, files){
			if(files && files[0] && files[0].path == fullPath) {
				if(files[0].md5hash != hash){
					FileModel.update({ 
						where: { path: fullPath }
					}, {
						md5hash: hash
					}, function(err, updatedFile){
						if(file[0].objectType != null && file[0].objectKey != null) {
							updateHashOnObject(file[0].objectType, file[0].objectKey, hash);
						}
					});
				}
				cb({error: "File Already Exists in DB"}, null);
			} else {
				FileModel.create({
					key : isnode.module("utilities").uuid4(),
					path : fullPath,
					type: ext,
					filename: name,
					parentFolderKey: null,
					md5hash: hash,
					dateCreated: currentDate,
					dateLastModified: currentDate
				}, function(err, newFile){
			    	if(err || !newFile) {
			    		cb({error: err}, null);
			    	} else {
			    		cb(null, {success: newFile});
			    	}
				});
			}
		});
	}

	/**
	 * Check if File Exists in DB and Create if Not
	 * @param {string} objectType - Type of Object
	 * @param {string} objectKey - Key of Object Record
	 * @param {string} hash - MD5 Hash from File to Set Against Object
	 */
	var updateHashOnObject = function(objectType, objectKey, hash){
		var model = null;
		switch(objectType) {
			case "document":
				model = DocumentModel;
				break;
			case "ebook":
				model = eBookModel;
				break;
			case "song":
				model = SongModel;
				break;
			case "soundByte":
				model = SoundByteModel;
				break;
			case "episode":
				model = EpisodeModel;
				break;
			case "movie":
				model = MovieModel;
				break;
			case "documentary":
				model = DocumentaryModel
				break;
			case "musicVideo":
				model = MusicVideoModel;
				break;
			case "karaokeClip":
				model = KaraokeClipModel;
				break;
			case "image":
				model = ImageModel;
				break;
			default:
				break;
		}
		if(model){
			model.update({
				where: { key: objectKey }
			}, {
				md5hash: hash
			}, function (err, updatedObj){
				null;
			});
		}
		return;
	}

	/**
	 * Checks if there are folders in the database that are
	 * no longer present in the filesystem and then deletes them if so
	 *
	 * @param {array} folders - Array of folders in filesystem
	 */
	var removeDeletedFoldersFromDB = function(folders){
		FolderModel.find({ where: {}}, function(err, dbFolders){
			for (var i = 0; i < dbFolders.length; i++) {
				if(!folders[dbFolders[i].path]) {
					dbFolders[i].destroy(function(err2){
						null;
					});
				}
			}
		});
	}

	/**
	 * Checks if there are files in the database that are
	 * no longer present in the filesystem and then deletes them if so
	 *
	 * @param {array} files - Array of files in filesystem
	 */
	var removeDeletedFilesFromDB = function(files){
		FileModel.find({ where: {}}, function(err, dbFiles){
			for (var i = 0; i < dbFiles.length; i++) {
				if(!files[dbFiles[i].path]) {
					dbFiles[i].destroy(function(err2){
						null;
					});
				}
			}
		});
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