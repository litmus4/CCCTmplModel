var PxvUIFrameMgr = require("PxvUIFrameMgr");

cc.Class({
    extends : cc.Component,

    properties : {
        node : {
            default : null,
            type : cc.Node,
            override : true
        }
    },

    ctor : function()
    {
        this.node = new cc.Node();//FLAGJK node未定义
        PxvUIFrameMgr.LoadFromPrefab("Test/Left", this, function(sFile, nodePrefab){
            PxvUIFrameMgr.FillNodeFrame(sFile, this.node, nodePrefab);
        }, PxvUIFrameMgr.EFrameType.Node);
    }
});