var JsonTableParser = require("JsonTableParser");
var LoadController = require("LoadController");

var OtherTableCenter = {
    globalParamParser : null,

    Init : function()
    {
        var sFolder = "DataTables/OtherTable/";

        this.globalParamParser = new JsonTableParser();
        this.globalParamParser.Load(sFolder + "GlobalParam", LoadController.GetCheckFunc(), true);
    },

    Release : function()
    {
        this.globalParamParser = null;
    },

    GetGlobalParamRow : function(sID)
    {
        return this.globalParamParser.GetRow(sID);
    }
};

module.exports = OtherTableCenter;