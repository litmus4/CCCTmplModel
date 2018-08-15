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
        this.node = new cc.Node();
        PxvUIFrameMgr.LoadFromPrefab("Test/Left", this, function(sFile, nodePrefab){
            PxvUIFrameMgr.FillNodeFrame(sFile, this.node, nodePrefab);
        }.bind(this), PxvUIFrameMgr.EFrameType.Node);
    }
});