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
            CUtil.SpriteLoadFrame(this.sprite1, "pxc_small.png");
        }.bind(this));
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
        }
    },
});
