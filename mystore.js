  //sessionStorage 保存临时数据
 define(function(require,exports,module){
    var Store = {

        getStorage : function() {
            return window.sessionStorage;
        },

        getItem : function(key) {
            var val = this.getStorage().getItem(key);
            return JSON.parse(val);
        },
        setItem : function(key, value) {
            value = JSON.stringify(value);
            try {
                this.getStorage().setItem(key, value);
            } catch (oException) {
                if (oException.name == 'QuotaExceededError') {
                    console.log('已经超出本地存储限定大小！');
                    // 可进行超出限定大小之后的操作，如下面可以先清除记录，再次保存
                    Storage.getStorage().clear();
                    Storage.setItem(key, value);
                }
            }
        }
        
    };
    
    module.exports = Store;
    
  });