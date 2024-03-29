/*!
* connector/models/File.js
*
* Copyright (c) 2019 Darren Smith and Zip Co
*/

;!function(undefined) {

	var model = function() {}

	model.define = function(isnode, schema) {
		return schema.define('File', {
			key: 				{ type: schema.String, limit: 255 },
		    path: 				{ type: schema.String, limit: 3000 },
		    type: 				{ type: schema.String, limit: 255 },
		    filename: 			{ type: schema.String, limit: 255 },
		    parentFolderKey:  	{ type: schema.String, limit: 255 },
		    dateCreated: 		{ type: schema.String, limit: 255 },
		    dateLastModified: 	{ type: schema.String, limit: 255 },
		    md5hash: 			{ type: schema.String, limit: 255 },
		    size: 				{ type: schema.String, limit: 255 },
		    objectType: 		{ type: schema.String, limit: 255 },
		    objectKey: 			{ type: schema.String, limit: 255 },
		    visible: 			{ type: schema.Boolean }
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