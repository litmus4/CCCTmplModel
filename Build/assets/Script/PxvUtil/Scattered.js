var Scattered = {
    ReplaceG : function(str, sSrc, sDst)
    {
        var exp = new RegExp(sSrc, "g");
        return str.replace(exp, sDst);
    }
};

module.exports = Scattered;