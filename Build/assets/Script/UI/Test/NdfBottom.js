var PxvUIFrameMgr = require("PxvUIFrameMgr");
var CUtil = require("CUtil");
var StfBottom = require("StfBottom");

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
            PxvUIFrameMgr.FillNodeFrame(sFile, this.node, nodePrefab);
            var btn = nodePrefab.getChildByName("Button");
            CUtil.RegisterClick(btn, this.OnBtnClick, this);//TODOJK 父级收不到TOUCH_START事件，待解决
        }.bind(this), PxvUIFrameMgr.EFrameType.Node);
    },

    OnBtnClick : function(event)
    {
        PxvUIFrameMgr.CloseNodeFrame(this);
        PxvUIFrameMgr.OpenStackFrame(new StfBottom(), null, false, false, false);
    }
});