define(function(require,exports,module){
	
   require("/res/scripts/mod/global/qres.js");
  
   var loader = function(url,callback,ver) {
  	  $.Qres.fetch(ver,url,callback);
   }
   return loader;
});
