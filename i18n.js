// Generated by CoffeeScript 1.9.3

/*
 * i18n核心模块 #

用于加载与调用i18n数据并调用，可配合 shtml或其它模板语言 进行数据加载。使用方法:
```
require(["i18n"],function(i18n){
  // 添加数据组
  i18n.addData("en-us",{"HELLO":"Hello", "EN_KEY":"English Only Value"})
  i18n.addData("zh-cn",{"HELLO":"你好"})

  console.log(i18n("HELLO")); //输出"你好"
  console.log(i18n("EN_KEY")); //回退到默认的en-us，输出"English Only Value"
  var tmpl = i18n.invokeTemplate("_{HELLO} <%=name%>") //准备模板
  console.log(tmpl({name:"世界"})) //输出"你好世界"
});
```

方法说明
- `i18n(key):(String)i18nString` //返回当前语言的key键的内容
- `i18n.addData(lang ,json):(Void)` //添加数据到指定语言
- `i18n.setLanguage(lang)：(Void)` //设置使用的语言，默认为en-us
- `i18n.getLanguage():(String)language` //获取当前使用的语言
- `i18n.processString(string):(String)i18nString`  //使用`_{KEY}`的方式进行模板替换，已经自动进行了escape与trim等操作
    用法： `_{KEY}` //escape输出，使用 _.escape 方法进行安全编码
- `i18n.invokeTemplate(template):(String)templateString` // 预处理underscore模板，当为字符串模板时先进行i18n转换再进行包装
- `i18n.wxSetLanguage():(Void)` // 获取微信内的语言设置。url中带 language=xxxx 时会覆盖 userAgent 里的配置。
- ~~`i18n.prepareTemplate(string):(Function)template` // 使用下列模板语言编译生成模板字符串~~ *DELETED*, use `processString` instead

// @waterwu
 */

define(function(require,exports,module){
	
  var _ = $;
  
  
  
  
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

    var I18nClass, _last, _trim, i18n;
    _trim = function(str) {
      return str.replace(/^\s+|\s+$/gm, '');
    };
    _last = function(arr) {
      return arr[arr.length - 1];
    };
    I18nClass = (function() {
      function I18nClass(key) {
        var _handler;
        _handler = (function(_this) {
          return function() {
            return _this.getValue.apply(_handler, arguments);
          };
        })(this);
        _.extend(_handler, this);
        return _handler;
      }


      I18nClass.prototype.data = {};

      I18nClass.prototype.defaultLanguage = "zh_hk";


      I18nClass.prototype.getApplang = function(){
            var usragent = navigator.userAgent.toLowerCase();
               usragent.match(/\/(zh_hk|en|\S*)$/);
               var lang = RegExp.$1;
               if(!lang || lang == 'zh_tw'){
               	 lang = "zh_hk"
               }
               
               var goodLangs = ["zh_hk","zh_tw","zh_cn","en"].join("|");
               if(goodLangs.indexOf(lang) < 0){
               	  lang = "zh_hk";
               }
               lang = "zh_hk";
            return lang;
      },
      I18nClass.prototype.getLanguage = function() {
        return this.getApplang();
      };

      I18nClass.prototype.processString = function(string) {
        var regx;
        regx = /_{([^}]*)}/g;
        return string.replace(regx, (function(_this) {
          return function(matched, part) {
            return _this.getValue($.filterScript(_trim(part)));
          };
        })(this));
      };

      I18nClass.prototype.invokeTemplate = function(tmpl) {
        if (typeof tmpl === "string") {
          tmpl = this.processString(tmpl);
          return tmpl;
        } else {
          return (function(_this) {
            return function(data) {
              var html;
              html = tmpl(data);
              return _this.processString(html);
            };
          })(this);
        }
      };

      I18nClass.prototype.addData = function(lang, json) {

        /* 添加i18n数据, 后来的会覆盖前面的, 模块内容请放到深层对象中 */
        this.data[lang] = this.data[lang] || {};
        return _.extend(this.data[lang], json);
      };

      I18nClass.prototype.getValue = function(key, lang) {
        /* 主要方法，通过key获取内容，返回的key的i18n内容，没有内容则返回not exists的内容提示，
          支持`.`符号进行深层查询
         */
        var ret;
        if (lang == null) {
          lang = this.getLanguage();
        }
        ret = this.data[lang];
        _.each(key.split("."), function(index,fragment) {
          if (!ret[fragment]) {
            return ret = fragment;
          }
          if (fragment !== "") {
            return ret = ret[fragment];
          }
        });
        if (!ret) {

          /* 当前语言没有则读默认语言 */
          if (lang === this.defaultLanguage) {
            ret = null;
          } else {
            ret = this.getValue(key, this.defaultLanguage);
          }
        }
        return ret || key;
      };

      I18nClass.prototype.setLanguage = function(lang) {

        /* 设置当前语言 */
        this.currentLanguage = lang;
        document.body.setAttribute("data-lang", lang);
        return setTimeout((function(_this) {
          return function() {
            if (!_this.data[lang]) {
              return console.log("[i18n]WARNING: No lang data added:" + lang);
            }
          };
        })(this), 500);
      };

      return I18nClass;

    })();
    I18nClass.loader = function(url,callback) {
    	 _.getJSON(url, function(data) {
              i18n.addData(i18n.getLanguage(), data);
              callback && callback();
         });
    }
    
    i18n = new I18nClass();
    i18n.I18nClass = I18nClass;
    return i18n;
});
