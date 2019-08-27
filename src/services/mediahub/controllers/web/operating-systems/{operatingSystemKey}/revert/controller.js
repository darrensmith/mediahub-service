/*!
* /web/operating-systems/{operatingSystemKey}/revert/controller.js
*
* Copyright (c) 2019 Darren Smith
* Licensed under the LGPL license.
*/

;!function(undefined) {

	var ctrl = {};
	var isnode = null;
	var service = null;
	var OperatingSystemModel = null;
	var FileModel = null;

	/**
	 * Initialises the controller
	 * @param {object} isnodeObj - The parent isnode object
	 */
	ctrl.init = function(isnodeObj){
		isnode = isnodeObj;
		service = isnode.module("services").service("mediahub");
		FileModel = service.models.get("file");
		OperatingSystemModel = service.models.get("operatingSystem");
		return;
	}

	/**
	 * GET
	 * @param {object} req - Request object
	 * @param {object} res - Response object
	 */
	ctrl.get = function(req, res){
		OperatingSystemModel.find({ "where": { key: req.params.operatingSystemKey }}, function(err1, operatingSystems){
			if(!operatingSystems){
				res.redirect("/web/operating-systems?message=operating-system-not-found");
				return;
			}
			FileModel.find({ "where": { key: operatingSystems[0].fileKey }}, function(err2, files){
				if(!files){
					res.redirect("/web/operating-systems?message=file-not-found");
					return;
				}
				var completed = 0;
				operatingSystems[0].destroy(function(err3, deletedGame){
					completed ++;
				});
				FileModel.update({ 
					where: { key: operatingSystems[0].fileKey } 
				}, {
					objectType: null,
					objectKey: null
				}, function(err4, updatedFile){
					completed ++;
				});
				var interval = setInterval(function(){
					if(completed >= 2){
						clearInterval(interval);
						res.redirect("/web/operating-systems");
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