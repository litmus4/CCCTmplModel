var EventCenter = {
    EKey: {
        //
    },

    delegateMap: {},

    Register: function(eKey, fnCallback, obj)
    {
        if (!fnCallback) return;

        var delegate = this.delegateMap[eKey];
        if (!delegate)
        {
            delegate = {
                listMap: {},
                Do: function(param)
                {
                    for (var syKey in this.listMap)
                    {
                        var listener = this.listMap[syKey];
                        listener.objs.forEach(function(curObj, i){
                            if (curObj === "function")
                                listener.fn(param);
                            else
                                listener.fn.call(curObj, param);
                        });
                    }
                }
            };
            this.delegateMap[eKey] = delegate;
        }

        var syKey = Symbol.for(fnCallback.toString());
        var listener = delegate.listMap[syKey];
        if (!listener)
        {
            listener = {
                fn: fnCallback,
                objs: [obj || "function"]
            };
            delegate.listMap[syKey] = listener;
        }
        else
            listener.objs.push(obj || "function");
    },

    UnRegister: function(eKey, fnCallback, obj)
    {
        if (!fnCallback) return;

        var delegate = this.delegateMap[eKey];
        if (!delegate) return;

        var syKey = Symbol.for(fnCallback.toString());
        var listener = delegate.listMap[syKey];
        if (listener)
        {
            for (var i = listener.objs.length - 1; i >= 0; --i)
            {
                var curObj = listener.objs[i];
                if (curObj === (obj || "function"))
                    listener.objs.splice(i, 1);
            }
            if (listener.objs.length === 0)
                delete delegate.listMap[syKey];
        }
    },

    SendEvent: function(eKey, param)
    {
        var delegate = this.delegateMap[eKey];
        if (delegate)
            delegate.Do(param);
    },

    Clear: function(eKey)
    {
        if (eKey === undefined)
        {
            for (eKey in this.delegateMap)
                delete this.delegateMap[eKey];
        }
        else
            delete this.delegateMap[eKey];
    }
};

module.exports = EventCenter;