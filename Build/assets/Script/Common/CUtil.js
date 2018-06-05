var JsonTableParser = require("JsonTableParser");
var TextTableCenter = require("TextTableCenter");
var format = require("format");

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

    LoadSpriteFrame : function(spr, sFrame, sExAtlas)
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

    AdaptVisible : function(node)
    {
        if (!node) return;

        var visize = cc.director.getVisibleSize();
        var nScaleW = visize.width / node.width;
        var nScaleH = visize.height / node.height;
        node.scale = Math.max(nScaleW, nScaleH);
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
        }, false);
    },

    RegisterClick : function(node, fnCallback, obj)
    {
        if (!node || !fnCallback)
            return;

        node.on(cc.Node.EventType.TOUCH_START, function(event){
            //TODOJK 播放音效
            event.stopPropagation();
        });
        node.on(cc.Node.EventType.TOUCH_END, function(event){
            if (obj)
                fnCallback.call(obj, event);
            else
                fnCallback(event);
            event.stopPropagation();
        });
    },

    IsTouchMoved : function(event, nPrecision)
    {
        nPrecision = nPrecision || 2;
        var posPrevLoc = event.getPreviousLocation();
        var posCurLoc = event.getLocation();
        return Math.abs(posPrevLoc.x - posCurLoc.x) >= nPrecision ||
            Math.abs(posPrevLoc.y - posCurLoc.y) >= nPrecision;
    },

    RegisterPush : function(node, fnOnClick, fnOnHold, obj, nHoldDelay)
    {
        if (!node || !fnOnClick || !fnOnHold)
            return;
        
        var nOffsetNum = 0;
        var delayAction = null;
        var bHold = false;
        var nOffsetMax = 3;
        node.on(cc.Node.EventType.TOUCH_START, function(event){
            nOffsetNum = 0;
            delayAction = node.runAction(cc.sequence(cc.delayTime(nHoldDelay || 1), cc.callFunc(function(){
                bHold = true;
                if (obj) fnOnHold.call(obj, event);
                else fnOnHold(event);
            })));
            //TODOJK 播放音效
            event.stopPropagation();
        });
        node.on(cc.Node.EventType.TOUCH_MOVE, function(event){
            if (this.IsTouchMoved(event))
                nOffsetNum++;
            if (nOffsetNum > nOffsetMax && delayAction)
            {
                node.stopAction(delayAction);
                delayAction = null;
            }
            event.stopPropagation();
        }.bind(this));
        var onEnd = function(event)
        {
            if (bHold)
                bHold = false;
            else
            {
                if (delayAction)
                {
                    node.stopAction(delayAction);
                    delayAction = null;
                }
                if (nOffsetNum <= nOffsetMax)
                {
                    if (obj) fnOnClick.call(obj, event);
                    else fnOnClick(event);
                }
            }
            event.stopPropagation();
        };
        node.on(cc.Node.EventType.TOUCH_END, onEnd);
        node.on(cc.Node.EventType.TOUCH_CANCEL, onEnd);
    },

    RegisterClickOrMove : function(node, fnOnClick, fnOnMove, obj, nPrecision, clsCheck)
    {
        if (!node || !fnOnClick || !fnOnMove)
            return;
        
        var nOffsetNum = 0;
        var bMoved = false;
        var fnCheck = null;
        var nOffsetMax = 3;
        node.on(cc.Node.EventType.TOUCH_START, function(event){
            nOffsetNum = 0;
            if (clsCheck)
                fnCheck = clsCheck(event);
            //TODOJK 播放音效
            event.stopPropagation();
        });
        node.on(cc.Node.EventType.TOUCH_MOVE, function(event){
            var bOffset = this.IsTouchMoved(event, nPrecision);
            if (bOffset)
                nOffsetNum++;
            if (!bMoved)
            {
                var bCheckOK = (fnCheck ? fnCheck(event, bOffset, nOffsetNum) : true);
                if (nOffsetNum > nOffsetMax && bCheckOK)
                {
                    if (obj) fnOnMove.call(obj, event);
                    else fnOnMove(event);
                    bMoved = true;
                    fnCheck = null;
                }
            }
            event.stopPropagation();
        }.bind(this));
        var onEnd = function(event)
        {
            if (bMoved)
                bMoved = false;
            else if (nOffsetNum <= nOffsetMax)
            {
                if (obj) fnOnClick.call(obj, event);
                else fnOnClick(event);
            }
            fnCheck = null;
            event.stopPropagation();
        };
        node.on(cc.Node.EventType.TOUCH_END, onEnd);
        node.on(cc.Node.EventType.TOUCH_CANCEL, onEnd);
    },

    GetClsCheckMoveRadian : function(fnRadianIn, nStatisNum, nMinRightNum)
    {
        return function(_)
        {
            var nRightNum = 0;
            return function(event, bOffset, nOffsetNum)
            {
                if (!bOffset) return false;
                if (nOffsetNum <= nStatisNum)
                {
                    var posPrevLoc = event.getPreviousLocation();
                    var posCurLoc = event.getLocation();
                    var nRad = Math.atan2(posCurLoc.y - posPrevLoc.y, posCurLoc.x - posPrevLoc.x);
                    if (fnRadianIn(nRad))
                        nRightNum++;
                }
                return (nOffsetNum >= nStatisNum && nRightNum >= nMinRightNum);
            };
        };
    },

    FormatCaption : function(bTag, sForm)
    {
        var sCap = bTag ? TextTableCenter.GetCaptionByTag(sForm) : TextTableCenter.GetCaption(sForm);
        if (sCap.length > 0)
            sForm = sCap;
        var args = [].slice.call(arguments, 1);
        if (args.length > 1)
        {
            args[0] = sForm;
            return format.apply(null, args);
        }
        return sForm;
    },

    RollNumber : function(lbl, nFrom, nTo, nDuration)
    {
        if (!lbl || !lbl.node ||
            Math.floor(nFrom) != nFrom || Math.floor(nTo) != nTo)
            return;
        lbl.string = String(nFrom);

        nDuration = nDuration || 1;
        var nInterval = 0.05;
        var nCount = Math.floor(nDuration / nInterval);
        var nDiff = nTo - nFrom;
        if (Math.abs(nDiff) < nCount)
        {
            nCount = Math.max(Math.abs(nDiff), 1);
            nInterval = +((nDuration / nCount).toFixed(2));
        }

        var nTick = Math.floor(nDiff / nCount), i = 0;
        lbl.node.stopAllActions();
        lbl.node.runAction(cc.repeatForever(
            cc.sequence(cc.delayTime(nInterval), cc.callFunc(function(){
                i++;
                if (i < nCount)
                {
                    nFrom += nTick;
                    lbl.string = String(nFrom);
                }
                else
                {
                    lbl.node.stopAllActions();
                    lbl.string = String(nTo);
                }
            }))
        ));
    }
};

module.exports = CUtil;