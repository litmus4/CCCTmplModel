var PxvUIFrameMgr = require("PxvUIFrameMgr");
var CUtil = require("CUtil");

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
        PxvUIFrameMgr.LoadFromPrefab("Test/Bottom", this, function(sFile, nodePrefab){
            PxvUIFrameMgr.FillStackFrame(sFile, this.node, nodePrefab);
            var btn = nodePrefab.getChildByName("Button");
            CUtil.RegisterClick(btn, this.OnBtnClick, this);
            var lbl = btn.getChildByName("Label");
            lbl.string = "BottomD";//TODOJK Label设置无效
        }.bind(this), PxvUIFrameMgr.EFrameType.Stack);
    },

    OnBtnClick : function(event)
    {
        PxvUIFrameMgr.GoBackStack(this);
    }
});