var JsonTableParser = require("JsonTableParser");

var CUtil = {
    sLanguage : "zh_cn",
    atlasMap : {},

    Init : function(sLanguage, fnCallback)
    {
        this.sLanguage = sLanguage;

        var tabpar = new JsonTableParser();
        tabpar.Load("Atlas/AtlasMap", function(sFile, err, data){
            var sCurAtlas = "";
            while (tabpar.ReadRow())
            {
                var sAtlas = tabpar.GetValue("Atlas");
                if (sAtlas.length > 0)
                    sCurAtlas = sAtlas;
                this.atlasMap[tabpar.GetValue("Frame")] = sCurAtlas;
            }
            if (fnCallback)
                fnCallback();
        }.bind(this), false);
    },

    SpriteLoadFrame : function(spr, sFrame){
        var sAtlas = this.atlasMap[sFrame];
        if (sAtlas)
        {
            var setFrameA = function(err, xatlas){
                if (!err)
                    spr.spriteFrame = xatlas.getSpriteFrame(sFrame);
            };
            var sAtlasPath = "Atlas/" + this.sLanguage + "/" + sAtlas;
            var atlas = cc.loader.getRes(sAtlasPath);
            if (!atlas)
                cc.loader.loadRes(sAtlasPath, cc.SpriteAtlas, setFrameA);
            else
                setFrameA(null, atlas);
        }
        else
        {
            var setFrame = function(err, xframe){
                if (!err)
                    spr.spriteFrame = xframe;
            };
            var sImagePath = "Image/" + this.sLanguage + "/" + sFrame;
            var frame = cc.loader.getRes(sImagePath);
            if (!frame)
                cc.loader.loadRes(sImagePath, cc.SpriteFrame, setFrame);
            else
                setFrame(null, frame);
        }
    }
};

module.exports = CUtil;