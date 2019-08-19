/*!
* connector/models/operatingSystem.js
*
* Copyright (c) 2019 Darren Smith and Zip Co
*/

;!function(undefined) {

	var model = function() {}

	model.define = function(isnode, schema) {
		return schema.define('OperatingSystem', {
			key: 				{ type: schema.String, limit: 255 },
		    fileKey: 			{ type: schema.String, limit: 255 },
		    dateCreated: 		{ type: schema.String, limit: 255 },
		    dateLastModified: 	{ type: schema.String, limit: 255 },
		    title: 				{ type: schema.String, limit: 255 },
		    author: 			{ type: schema.String, limit: 255 },
		    shortDesc: 			{ type: schema.String, limit: 255 },
		    longDesc: 			{ type: schema.String, limit: 255 },
		    size: 				{ type: schema.String, limit: 255 },
		    md5hash: 			{ type: schema.String, limit: 255 },
		    primaryCategoryKey: { type: schema.String, limit: 255 }
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
		console.log("ERROR: Model cannot be executed independently as it is an isnode application library only.");
	} else { 
		module.exports = model;
	}
}();