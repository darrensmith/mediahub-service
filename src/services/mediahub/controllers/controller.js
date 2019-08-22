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
	var DocumentaryModel = null;
	var DocumentModel = null;
	var eBookModel = null;
	var EpisodeModel = null;
	var ImageModel = null;
	var KaraokeClipModel = null;
	var SongModel = null;
	var MovieModel = null;
	var MusicVideoModel = null;
	var SoundByteModel = null;
	var ApplicationModel = null;
	var GameModel = null;
	var OperatingSystemModel = null;
	var PhysibleModel = null;
	var VideoClipModel = null;
	var ObjectStatsModel = null;
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
		ApplicationModel = service.models.get("application");
		GameModel = service.models.get("game");
		OperatingSystemModel = service.models.get("operatingSystem");
		PhysibleModel = service.models.get("physible");
		VideoClipModel = service.models.get("videoClip");
		ObjectStatsModel = service.models.get("objectStats");
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
			if(settings && settings[0] && settings[0].value) {
				var reindexFreq = settings[0].value;
				interval = setInterval(function(){
					sync();
				}, reindexFreq * 1000);
			}
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
				filewalker(settings[0].value, { maxPending: 10 })
				  .on('dir', function(p) {
				  	var fullPath = settings[0].value + "/" + p;
				    checkAndCreateFolder(settings[0].value, p, function(err2, res){
				    	if(err2){
				    		folders[fullPath] = err2.key;
				    		createFolders.failed = createFolders.failed + 1;
				    	} else {
				    		folders[fullPath] = res.key;
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
					    checkAndCreateFile(settings[0].value, p, s, completeHash, function(err2, res){
					    	if(err2){
					    		files[fullPath] = err2.key;
					    		createFiles.failed = createFiles.failed + 1;
					    	} else {
					    		files[fullPath] = res.key;
					    		createFiles.success = createFiles.success + 1;
					    	}
					    });
				  	});
				  })
				  .on('error', function(err) {
				  	log("error","MediaHub Filesystem Sync > " + err);
				  })
				  .on('done', function() {
				  	var folderCount = createFolders.success + createFolders.failed;
				  	var fileCount = createFiles.success + createFiles.failed;
				  	var interval = setInterval(function(){
				  		if((createFolders.success + createFolders.failed) > folderCount || (createFiles.success + createFiles.failed) > fileCount) {
				  			folderCount = createFolders.success + createFolders.failed;
				  			fileCount = createFiles.success + createFiles.failed;
				  		} else {
				  			clearInterval(interval);
						  	log("debug","MediaHub Filesystem Sync > Folders - " + createFolders.success + " created successfully, " + createFolders.failed + " failed.");
						    log("debug","MediaHub Filesystem Sync > Files - " + createFiles.success + " created successfully, " + createFiles.failed + " failed.");
						  	removeDeletedFoldersFromDB(folders);
						  	removeDeletedFilesFromDB(files);
						  	setParentFolderOnFolders(folders);
						  	setParentFolderOnFiles(files, folders);
						  	log("debug","MediaHub Filesystem Sync > " + this.dirs + " dirs, " + this.files + " files, " + this.bytes + " bytes");
				  		}
				  	}, 500);
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
		var name = folderSplit.pop();
		var parentFolder = folderSplit.join("/");
		FolderModel.find({ where: { path: fullPath}}, function(err, folders){
			if(folders && folders[0] && folders[0].path) {
				cb({error: "Folder Already Exists in DB", key: folders[0].key}, null);
			} else {
				var key = isnode.module("utilities").uuid4();
				FolderModel.create({
					key : key,
					path : fullPath,
					folderName: name,
					parentFolder: parentFolder,
					dateCreated: currentDate,
					dateLastModified: currentDate
			    }, function(err, newFolder){
			    	if(err || !newFolder) {
			    		cb({error: err, key: key}, null);
			    	} else {
			    		cb(null, {
			    			success: newFolder,
			    			key: key
			    		});
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
	var checkAndCreateFile = function(base, file, stats, hash, cb){
		var fs = require("fs");
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
				if(files[0].md5hash != hash || files[0].size != stats.size){
					FileModel.update({ 
						where: { path: fullPath }
					}, {
						md5hash: hash,
						size: stats.size
					}, function(err, updatedFile){
						if(file[0].objectType != null && file[0].objectKey != null) {
							var fields = {
								md5hash: hash, 
								size: stats.size
							}
							updateObject(file[0].objectType, file[0].objectKey, fields);
						}
					});
				}
				cb({error: "File Already Exists in DB", key: files[0].key}, null);
			} else {
				FileModel.find({ "where": { md5hash: hash, size: stats.size, type: ext }}, function(err2, files2){
					if(!files2[0]) {
						var input = { hash: hash, stats: stats, ext: ext, fullPath: fullPath, name: name, currentDate: currentDate, cb: cb };
						searchStatsAndCreateFile(input);
					} else {
						var missing = null;
						for (var i = 0; i < files2.length; i++) {
							try {
							  if (!fs.existsSync(files2[i].path)) {
							  	missing = files2[i].key;
							  	break;
							  }
							} catch(err) {
							  	missing = files2[i].key;
							  	break;
							}
						}
						if(missing) {
							FileModel.update({
								key: missing
							}, {
								path: fullPath,
								filename: name
							}, function(err3, updatedFile) {
						    	if(err || !updatedFile) {
						    		cb({error: err, key: missing}, null);
						    	} else {
						    		cb(null, {
						    			success: updatedFile,
						    			key: missing
						    		});
						    	}
							});
						} else {
							var input = { hash: hash, stats: stats, ext: ext, fullPath: fullPath, name: name, currentDate: currentDate, cb: cb };
							searchStatsAndCreateFile(input);
						}
					}
				});
			}
		});
	}

	/**
	 * Update Fields on Object
	 * @param {string} objectType - Type of Object
	 * @param {string} objectKey - Key of Object Record
	 * @param {string} fields - Fields to Update
	 */
	var updateObject = function(objectType, objectKey, fields){
		var model = null;
		switch(objectType) {
			case "document": model = DocumentModel; break;
			case "ebook": model = eBookModel; break;
			case "song": model = SongModel; break;
			case "soundByte": model = SoundByteModel; break;
			case "episode": model = EpisodeModel; break;
			case "movie": model = MovieModel; break;
			case "documentary": model = DocumentaryModel; break;
			case "musicVideo": model = MusicVideoModel; break;
			case "karaokeClip": model = KaraokeClipModel; break;
			case "image": model = ImageModel; break;
			case "application": model = ApplicationModel; break;
			case "game": model = GameModel; break;
			case "operatingSystem": model = OperatingSystemModel; break;
			case "physible": model = PhysibleModel; break;
			case "videoClip": model = VideoClipModel; break;
			default: break;
		}
		if(model){
			model.update({
				where: { key: objectKey }
			}, fields, function (err, updatedObj){ });
			var statFields = {};
			if(fields.md5hash)
				statFields.md5hash = fields.md5hash;
			if(fields.size)
				statFields.size = fields.size;
			if(fields.status)
				statFields.status = fields.status;
			ObjectStatsModel.update({
				where: { objectType: objectType, objectKey: objectKey }
			}, statFields, function (err, updatedObj){ });
		}
		return;
	}

	/**
	 * Search Object Stats & Create File
	 * @param {object} input - Input Object
	 */
	var searchStatsAndCreateFile = function(input){
		ObjectStatsModel.find({ "where": { md5hash: input.hash, size: input.stats.size, status: "inactive" }}, function(err2, objectStats){
			if(!objectStats || !objectStats[0]) {
				var key = isnode.module("utilities").uuid4();
				FileModel.create({
					key : key,
					path : input.fullPath,
					type: input.ext,
					filename: input.name,
					parentFolderKey: null,
					md5hash: input.hash,
					size: input.stats.size,
					dateCreated: input.currentDate,
					dateLastModified: input.currentDate
				}, function(err, newFile){
			    	if(err || !newFile) {
			    		input.cb({error: err, key: key}, null);
			    	} else {
			    		input.cb(null, {
			    			success: newFile,
			    			key: key
			    		});
			    	}
				});								
			} else {
				var key = isnode.module("utilities").uuid4();
				FileModel.create({
					key : key,
					path : input.fullPath,
					type: input.ext,
					filename: input.name,
					parentFolderKey: null,
					md5hash: input.hash,
					size: input.stats.size,
					dateCreated: input.currentDate,
					dateLastModified: input.currentDate,
					objectType: objectStats[0].objectType,
					objectKey: objectStats[0].objectKey
				}, function(err, newFile){
			    	if(err || !newFile) {
			    		input.cb({error: err, key: key}, null);
			    	} else {
			    		input.cb(null, {
			    			success: newFile,
			    			key: key
			    		});
			    	}
				});
				ObjectStatsModel.update({
					where: { 
						objectType: objectStats[0].objectType, 
						objectKey: objectStats[0].objectKey 
					}
				}, {
					status: "active"
				}, function (err, updatedObj){ });
				updateObject(objectStats[0].objectType, objectStats[0].objectKey, {
					fileKey: key,
					status: "active"
				});
			}
		});
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
					var objectType = dbFolders[i].objectType;
					var objectKey = dbFolders[i].objectKey;
					dbFolders[i].destroy(function(err2){
						if(objectType && objectKey){
							updateObject(objectType, objectKey, {
								status: "inactive",
								objectType: "",
								objectKey: ""
							});
						}
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
					var objectType = dbFiles[i].objectType;
					var objectKey = dbFiles[i].objectKey;
					dbFiles[i].destroy(function(err2){
						if(objectType && objectKey){
							updateObject(objectType, objectKey, {
								status: "inactive",
								objectType: "",
								objectKey: ""
							});
						}
					});
				}
			}
		});
	}

	/**
	 * Sets Parent Folder on Folders
	 *
	 * @param {array} files - Array of files in filesystem
	 */
	var setParentFolderOnFolders = function(folders){
		for(var path in folders) {
			var pathSplit = path.split("/");
			pathSplit.pop();
			var parentFolder = pathSplit.join("/");
			var parentFolderKey = folders[parentFolder];
			FolderModel.update({ 
				where: { key: folders[path] }
			}, {
				parentFolderKey: parentFolderKey
			}, function(err, updatedFolder){
				null;
			});
		}
		return;
	}

	/**
	 * Sets Parent Folder on Files
	 *
	 * @param {array} files - Array of files in filesystem
	 */
	var setParentFolderOnFiles = function(files, folders){
		for(var path in files) {
			var pathSplit = path.split("/");
			pathSplit.pop();
			var parentFolder = pathSplit.join("/");
			var parentFolderKey = folders[parentFolder];
			FileModel.update({ 
				where: { key: files[path] }
			}, {
				parentFolderKey: parentFolderKey
			}, function(err, updatedFile){
				null;
			});
		}
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
		module.exports = ctrl;
	}
}();