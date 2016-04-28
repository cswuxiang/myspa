/**
 * myspa2.0������ myspa 2.0.1
 * @author lowinwu
 */
define(function(require,exports,module){
	
	var mystore = require("./mystore.js"),
	    myEvent = require("./myevent.js");
    //��������Ӧ��������ģ��
     //���ʻ�
    var i18n,
        global     =  window,
        myspa      =  {isStart:false},
        qs         =    "q_mymyspa",
        rquickExpr =  /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/;
   
   
   //�Ƴ������¼�
    var ZeptEvenNames = ['input','swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
    'doubleTap', 'tap', 'singleTap', 'longTap','focusin','focusout','focus','blur','load','resize','scroll','unload',
    'click','dblclick','mousedown','mouseup','mousemove','mouseover','mouseout','mouseenter','mouseleave',
  'change','select','keydown','keypress','keyup','error'].join(" ");
    
 
  
  myspa.myEvent = myEvent;
   
  /*
   * Ĭ��·��
   */
  var defaultUIOptions = {
    path: '',                               //·������ע���
    script:'',  
    isAutoShow:true,                      //�Ƿ�Ĭ����ʾ������Ĭ����ʾ
    init: function() {},                  //��ʼ���ص�����
    beforeinit: function() {},            //��ǰ�ص�
    afterinit: function() {},             //�򿪺�ص�
    beforeclose: function() {},           //�ر�ǰ�ص�
    afterclose: function() {}             //�رպ�ص�
  }
  
  
  var firemothod = function(module,method,options){
      var arg = Array.prototype.slice.call(options);
      arg.splice(0,1);
      if(module && module[method]){
         module[method].apply(module,arg);
      }
  }
  
  //���Ӷ����߼�����ҳ���л�
  myEvent.on("beforeinit",function(module){
      firemothod(module,"beforeinit",arguments);
  });
  
   myEvent.on("init",function(module){
     //������������
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
        //ע��Դ
        routers:{},
        
        _curentHash:'',//���浱ǰhash
        
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
                if(myspa.routers[options.path]){//����
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
                    //����router
                    myspa.r($.extend({path:path},module));
                    
                    //1 ע����view ,2 ����init���� 3�������� 4 �Զ����ص�ǰ�ڵ�
                    myEvent.emit('beforeinit',module,arg);
                    
                    //����ģ���������� title class��
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
                    
                    //���浱ǰ·��
                    myspa.signLocaton({state:{path:path},type:true});
                });
            }else{
                alert('�޶�Ӧ·�ɣ�' + uiModule['script']);
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
        
        //1/�ڱ���ҳ����,2#ȡҳ����Ԫ��html 3,ȡ����html; ����ҳ������view
        injectView:function(id,html){
            if(!html)return;
            var matchs = html.match(/^#(\w*)/);
            if(matchs && matchs.length == 2){
                if(matchs[1] == id){//�ڱ���ҳ����
                    this.setHtml(null,$("#"+id).html());
                }else if(!rquickExpr.exec(html)){//ȡҳ����Ԫ��html
                    html = $(html).html();
                }
            }else{
                this.setHtml(id,html);
            }
        },
        //ȥ��������¼��Լ����滺������
        clearData:function(elems){
            elems = elems || [];
            //ȥ���¼�
            for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
                $.event&&$.event.remove&&$.event.remove(elem,ZeptEvenNames);
            }
        },
        getAllNodes:function(view){
            return view&&view[0]&&view[0].getElementsByTagName("*")
        },
        //����html
        setHtml:function(id,html){
            //Ĭ����view-container�ϣ�ͳһ��һ���ڵ��ϣ����ڿ���ʱ������ҳ�ӽڵ�d
            var viewContainer = $("#"+id);
            var view = viewContainer.length == 0 ? $(".view-container") : viewContainer;
            //���¼�
            this.clearData(this.getAllNodes(view));
            //ע��
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
            //Ĭ��Ϊfalse
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
                 // hack��΢�ŵ�webview���޷��޸�document.title�����  
                var $iframe = $('<iframe style="display:none;" src="about:blank" ></iframe>').on('load', function() { 
                             setTimeout(function() {   
                                       $iframe.off('load').remove()     
                                     }, 10)  
                             }).appendTo($body);
            }
        },
        //ע��
        regRouter : function(path,type){
            //������ҳ��
            if(path == "index"){
                if(this._curentHash){ //ˢ��url�а���hash
                   if(path !== this._curentHash){
                       myspa.hashWrite = true;//��Ҫ����hashchange���¼���Ⱦ
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
            //pathΪ����
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
             
             if(this._curentHash != curRequest.path){//�����ظ�����
                
                this.outerRun(lstRequest,curRequest);
                
                if(myspa.isStart){
                     this._startRouter(curRequest,arg);
                }
             }
             
             //��һ��������ˢ�´���
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
        //������·��
        // 1,���õ�ǰurl��Ŀ¼
        initRun:function(options,arg){
            options =  options || {};
           
            myspa.rootPath = options.rootPath;
            myspa.defaultRouter = options.defaultRouter;
            i18n = options.i18n;
            //·�ɴ���
            var matchs = location.search.match(/page=([^&]*)(&|$)/);
                match = RegExp.$1;
            if(matchs && match){
                match = match.replace("%2F","/");
                location.hash = match;
                myspa.defaultRouter = match;
                myspa.hashWrite = true;
            }else if(location.hash){//ˢ�´���
                myspa.defaultRouter = location.hash.replace("#","");
            }else{
                location.hash = myspa.defaultRouter;
                myspa.hashWrite = true;
            }
            //ע�ᵱǰ·��
            myspa.r({
               path: myspa.defaultRouter,//���ص�
               script: myspa.rootPath+"/"+myspa.defaultRouter+".js"
            });
            //��������
            myspa.startRun();
            
            myspa.isStart = true;
        },
        //��ȡҪ������·��
        getBootRouter:function(path){
            var router = myspa.routers[path];
            if(!router) {//ע����·��
                myspa.r({
                   path: path,//���ص�
                   script: this.rootPath+"/"+path+".js"
                });
            }
            return myspa.routers[path];
        },
        //back request,save before data and excute,mobile refesh can excute onpopstate
        //no support propstate,apply onhashchage
        monitorRouter:function(){
              //�������ʱ������������
              this._saveCurentHash();
              //��������
              window.onhashchange = function(){
                   if(myspa.hashWrite){//д�Ĳ�������change
                        myspa.hashWrite = false;
                   }else{//���˵Ĳ���
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
