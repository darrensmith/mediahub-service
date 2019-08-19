/*!
* /web/files/{fileKey}/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var FileModel = null;
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

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		FileModel = service.models.get("file");
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
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		var context = {};
		context.backButtonLink = "/web/files";
		FileModel.find({ "where": { key: req.params.fileKey}}, function(err,files){
			context.filename = files[0].filename;
			context.path = files[0].path;
			context.fileKey = req.params.fileKey;
			res.render("convert-file-to-object.mustache", context);
		});
		return;
	}

	/**
	 * POST
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.post = function(req, res){
		var title = req.body.title;
		var author = req.body.author;
		var shortDesc = req.body.shortDesc;
		var longDesc = req.body.longDesc;

		var publisher = req.body.publisher;
		var datePublished = req.body.datePublished;
		var series = req.body.series;
		var volumeNumber = req.body.volumeNumber;
		var ISBN10 = req.body.ISBN10;
		var ISBN13 = req.body.ISBN13;
		var mobiAsin = req.body.mobiAsin;
		var language = req.body.language;

		var object = req.body.object;
		var fileKey = req.body.fileKey;
		var currentDate = isnode.module("utilities").getCurrentDateInISO();
		FileModel.find({ "where": { key: fileKey}}, function(err1,files){
			if(!files[0] || err1) {
				res.redirect("/web/files?message=cannot-find-file");
			}
			var size = files[0].size;
			var md5hash = files[0].md5hash;
			var newObjKey = isnode.module("utilities").uuid4();
			switch(object) {
				case "document":
					DocumentModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						author: author,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, document){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "document",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "ebook":
					eBookModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						author: author,
						shortDesc: shortDesc,
						longDesc: longDesc,
						publisher: publisher,
						datePublished: datePublished,
						series: series,
						volumeNumber: volumeNumber,
						ISBN10: ISBN10,
						ISBN13: ISBN13,
						mobiAsin: mobiAsin,
						language: language,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, ebook){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "ebook",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "music":
					SongModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, song){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "song",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "soundByte":
					SoundByteModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, soundByte){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "soundByte",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "television":
					EpisodeModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, episode){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "episode",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "movie":
					MovieModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, movie){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "movie",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "documentary":
					DocumentaryModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, documentary){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "documentary",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "musicVideo":
					MusicVideoModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, musicVideo){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "musicVideo",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "karaokeClip":
					KaraokeClipModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, karaokeClip){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "karaokeClip",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				case "image":
					ImageModel.create({
						key: newObjKey,
						dateCreated: currentDate,
						dateLastModified: currentDate,
						fileKey: fileKey,
						title: title,
						shortDesc: shortDesc,
						longDesc: longDesc,
						size: size,
						md5hash: md5hash,
						primaryCategoryKey: null
					}, function(err2, image){
						FileModel.update({ 
							where: { key: fileKey } 
						}, {
							objectType: "image",
							objectKey: newObjKey
						}, function(err2, updatedFile){
							res.redirect("/web/files?message=file-converted-successfully");
						});
					});
					break;
				default:
					res.redirect("/web/files?message=invalid-object-type");
					break;
			}
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