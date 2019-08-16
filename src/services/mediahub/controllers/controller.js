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
	var FolderModel = null;
	var FileModel = null;
	var interval = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		var router = isnode.module("router");
		router.on('sync', function() { sync(); });
		router.on('reset-sync', function() { resetSync(); });
		service = isnode.module("services").service("mediahub");
		SettingModel = service.models.get("setting");
		FolderModel = service.models.get("folder");
		FileModel = service.models.get("file");
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
		console.log("Synchronising Filesystem w/ Database...");
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
				  .on('file', function(p, s) {
				  	var fullPath = settings[0].value + "/" + p;
				  	files[fullPath] = true;
				    checkAndCreateFile(settings[0].value, p, function(err2, res){
				    	if(err2){
				    		createFiles.failed = createFiles.failed + 1;
				    	} else {
				    		createFiles.success = createFiles.success + 1;
				    	}
				    });
				  })
				  .on('error', function(err) {
				    console.error(err);
				  })
				  .on('done', function() {
				    console.log("Folders - " + createFolders.success + " created successfully, " + createFolders.failed + " failed.");
				    console.log("Files - " + createFiles.success + " created successfully, " + createFiles.failed + " failed.");
				  	removeDeletedFoldersFromDB(folders);
				  	removeDeletedFilesFromDB(files);
				    console.log('%d dirs, %d files, %d bytes', this.dirs, this.files, this.bytes);
				  })
				.walk();
			} else {
				console.log("Error: Cannot find folder setting...");
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
	var checkAndCreateFile = function(base, file, cb){
		var currentDate = isnode.module("utilities").getCurrentDateInISO();
		var fullPath = base + "/" + file;
		var fileSplit = file.split("/");
		var name = fileSplit[fileSplit.length-1];
		if(name == ".DS_Store")
			return;
		FileModel.find({ where: { path: fullPath}}, function(err, files){
			if(files && files[0] && files[0].path) {
				cb({error: "File Already Exists in DB"}, null);
			} else {
				FileModel.create({
					key : isnode.module("utilities").uuid4(),
					path : fullPath,
					filename: name,
					parentFolderKey: null,
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