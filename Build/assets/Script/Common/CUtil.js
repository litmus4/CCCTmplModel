var JsonTableParser = require("JsonTableParser");
var TextTableCenter = require("TextTableCenter");
var GLMaterialMgr = require("GLMaterialMgr");
var format = require("format");

var CUtil = {
    sLanguage : "zh_cn",
    atlasMap : {},

    Init : function(sLanguage, sDefFont, fnCallback)
    {
        this.sLanguage = sLanguage;
        this.sDefFont = sDefFont;

        var tabpar = new JsonTableParser();
        tabpar.Load("Atlas/AtlasMap", function(sFile, err, data){
            var sCurAtlas = "";
            while (tabpar.ReadRow())
            {
                var sAtlas = tabpar.GetValue("Atlas");
                if (sAtlas.length > 0)
                    sCurAtlas = sAtlas;
                this.atlasMap[tabpar.GetValue("Frame")] = {
                    sAtlas : sCurAtlas, bGlobal : Boolean(tabpar.GetValue("IsGlobal"))
                };
            }
            if (fnCallback)
                fnCallback();
        }.bind(this), false);
    },

    LoadSpriteFrame : function(spr, sFrame, sExAtlas)
    {
        if (!spr) return;
        
        var atlasInfo = this.atlasMap[sFrame] || (sExAtlas && {
            sAtlas : sExAtlas, bGlobal : false
        });
        if (atlasInfo)
        {
            var setFrameA = function(err, xatlas){
                if (!err)
                    spr.spriteFrame = xatlas.getSpriteFrame(sFrame);
            };
            var sLanguage = (atlasInfo.bGlobal ? this.sLanguage : "") + "/";
            var sAtlasPath = "Atlas/" + sLanguage + atlasInfo.sAtlas;
            var atlas = cc.loader.getRes(sAtlasPath, cc.SpriteAtlas);
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
            var sImagePath = "Image/" + sFrame;//只有图集支持多国语言
            var frame = cc.loader.getRes(sImagePath, cc.SpriteFrame);
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

        var visize = cc.view.getVisibleSize();
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
        if (!spr || !spr.sharedMaterials)
            return;

        if (bGray)
        {
            var shader = GLMaterialMgr.GetShader("SpriteGray");
            if (!shader)
            {
                shader = {
                    name: "SpriteGray",
                    vert: "uniform mat4 viewProj;\n\
                        uniform mat4 model;\n\
                        attribute vec3 a_position;\n\
                        attribute vec2 a_uv0;\n\
                        varying vec2 v_uv0;\n\
                        void main(){\n\
                            mat4 mvp = viewProj * model;\n\
                            gl_Position = mvp * vec4(a_position, 1);\n\
                            v_uv0 = a_uv0;\n\
                        }",
                    frag: "uniform sampler2D u_Texture;\n\
                        uniform vec4 u_color;\n\
                        varying vec2 v_uv0;\n\
                        void main(void){\n\
                            vec4 c = texture2D(u_Texture, v_uv0);\n\
                            vec3 grayc = vec3(0.299*c.r + 0.587*c.g +0.114*c.b);\n\
                            gl_FragColor = vec4(grayc.rgb, c.w) * u_color;\n\
                        }",
                };
                GLMaterialMgr.AddShader(shader);
            }
            var mtl = GLMaterialMgr.GenMaterialFromShader(shader.name);
            GLMaterialMgr.SetSpriteMaterial(spr, mtl);
        }
        else
            GLMaterialMgr.SetSpriteMaterial(spr, undefined);
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

    FakeRichText : function(sText, nodeList, nFontSize, mainColor, fnAutoLine)
    {
        var colorMap = {
            "白" : new cc.Color(255, 255, 255, 255),
            "绿" : new cc.Color(25, 225, 95, 255),
            "蓝" : new cc.Color(55, 185, 255, 255),
            "紫" : new cc.Color(215, 80, 255, 255),
            "橙" : new cc.Color(255, 175, 70, 255),
            "黄" : new cc.Color(255, 220, 65, 255),
            "红" : new cc.Color(196, 29, 41, 255),
            "灰" : new cc.Color(128, 128, 128, 255),
        };
        nFontSize = nFontSize || 20;

        if (fnAutoLine)
        {
            var sText2 = "", nStart = 0, nEnd = 0;
            var sSubShow = "", bNextIsHead = false, sHeadState = "", sLastLineHead = "";
            while (nEnd < sText.length)
            {
                var sChar = sText[nEnd];
                if (sChar === "#")
                    bNextIsHead = true;
                else if (bNextIsHead || nEnd === 0)
                {
                    bNextIsHead = false;
                    if (colorMap[sChar])
                        sHeadState = sChar;
                    else
                    {
                        sHeadState = "";
                        sSubShow += sChar;
                    }
                }
                else
                    sSubShow += sChar;
                
                nEnd++;
                var sSub = sText.slice(nStart, nEnd);
                if (fnAutoLine(sSubShow) && sChar !== "#" || nEnd >= sText.length)
                {
                    if (nStart === 0)
                        sText2 += sSub;
                    else
                        sText2 += "*" + sLastLineHead + sSub;
                    sLastLineHead = sHeadState;
                    sSubShow = "";
                    nStart = nEnd;
                }
            }
            sText = sText2;
        }

        nodeList.forEach(function(node, i){
            node.removeAllChildren();
            if (node.bAdded)
                node.removeFromParent();
        });
        var nSpaceY = null, nPosX = null;
        if (nodeList.length > 1)
        {
            nSpaceY = Math.abs(nodeList[0].y - nodeList[1].y);
            nPosX = nodeList[0].x;
        }

        var sSections = sText.split('*');
        if (sSections.length <= 1)
            sSections = sText.split('\n');
        sSections.forEach(function(sSection, i){
            var sPhrases = sSection.split('#'), nLength = 0;
            sPhrases.forEach(function(sPhrase, j){
                var sHead = sPhrase[0];
                var sContent = (colorMap[sHead] ? sPhrase.slice(1) : sPhrase);

                var nodePhrase = new cc.Node("richPhrase_" + i + "_" + j);
                var lblPhrase = nodePhrase.addComponent(cc.Label);
                lblPhrase.string = sContent;
                if (this.sDefFont) lblPhrase.fontFamily = this.sDefFont;
                lblPhrase.fontSize = nFontSize;
                nodePhrase.setAnchorPoint(0, 0.5);
                nodePhrase.position = cc.v2(nLength, 0);
                nodePhrase.color = (colorMap[sHead] || mainColor || colorMap["白"]);
                if (!nodeList[i])
                {
                    if (!nSpaceY) return 0;
                    var node = new cc.Node("richSection_" + i);
                    var nodeLast = nodeList[i - 1];
                    node.position = cc.v2(nPosX, nodeLast.y - nSpaceY);
                    nodeLast.parent.addChild(node);
                    node.bAdded = true;
                    nodeList.push(node);
                }
                nodeList[i].addChild(nodePhrase);

                nLength += nodePhrase.width;
            }.bind(this));
        }.bind(this));
        return sSections.length;
    },

    RollNumber : function(lbl, nFrom, nTo, nDuration)
    {
        if (!lbl || !lbl.node ||
            Math.floor(nFrom) !== nFrom || Math.floor(nTo) !== nTo)
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