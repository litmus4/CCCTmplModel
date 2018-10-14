var PxvUIFrameMgr = require("PxvUIFrameMgr");
var CUtil = require("CUtil");
var StfBottomDlg = require("StfBottomDlg");

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
        PxvUIFrameMgr.LoadFromPrefab("Test/LeftS", this, function(sFile, nodePrefab){
            PxvUIFrameMgr.FillStackFrame(sFile, this.node, nodePrefab);//TODOJK 位置错误，向右偏移了
            var btn = nodePrefab.getChildByName("Button");
            CUtil.RegisterClick(btn, this.OnBtnClick, this);
        }.bind(this), PxvUIFrameMgr.EFrameType.Stack);
    },

    OnBtnClick : function(event)
    {
        if (!this.bCanBack)
        {
            PxvUIFrameMgr.OpenStackFrame(new StfBottomDlg(), null, true, false, false);
            this.bCanBack = true;
        }
        else
            PxvUIFrameMgr.GoBackStack(this);
    }
});