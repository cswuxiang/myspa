myspa
====
基于seajs及seajs-text.js.

实现：

+ 路由去中心化
+ 模块化开发
+ 增量加载
+ 性能优化
+ 增加国际化方案
+ 增加事件性能优化
+ 增加统一消息机制



----------

> 接口说明
      
     
1. 启动单页面化

      `var  myspa = require("../../myspa.js");`

        myspa.initRun({
           i18n     : null                 //是否加入 国际化,
           rootPath : "weixin/hkwallet/js",//路由前缀
           defaultRooer:"index"            //默认路由
       })


         
2. 注册事件

     `var  myspa = require("../../myspa.js");`
  
       myspa.on("beforeinit",function(lstmodule,curmodule){
       
         
        //添加测速
        //...
       
       })
       
       
3. 路由开发
     .
   
    ```
    
      var tpl = require("././index.html");
      var Index = {
      
          body : tpl ,
          hideView:true,//是否不显示此模块
          bodyClass: "rec-money",
          beforeinit:function(){//渲染前处理
              
              this.title = "xxx";
          },
          init:funciton(){//主要逻辑处理
          
          
          
          },
          afterinit:function(){//渲染完处理
            
          }，
          
          bintEvent:function(){//注册事件
          
            
             myspa.on("tap",function(){
             
             },"el");
             
             myspa.on("click",function(){
             
             },"el");
          
          }
      
      }
    
     return Index;
     ```

4. 模块通信
>发送页面

     ```
    var  myspa = require("../../myspa.js");
    myspa.boot("detail",{param1:"xxx",param2:"yyy"}
       
     ```
>接收页面
     ```
      var tpl = require("././detail.html");
      var Detail = {
      
          body : tpl ,
          hideView:true,//是否不显示此模块
          bodyClass: "rec-money",
          beforeinit:function(options){//渲染前处理
              
             this.params = options && options[0];
          },
          init:funciton(){//主要逻辑处理
          
          
          
          }
          
      }
       
    
     ```


-  案例

    ![移动单页面应用案例1](http://www.lowinwu.com/blog/h5w/qrcode/myspa.png)
