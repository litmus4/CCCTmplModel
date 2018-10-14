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
            var btn = nodePrefab.getChildByName("Button");
            CUtil.RegisterClick(btn, this.OnBtnClick, this);
            var lbl = btn.getChildByName("Label");
            lbl.string = "BottomS";//TODOJK Label设置无效
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