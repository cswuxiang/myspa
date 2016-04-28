 //消息事件
 define(function(require,exports,module){
 
   //唯一性
   function uniqueId() {
      return (new Date).getTime()
   }
    
 	
  var myEvent = {
    
     msg:{},
     
     on:function(type,fn,target,id,params,context){
        if(target){
            $(".view-container").delegate(target,type,fn); 
            return ;
        }
        
        this.msg[type] = this.msg[type] || [];
        this.msg[type].push({
            id    : id ? id : uniqueId(),
            target:target,
            fn:fn,
            params:params,
            context:context
        });
       return $.SPA
     },
     off:function(type, id){
        var __Msgs = this.msg;
        if (!id) { //没有id,则删除事件名称下所有处理函数
            delete __Msgs[type];
        } else {
            var _o = __Msgs[type] || [];
            for (var i in _o) {
                if (_o[i].id == id) {
                    _o.splice(i--, 1);
                    break;
                }
            }
        }
        return this;
     },
     emit:function(type){
        
         return function(center, args, queue, reValue, guid, o) {
              var queue = center[type]||[];
              for (var i = 0, j = queue.length; i < j; i++) {
                  o = queue[i];
                  o.fn && o.fn.apply(o.target, args);
              }
            
         }(myEvent.msg, Array.prototype.slice.call(arguments, 1));
        
     }
  };
  module.exports = myEvent;

 });