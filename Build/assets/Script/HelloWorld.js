var JsonTableParser = require("JsonTableParser");
var LoadController = require("LoadController");
var TextTableCenter = require("TextTableCenter");
var OtherTableCenter = require("OtherTableCenter");
var CUtil = require("CUtil");

cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        label1: {
            default: null,
            type: cc.Label
        },
        label2: {
            default: null,
            type: cc.Label
        },
        cocos: {
            default: null,
            type: cc.Sprite
        },
        sprite1: {
            default: null,
            type: cc.Sprite
        },
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!',
        sText1s: [],
        nLoadCount: 0,
        nLoadMax: 0
    },

    // use this for initialization
    onLoad: function () {
        this.label.string = this.text;

        var tabpar = new JsonTableParser();
        this.nLoadMax++;
        tabpar.Load("DataTables/test/array_test", function(sFile, err, data){
            this.nLoadCount++;
            this.sText1s[0] = "";
            while (tabpar.ReadRow())
            {
                this.sText1s[0] += String(tabpar.GetValue("HP"));
                this.sText1s[0] += " ";
            }
            this.checkOnAllLoaded();
        }.bind(this), false);

        this.nLoadMax++;
        tabpar.Load("DataTables/test/map_test", function(sFile, err, data){
            this.nLoadCount++;
            var row = tabpar.GetRow("BS002");
            this.sText1s[1] = row.Name + " ";
            this.checkOnAllLoaded();
        }.bind(this), true);

        this.nLoadMax++;
        LoadController.Reset(function(nProgress){
            console.log("&&&&& Table Loading Progress : %d%", Math.floor(nProgress * 100));
        }, function(){
            this.nLoadCount++;
            this.sText1s[2] = TextTableCenter.GetText("5") +
                TextTableCenter.GetCaptionByTag("C0") +
                OtherTableCenter.GetGlobalParamRow("5").Desc;
            this.checkOnAllLoaded();
        }.bind(this));
        TextTableCenter.Init("zh_cn", true);
        OtherTableCenter.Init();

        CUtil.Init("zh_cn", function(){
            CUtil.LoadSpriteFrame(this.sprite1, "pxc_small");
            CUtil.SetSpriteGrayRecursive(this.cocos.node, true);
            CUtil.SetColorRecursive(this.cocos.node, new cc.Color(255, 0, 0, 255));
            this.cocos.node.runAction(cc.sequence(cc.delayTime(1), cc.callFunc(function(){
                CUtil.SetSpriteGrayRecursive(this.cocos.node, false);
                CUtil.SetColorRecursive(this.cocos.node, new cc.Color(255, 255, 255, 255));
                CUtil.ChangeParent(this.sprite1.node, this.label.node);
                this.label.node.runAction(cc.moveBy(0.5, cc.p(20, 0)));
            }, this)));
        }.bind(this));

        CUtil.RegisterClick(this.sprite1.node, this.onSprite1NodeClick, this);
        CUtil.RegisterPush(this.cocos.node, this.onCocosNodeClick, this.onCocosNodeHold, this);
        var clsCheck = CUtil.GetClsCheckMoveRadian(function(nRad){
            return (nRad >= Math.PI * 3 / 4 || nRad <= -Math.PI * 3 / 4);
        }, 3, 1);
        CUtil.RegisterClickOrMove(this.label.node, this.onLabelNodeClick, this.onLabelNodeMove, this, null, clsCheck);
    },

    // called every frame
    update: function (dt) {

    },

    checkOnAllLoaded: function() {
        if (this.nLoadCount === this.nLoadMax)
        {
            this.label1.string = "";
            this.sText1s.forEach(function(sText, i){
                this.label1.string += sText;
            }.bind(this));
            this.label2.string = "-20";
        }
    },

    onSprite1NodeClick: function(event)
    {
        this.scaleCocosAndRollLabel2(1.2);
        this.label1.string += CUtil.FormatCaption(true, "C1", 9);
    },

    onCocosNodeClick: function(event)
    {
        this.scaleCocosAndRollLabel2(1.4);
    },

    onCocosNodeHold: function(event)
    {
        this.scaleCocosAndRollLabel2(1);
    },

    onLabelNodeClick: function(event)
    {
        this.scaleCocosAndRollLabel2(1.4);
    },

    onLabelNodeMove: function(event)
    {
        this.scaleCocosAndRollLabel2(1);
    },

    scaleCocosAndRollLabel2: function(nScale)
    {
        var nLastScale = this.cocos.node.scale;
        this.cocos.node.scale = nScale;
        var bRoll = false, nFrom = -20, nTo = -20;

        if (nLastScale > 1)
        {
            bRoll = !bRoll;
            nFrom = (nLastScale > 1.3 ? 20 : -17);
        }
        
        if (nScale > 1)
        {
            bRoll = !bRoll;
            nTo = (nScale > 1.3 ? 20 : -17);
        }
        
        if (bRoll)
            CUtil.RollNumber(this.label2, nFrom, nTo);
        else
            this.label2.string = String(nTo);
    },
});
