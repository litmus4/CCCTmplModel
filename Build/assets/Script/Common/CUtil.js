var JsonTableParser = require("JsonTableParser");

var CUtil = {
    sLanguage : "zh_cn",
    atlasMap : {},
    tempShaders : {},//TODOJK 以后添加自定义管理器

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

    SpriteLoadFrame : function(spr, sFrame, sExAtlas)
    {
        if (!spr) return;
        
        var sAtlas = this.atlasMap[sFrame] || sExAtlas;
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
    },

    ForeachNodeRecursive : function(node, fnCallback, bComp)
    {
        if (!node || !fnCallback)
            return;
        
        fnCallback(node, false);
        if (bComp)
        {
            node._components.forEach(function(comp, i){
                fnCallback(comp, true);
            });
        }

        node.children.forEach(function(child, i){
            this.ForeachNodeRecursive(child, fnCallback, bComp);
        }.bind(this));
    },

    ChangeParent : function(node, parentNew)
    {
        if (!node || !node.parent || !parentNew)
            return;
        
        var posWorld = node.parent.convertToWorldSpaceAR(node.position);
        node.position = parentNew.convertToNodeSpaceAR(posWorld);
        node.removeFromParent(false);
        parentNew.addChild(node);
    },

    SetSpriteGray : function(spr, bGray)
    {
        if (!spr || !spr._sgNode)
            return;

        if (bGray)
        {
            var shader = this.tempShaders["SpriteGray"];
            if (!shader)
            {
                var sVS = "attribute vec4 a_position;\n" +
                "attribute vec2 a_texCoord;\n" +
                "attribute vec4 a_color;\n" +
                "varying vec4 v_fragmentColor;\n" +
                "varying vec2 v_texCoord;\n" +
                "void main()\n" +
                "{\n" +
                "gl_Position = CC_PMatrix * a_position;\n" +
                "v_fragmentColor = a_color;\n" +
                "v_texCoord = a_texCoord;\n" +
                "}";

                var sFS = "#ifdef GL_ES\n" +
                "precision mediump float;\n" +
                "#endif\n" +
                "varying vec4 v_fragmentColor;\n" +
                "varying vec2 v_texCoord;\n" +
                "void main(void)\n" +
                "{\n" +
                "vec4 c = texture2D(CC_Texture0, v_texCoord);\n" +
                "vec3 grayc = vec3(0.299*c.r + 0.587*c.g +0.114*c.b);\n" +
                "gl_FragColor = vec4(grayc.rgb, c.w) * v_fragmentColor;\n" +
                "}";

                shader = new cc.GLProgram();
                shader.initWithString(sVS, sFS);
                shader.link();
                shader.updateUniforms();
                this.tempShaders["SpriteGray"] = shader;
            }
            spr._sgNode.setShaderProgram(shader);
        }
        else
            spr._sgNode.setState(0);
    },

    SetSpriteGrayRecursive : function(node, bGray)
    {
        this.ForeachNodeRecursive(node, function(obj, bComp){
            if (bComp)
                this.SetSpriteGray(obj, bGray);
        }.bind(this), true);
    },

    SetColorRecursive : function(node, color)
    {
        this.ForeachNodeRecursive(node, function(obj, bComp){
            if (obj.color)
                obj.color = color;
        }.bind(this), false);
    },

    RegisterClick : function(node, fnCallback, obj)
    {
        if (!node || !fnCallback)
            return;

        node.on(cc.Node.EventType.TOUCH_START, function(event){
            //TODOJK 播放音效
        });
        node.on(cc.Node.EventType.TOUCH_END, function(event){
            if (obj)
                fnCallback.call(obj, event);
            else
                fnCallback(event)
        });
    }
};

module.exports = CUtil;