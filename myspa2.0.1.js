/**
 * myspa2.0升级版 myspa 2.0.1
 * @author lowinwu
 */
define(function(require,exports,module){
	
	var mystore = require("./mystore.js"),
	    myEvent = require("./myevent.js");
    //引用整个应用依赖的模块
     //国际化
    var i18n,
        global     =  window,
        myspa      =  {isStart:false},
        qs         =    "q_mymyspa",
        rquickExpr =  /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/;
   
   
   //移除綁定事件
    var ZeptEvenNames = ['input','swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap','focusin','focusout','focus','blur','load','resize','scroll','unload',
    'click','dblclick','mousedown','mouseup','mousemove','mouseover','mouseout','mouseenter','mouseleave',
  'change','select','keydown','keypress','keyup','error'].join(" ");
    
 
  
  myspa.myEvent = myEvent;
   
  /*
   * 默认路由
   */
  var defaultUIOptions = {
    path: '',                               //路由名，注入点
    script:'',  
    isAutoShow:true,                      //是否默认显示出来，默认显示
    init: function() {},                  //初始化回调函数
    beforeinit: function() {},            //打开前回调
    afterinit: function() {},             //打开后回调
    beforeclose: function() {},           //关闭前回调
    afterclose: function() {}             //关闭后回调
  }
  
  
  var firemothod = function(module,method,options){
      var arg = Array.prototype.slice.call(options);
      arg.splice(0,1);
      if(module && module[method]){
         module[method].apply(module,arg);
      }
  }
  
  //增加额外逻辑：如页面切换
  myEvent.on("beforeinit",function(module){
      firemothod(module,"beforeinit",arguments);
  });
  
   myEvent.on("init",function(module){
     //处理属性问题
     myspa.changeClass(module.path,module);
     myspa.changeTitle(module.path,module);
     myspa.changeView(module.path,module);
  });
  
  myEvent.on("afterinit",function(module){
       firemothod(module,"afterinit",arguments);
  });
  
  myEvent.on("beforeclose",function(module){
      firemothod(module,"beforeclose",arguments);
  });
  
  myEvent.on("afterclose",function(module){
      firemothod(module,"afterclose",arguments);
  });
  
 
  
    var myspa = $.extend(myspa,{
        //注册源
        routers:{},
        
        _curentHash:'',//保存当前hash
        
        _saveCurentHash:function(){
            this._curentHash = location.hash && location.hash.replace("#","");
        },
        r :function(options){
            var args = Array.prototype.slice.call(arguments, 1)
            if(args.length > 1) {
              $.each(args, function(i, panel) {
                myspa.r(panel)
              })
              return false
            }
            if(options.path) {
                if(myspa.routers[options.path]){//更新
                    myspa.routers[options.path] = $.extend(myspa.routers[options.path], options);
                }else{
                    myspa.routers[options.path] = $.extend({}, defaultUIOptions, options);
                }
            }
            
        },
        //
        innerBoot:function(path,arg){
            var uiModule = this.getBootRouter(path);
                
            var curPage = this._curentHash;
            //load module
            if(uiModule['script']){
                seajs.use([uiModule['script']],function(module){
                    
                    if(!module) return ;
                    //更新router
                    myspa.r($.extend({path:path},module));
                    
                    //1 注册上view ,2 运行init方法 3、传参数 4 自动隐藏当前节点
                    myEvent.emit('beforeinit',module,arg);
                    
                    //处理模块属性问题 title class等
                    myspa.changeView(path,module);
                    myspa.changeClass(path,module);
                    myspa.changeTitle(path,module);
                    //insert animate
                    
                    if(uiModule.animate) {
                        transitPage($("#"+path), $("#"+curPage), uiModule.animate, function(){
                            module.init.call(module,$("#"+path),arg);
                        })
                    }else{
                        module.init.call(module,$("#"+path),arg);
                    }
                    
                    myEvent.emit('afterinit',module,arg);
                    
                    //保存当前路由
                    myspa.signLocaton({state:{path:path},type:true});
                });
            }else{
                alert('无对应路由：' + uiModule['script']);
            }
            
            //store arg
            if(arg && arg.length > 0){
                  mystore.setItem(qs + "_" + uiModule['script'],arg);
            }
            
        },
        boot:function(path){
            var uiModule = myspa.getBootRouter(path);
              arg = Array.prototype.slice.call(arguments);
            arg.splice(0,1);
            
            //value from session
            if(arg && arg.length == 0){
                arg = mystore.getItem(qs+"_"+uiModule['script'])
            }
             myspa.startRun(uiModule,arg);
        },
        
        //1/在本身页面上,2#取页面上元素html 3,取线上html; 隐藏页面其它view
        injectView:function(id,html){
            if(!html)return;
            var matchs = html.match(/^#(\w*)/);
            if(matchs && matchs.length == 2){
                if(matchs[1] == id){//在本身页面上
                    this.setHtml(null,$("#"+id).html());
                }else if(!rquickExpr.exec(html)){//取页面上元素html
                    html = $(html).html();
                }
            }else{
                this.setHtml(id,html);
            }
        },
        //去掉缓存的事件以及上面缓存数据
        clearData:function(elems){
            elems = elems || [];
            //去除事件
            for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
                $.event&&$.event.remove&&$.event.remove(elem,ZeptEvenNames);
            }
        },
        getAllNodes:function(view){
            return view&&view[0]&&view[0].getElementsByTagName("*")
        },
        //设置html
        setHtml:function(id,html){
            //默认在view-container上，统一在一个节点上，利于开发时，在首页加节点d
            var viewContainer = $("#"+id);
            var view = viewContainer.length == 0 ? $(".view-container") : viewContainer;
            //清事件
            this.clearData(this.getAllNodes(view));
            //注入
            view.html(i18n?i18n.processString(html):html);
        },
        changeView:function(id,module){
            this.hideAllView(module);
            module&&module.body&&this.injectView(id,module.body);
            this.showView(id,module);
        },
        hideAllView:function(){
            var lstRequest = myspa.getRunModule(this._curentHash);
            var lstViewDom = $("#"+lstRequest.path);
            if(lstRequest && lstViewDom.length > 0){
                lstRequest.hideView = typeof(lstRequest.hideView) == "undefined" ? true : !!lstRequest.hideView;
                if(!!lstRequest.hideView){
                    lstViewDom.addClass("hide");
                }
            }
            $(".view-container").addClass("hide");
        },
        showView :function(id,module){
            //默认为false
            var isAutoShow = typeof(module.isAutoShow) == "undefined" ? true : !!module.isAutoShow;
            if($("#"+id).length == 0){
                isAutoShow && $(".view-container").removeClass("hide");
            }else{
                isAutoShow && $("#"+id).removeClass("hide");
                this.clearData(this.getAllNodes($("#"+id)));
            }
        },
        showApp:function(){
            $(".view-container").removeClass("hide");
        },
        changeClass:function(id,module){
            module.bodyClass && $("body").removeAttr("class").addClass(module.bodyClass + " " + (i18n?i18n.getApplang():""));
        },
        changeTitle:function(id,module){
            if(module.title){
                var $body = $('body');  
                document.title =  module.title;
                 // hack在微信等webview中无法修改document.title的情况  
                var $iframe = $('<iframe style="display:none;" src="about:blank" ></iframe>').on('load', function() { 
                             setTimeout(function() {   
                                       $iframe.off('load').remove()     
                                     }, 10)  
                             }).appendTo($body);
            }
        },
        //注册
        regRouter : function(path,type){
            //回退首页面
            if(path == "index"){
                if(this._curentHash){ //刷新url中包含hash
                   if(path !== this._curentHash){
                       myspa.hashWrite = true;//不要触发hashchange中事件渲染
                   }
                }
                
            }else if(type){
                if(location.hash !== "#"+path){
                    location.hash = "#"+path;
                    myspa.hashWrite = true;
                }
            }
        },
     
        // myspa.signLocaton({state:{path:pathName},func:func});
        signLocaton : function(obj){
            //path为必填
            if(! obj.state || ! obj.state.path){
                throw 'require state.path';
            }
            myspa.pushHash(obj.state.path,obj.type);
            myspa._saveCurentHash();
        },
        pushHash : function(path,type){
            myspa.regRouter(path,type);
        },
        getLastRunModule:function(){
            return myspa.getRunModule(this._curentHash)
        },
        getRunModule:function(hash){
            hash =  hash || location.hash;
            var request = myspa.getBootRouter(hash.replace("#",""));
            return request;
        },
        //enter fire
        innerRun:function(request,arg){
             if($.isFunction(request)){
                  request()
             }else if($.isPlainObject(request)){
                  myspa.innerBoot(request["path"],arg);
             }
        },
        //outer fier
        outerRun:function(lstRequest,curRequest){
            if($.isPlainObject(lstRequest) || $.isPlainObject(curRequest)){
                  myEvent.emit('beforeclose',lstRequest,curRequest);
                  myEvent.emit('afterclose',lstRequest,curRequest);
            }
        },
        startRun:function(curRequest,arg){
             var curRequest = curRequest || myspa.getRunModule();
             var lstRequest = myspa.getRunModule(this._curentHash);
            
            //value from session
             arg = arg ? arg:mystore.getItem(qs+"_"+curRequest['script']);
             
             if(this._curentHash != curRequest.path){//避免重复请求
                
                this.outerRun(lstRequest,curRequest);
                
                if(myspa.isStart){
                     this._startRouter(curRequest,arg);
                }
             }
             
             //第一次启动，刷新处理
             if(!myspa.isStart){
                myspa.isStart = true;
                this._startRouter(curRequest,arg);
             }
        },
        _startRouter:function(curRequest,arg){
             if(!curRequest) return ;
             curRequest.isclose = typeof curRequest.isclose =='undefined' ? false : !!curRequest.isclose;
             if(!curRequest.isclose){
                this.innerRun(curRequest,arg);
             }
        },
        //初化化路由
        // 1,设置当前url根目录
        initRun:function(options,arg){
            options =  options || {};
           
            myspa.rootPath = options.rootPath;
            myspa.defaultRouter = options.defaultRouter;
            i18n = options.i18n;
            //路由处理
            var matchs = location.search.match(/page=([^&]*)(&|$)/);
                match = RegExp.$1;
            if(matchs && match){
                match = match.replace("%2F","/");
                location.hash = match;
                myspa.defaultRouter = match;
                myspa.hashWrite = true;
            }else if(location.hash){//刷新处理
                myspa.defaultRouter = location.hash.replace("#","");
            }else{
                location.hash = myspa.defaultRouter;
                myspa.hashWrite = true;
            }
            //注册当前路由
            myspa.r({
               path: myspa.defaultRouter,//挂载点
               script: myspa.rootPath+"/"+myspa.defaultRouter+".js"
            });
            //加载运行
            myspa.startRun();
            
            myspa.isStart = true;
        },
        //获取要启动的路由
        getBootRouter:function(path){
            var router = myspa.routers[path];
            if(!router) {//注册新路由
                myspa.r({
                   path: path,//挂载点
                   script: this.rootPath+"/"+path+".js"
                });
            }
            return myspa.routers[path];
        },
        //back request,save before data and excute,mobile refesh can excute onpopstate
        //no support propstate,apply onhashchage
        monitorRouter:function(){
              //解决调回时，不发生触发
              this._saveCurentHash();
              //监听触发
              window.onhashchange = function(){
                   if(myspa.hashWrite){//写的操作引起change
                        myspa.hashWrite = false;
                   }else{//回退的操作
                        myspa.startRun();
                   }
             };
        }
    });
    
    myspa.monitorRouter();
    
    module.exports = {
    	on    : function(){
                             var arg = Array.prototype.slice.call(arguments);
                             arg.splice(0,1);
                             return myEvent.on.apply(myEvent,arg);
                },
    	boot  : myspa.boot,
    	initRun: myspa.initRun
    }
});
