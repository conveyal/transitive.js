var d3 = require('d3');

module.exports.run = function() {
	d3.select("body").append("span")
	    .text("Hello, world!");
}