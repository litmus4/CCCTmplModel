var PxvUIFrameMgr = require("PxvUIFrameMgr");
var CUtil = require("CUtil");
var StfLeft = require("StfLeft");

cc.Class({
    extends : cc.Component,

    properties : {
        node : {
            default : null,
            type : cc.Node,
            override : true
        },
        bCanBack : false
    },

    ctor : function()
    {
        this.node = new cc.Node();
        PxvUIFrameMgr.LoadFromPrefab("Test/Bottom", this, function(sFile, nodePrefab){
            PxvUIFrameMgr.FillStackFrame(sFile, this.node, nodePrefab);
            var nodeBtn = nodePrefab.getChildByName("Button");
            CUtil.RegisterClick(nodeBtn, this.OnBtnClick, this);
            var lbl = nodeBtn.getChildByName("Label").getComponent(cc.Label);
            lbl.string = "BottomS";
        }.bind(this), PxvUIFrameMgr.EFrameType.Stack);
    },

    OnBtnClick : function(event)
    {
        if (!this.bCanBack)
        {
            PxvUIFrameMgr.OpenStackFrame(new StfLeft(), null, false, false, false);
            this.bCanBack = true;
        }
        else
            PxvUIFrameMgr.GoBackStack(this);
    }
});