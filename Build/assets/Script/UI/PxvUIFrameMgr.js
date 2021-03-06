var LinkedList = require("LinkedList");
var Scattered = require("Scattered");
var CUtil = require("CUtil");
var GLMaterialMgr = require("GLMaterialMgr");
var FrameAdaptations = require("FrameAdaptations");

var PxvUIFrameMgr = {
    EFrameType : {
        Node : 1, Stack : 2
    },
    EFrameZGroup : {
        Bottom : 1, Normal : 2, Top : 3, Stack : 4
    },
    sSides : [
        "Left", "Bottom", "Right", "Top", "HorizontalCenter", "VerticalCenter"
    ],
    colorMask : new cc.Color(50, 50, 50, 150),
    sizeLayout : new cc.Size(960, 640),

    nodeLayer : null,
    vLayerPosi : null,
    nodeFrameMap : {},
    nodeFrameListTri : {},
    stackFrames : [],
    frameWaitMap : {},

    Init : function()
    {
        this.nodeLayer = cc.find("Canvas/UILayer");
        //TODOJK 有了正式游戏入口后别忘了给nodeLayer加上cc.game.addPersistRootNode
        //UILayer要与VisibleSize一致，保证居中，这样系数(0.5,0.5)就表示UI编辑场景的Canvas使用默认锚点
        this.nodeLayer.setContentSize(cc.view.getVisibleSize());
        this.vLayerPosi = cc.v2(this.nodeLayer.width * 0.5, this.nodeLayer.height * 0.5);
        this.nodeLayer.position = this.vLayerPosi.neg();

        for (var e = this.EFrameZGroup.Bottom; e < this.EFrameZGroup.Stack; ++e)
            this.nodeFrameListTri[e] = new LinkedList();
        
        this.nAdaptFlags = 0;
        ["width", "height"].forEach(function(sSizeDir, i){
            var nDiff = Math.abs(this.nodeLayer[sSizeDir] - this.sizeLayout[sSizeDir]);
            this.nAdaptFlags |= (nDiff > 0.0001 ? 1 : 0) << i;
        }.bind(this));
    },

    LoadFromPrefab : function(sFile, binder, fnCallback, eFrameType)
    {
        if (eFrameType)
        {
            if (this.nodeFrameMap[sFile])
                return false;
            if (binder)
                binder._sName = sFile;
        }

        cc.resources.load("UI/" + sFile, function(err, prefab){
            if (err)
            {
                cc.error(err.message || err);
                return;
            }

            var nodePrefab = cc.instantiate(prefab);
            if (nodePrefab)
                this._InitPrefabNode(nodePrefab, eFrameType, sFile);

            binder = binder || nodePrefab;
            if (binder)
            {
                this._BindRecursive(binder, nodePrefab);
                if (FrameAdaptations[sFile] && this.nAdaptFlags)
                    this._AdaptRecursive(nodePrefab, FrameAdaptations[sFile]);
            }

            if (fnCallback)
                fnCallback(sFile, nodePrefab);
        }.bind(this));
        return true;
    },

    _InitPrefabNode : function(nodePrefab, eFrameType, sFile)
    {
        var pos = this.vLayerPosi.add(nodePrefab.position);
        var wid = nodePrefab.getComponent(cc.Widget);
        if (eFrameType === this.EFrameType.Node)
        {
            if (!wid)
            {
                var fPfPosiX = nodePrefab.width * nodePrefab.anchorX;
                var fPfPosiY = nodePrefab.height * nodePrefab.anchorY;
                pos = pos.add(cc.v2(-fPfPosiX, -fPfPosiY));
                nodePrefab.position = cc.v2(fPfPosiX, fPfPosiY);
            }
            else
            {
                pos = this._WidgetPairquadFromComp(wid);
                this.sSides.forEach(function(sSide, i){
                    wid["isAlign" + sSide] = (i < 4);
                    if (i < 4)
                    {
                        wid["isAbsolute" + sSide] = true;
                        wid[sSide.toLowerCase()] = 0;
                    }
                });
            }

            var nodeFrameInfo = this.nodeFrameMap[sFile];
            if (!nodeFrameInfo)//[1]未加入UILayer，暂存等待信息：容器节点位置
                this._SetWait(sFile, null, pos, false);
            else
                nodeFrameInfo.pos = pos;
        }
        else if (eFrameType === this.EFrameType.Stack)
        {
            if (!wid)
                nodePrefab.position = pos;
        }
    },

    _BindRecursive : function(binder, node)
    {
        binder.nodeBind = node;

        var prefixNumMap = {};
        node._components.forEach(function(comp, i){
            var sPrefix = this._CompStringToPrefix(comp.name.split(/<|>/)[1]);
            if (!prefixNumMap[sPrefix])
            {
                binder[sPrefix + "Bind"] = comp;
                prefixNumMap[sPrefix] = 1;
            }
            else
                binder[sPrefix + "Bind" + prefixNumMap[sPrefix]++] = comp;
        }.bind(this));

        node.children.forEach(function(child, i){
            if (child.name === "_DragArea") return;
            binder[child.name] = {};
            this._BindRecursive(binder[child.name], child);
        }.bind(this));
    },

    FillNodeFrame : function(sFile, node, nodePrefab)
    {
        if (!node || !nodePrefab)
            return;
        
        node.setAnchorPoint(0, 0);
        node.setContentSize(nodePrefab.getContentSize());
        node.addChild(nodePrefab);
        
        var nodeFrameInfo = this.nodeFrameMap[sFile];
        if (nodeFrameInfo)
        {
            if (!nodeFrameInfo.node)//SetNode
            {
                nodeFrameInfo.node = node;
                node.name = Scattered.ReplaceG(sFile, "/", "#");
                node.on(cc.Node.EventType.TOUCH_START, this.OnNodeFrameFocus, this);
            }
            //强制赋值正确的位置或添加Widget组件
            if (nodeFrameInfo.pos instanceof cc.Vec2)
                node.position = nodeFrameInfo.pos;
            else
                this._AddWidgetByPairQuad(node, nodeFrameInfo.pos);
            nodeFrameInfo.bFilled = true;
        }
        else//[2]未加入UILayer，暂存等待信息：容器节点，填充标记
            this._SetWait(sFile, node, null, true);
        
        this._RegisterNodeDrag(sFile, nodePrefab);
    },

    FillStackFrame : function(sFile, node, nodePrefab)
    {
        if (!node || !nodePrefab)
            return;

        node.setAnchorPoint(0, 0);
        node.position = cc.v2(0, 0);
        node.setContentSize(this.nodeLayer.getContentSize());
        node.addChild(nodePrefab);

        var i = this.stackFrames.length - 1;
        for (; i >= 0; --i)
        {
            var stackFrameInfo = this.stackFrames[i];
            if (stackFrameInfo.frame._sName === sFile && !stackFrameInfo.bFilled)
            {
                if (!stackFrameInfo.node)//SetNode
                {
                    stackFrameInfo.node = node;
                    node.name = Scattered.ReplaceG(sFile, "/", "#");
                    node.on(cc.Node.EventType.TOUCH_START, this.OnStackFrameClick, this);
                    node.on(cc.Node.EventType.TOUCH_END, this.OnStackFrameClick, this);
                }
                if (stackFrameInfo.bMask)
                    this._AddMaskSprite(node);
                stackFrameInfo.bFilled = true;
                break;
            }
        }
        if (i < 0)//[2]未加入UILayer，暂存等待信息：容器节点，填充标记
            this._SetWait(sFile, node, null, true);
    },

    PresetWidgetOffsets : function(sFile, nLeftOrHori, nBottomOrVert, nRight, nTop)
    {
        var pairquad = null;
        var nodeFrameInfo = this.nodeFrameMap[sFile];
        if (!nodeFrameInfo)
        {
            var frameWaitInfo = this.frameWaitMap[sFile];
            if (frameWaitInfo)
                pairquad = frameWaitInfo.pos;
        }
        else
            pairquad = nodeFrameInfo.pos;
        if (!pairquad || pairquad instanceof cc.Vec2)
            return;
        
        if (nLeftOrHori && pairquad.Left && !pairquad.Left[1])
            pairquad.Left[0] += nLeftOrHori / this.nodeLayer.width;
        if (nBottomOrVert && pairquad.Bottom && !pairquad.Bottom[1])
            pairquad.Bottom[0] += nBottomOrVert / this.nodeLayer.height;
        if (nRight && typeof pairquad.Right === "object" && !pairquad.Right[1])
            pairquad.Right[0] += nRight / this.nodeLayer.width;
        if (nTop && typeof pairquad.Top === "object" && !pairquad.Top[1])
            pairquad.Top[0] += nTop / this.nodeLayer.height;
    },

    OpenNodeFrame : function(frame, sNodeName, eZGroup, bSetNode)
    {
        if (!frame || !frame._sName)
            return false;

        var nodeFrameInfo = this.nodeFrameMap[frame._sName];
        if (nodeFrameInfo)
            return false;
        
        eZGroup = eZGroup || this.EFrameZGroup.Normal;
        var zGroupList = this.nodeFrameListTri[eZGroup];
        if (!zGroupList)
            return false;

        var node = (sNodeName ? frame[sNodeName] : frame.node);
        if (!node) return false;
        this.nodeLayer.addChild(node, eZGroup);
        nodeFrameInfo = {
            frame : frame, node : null, pos : cc.v2(0, 0), bFilled : false
        };
        this.nodeFrameMap[frame._sName] = nodeFrameInfo;
        zGroupList.prepend(frame);
        
        var frameWaitInfo = this.frameWaitMap[frame._sName];
        if (frameWaitInfo)
        {//发现等待信息
            nodeFrameInfo.node = frameWaitInfo.node;//"[2]"执行后才不为null
            nodeFrameInfo.pos = frameWaitInfo.pos;//"[1]"执行后便存在
            nodeFrameInfo.bFilled = frameWaitInfo.bFilled;//"[2]"执行后为true
            delete this.frameWaitMap[frame._sName];
            bSetNode = true;
        }

        if (bSetNode)
        {
            var bFillWait = (nodeFrameInfo.node !== null);
            if (!bFillWait)//"[2]"未执行才会赋值node
                nodeFrameInfo.node = node;
            node.name = Scattered.ReplaceG(frame._sName, "/", "#");
            if (nodeFrameInfo.pos instanceof cc.Vec2)
                node.position = nodeFrameInfo.pos;
            else if (bFillWait)
                this._AddWidgetByPairQuad(node, nodeFrameInfo.pos);
            node.on(cc.Node.EventType.TOUCH_START, this.OnNodeFrameFocus, this);
        }
        return true;
    },

    OpenStackFrame : function(frame, sNodeName, bDialog, bMask, bSetNode)
    {
        if (!frame || !frame._sName)
            return false;
        
        var node = (sNodeName ? frame[sNodeName] : frame.node);
        if (!node) return false;
        this.nodeLayer.addChild(node, this.EFrameZGroup.Stack);
        var stackFrameInfo = this.stackFrames[this.stackFrames.length - 1];
        if (stackFrameInfo && !bDialog)
        {
            var nodeLast = stackFrameInfo.node;
            if (!nodeLast)//上层界面也未SetNode
            {
                var frameLast = stackFrameInfo.frame;
                nodeLast = (stackFrameInfo.sNodeName ? frameLast[stackFrameInfo.sNodeName] : frameLast.node);
            }
            if (nodeLast)
                nodeLast.removeFromParent(false);
        }
        stackFrameInfo = {
            frame : frame, sNodeName : sNodeName, node : null,
            bDialog : bDialog, bMask : bMask, bFilled : false
        };
        this.stackFrames.push(stackFrameInfo);

        var frameWaitInfo = this.frameWaitMap[frame._sName];
        if (frameWaitInfo)
        {//发现等待信息
            stackFrameInfo.node = frameWaitInfo.node;//"[2]"执行后才不为null
            stackFrameInfo.bFilled = frameWaitInfo.bFilled;//"[2]"执行后为true
            delete this.frameWaitMap[frame._sName];
            bSetNode = true;
        }

        if (bSetNode)
        {
            if (!stackFrameInfo.node)//"[2]"未执行才会赋值node
                stackFrameInfo.node = node;
            else if (bMask)
                this._AddMaskSprite(node);
            node.name = Scattered.ReplaceG(frame._sName, "/", "#");
            node.on(cc.Node.EventType.TOUCH_START, this.OnStackFrameClick, this);
            node.on(cc.Node.EventType.TOUCH_END, this.OnStackFrameClick, this);
        }
    },

    CloseNodeFrame : function(frame, bWait)
    {
        if (!frame || !frame._sName)
            return;

        var nodeFrameInfo = this.nodeFrameMap[frame._sName];
        if (nodeFrameInfo && nodeFrameInfo.node)
        {
            var eZGroup = nodeFrameInfo.node.zIndex;
            nodeFrameInfo.node.destroy();
            delete this.nodeFrameMap[frame._sName];

            var zGroupList = this.nodeFrameListTri[eZGroup];
            if (zGroupList)
                zGroupList.delete(frame);
        }

        var frameWaitInfo = this.frameWaitMap[frame._sName];
        if (bWait && frameWaitInfo && frameWaitInfo.node)
        {
            frameWaitInfo.node.destroy();
            delete this.frameWaitMap[frame._sName];
        }
    },

    GoBackStack : function(waitFrame)
    {
        var stackFrameInfo = this.stackFrames[this.stackFrames.length - 1];
        if (stackFrameInfo && stackFrameInfo.node)
        {
            var bDialog = stackFrameInfo.bDialog;
            stackFrameInfo.node.destroy();
            this.stackFrames.pop();
            stackFrameInfo = this.stackFrames[this.stackFrames.length - 1];
            if (stackFrameInfo && !bDialog)
            {
                var nodeLast = stackFrameInfo.node;
                if (!nodeLast)//上层界面也未SetNode
                {
                    var frameLast = stackFrameInfo.frame;
                    nodeLast = (stackFrameInfo.sNodeName ? frameLast[stackFrameInfo.sNodeName] : frameLast.node);
                }
                this.nodeLayer.addChild(nodeLast, this.EFrameZGroup.Stack);
            }
        }

        if (!waitFrame) return;
        var frameWaitInfo = this.frameWaitMap[waitFrame._sName];
        if (frameWaitInfo && frameWaitInfo.node)
        {
            frameWaitInfo.node.destroy();
            delete this.frameWaitMap[frame._sName];
        }
    },

    GetFrameByName : function(sName)
    {
        var frameInfo = this.nodeFrameMap[sName];
        if (frameInfo) return frameInfo.frame;

        for (var i = 0; i < this.stackFrames.length; ++i)
        {
            frameInfo = this.stackFrames[i];
            if (frameInfo.frame._sName === sName)
                return frameInfo.frame;
        }
        return null;
    },

    _SetWait : function(sFile, xnode, xpos, xbFilled)
    {
        var frameWaitInfo = this.frameWaitMap[sFile];
        if (frameWaitInfo)
        {
            if (frameWaitInfo.node)
                frameWaitInfo.node.destroy();
            if (xnode)
                frameWaitInfo.node = xnode;
            
            if (xpos)
                frameWaitInfo.pos = xpos;
            
            if (xbFilled)
                frameWaitInfo.bFilled = xbFilled;
        }
        else
        {
            this.frameWaitMap[sFile] = {
                node : xnode, pos : xpos, bFilled : xbFilled
            };
        }
    },

    _RegisterNodeDrag : function(sFile, nodePrefab)
    {
        var nodeDrag = nodePrefab.getChildByName("_DragArea");
        if (!nodeDrag) return;

        var getInfoAndNode = function()
        {
            var nodeFrameInfo = this.nodeFrameMap[sFile];
            if (nodeFrameInfo)
            {
                if (nodeFrameInfo.node)
                    return [nodeFrameInfo, nodeFrameInfo.node];
            }
            return null;
        }.bind(this);

        nodeDrag.on(cc.Node.EventType.TOUCH_START, function(event){
            var pair = getInfoAndNode();
            if (pair)
                pair[0].vTouchNega = pair[1].convertToNodeSpaceAR(event.getLocation()).neg();
        });
        nodeDrag.on(cc.Node.EventType.TOUCH_MOVE, function(event){
            var pair = getInfoAndNode();
            if (pair && pair[0].vTouchNega)
                pair[1].position = this.nodeLayer.convertToNodeSpaceAR(event.getLocation()).add(pair[0].vTouchNega);
        }, this)
        nodeDrag.on(cc.Node.EventType.TOUCH_END, function(event){
            var pair = getInfoAndNode();
            if (pair)
                delete pair[0].vTouchNega;
        });
    },

    _WidgetPairquadFromComp : function(wid)
    {
        return {//各side大写减少toLowerCase调用，提高性能
            Left : (wid.isAlignLeft ? [
                wid.left, wid.isAbsoluteLeft
            ] : (wid.isAlignHorizontalCenter && [
                wid.horizontalCenter, wid.isAbsoluteHorizontalCenter
            ])),

            Bottom : (wid.isAlignBottom ? [
                wid.bottom, wid.isAbsoluteBottom
            ] : (wid.isAlignVerticalCenter && [
                wid.verticalCenter, wid.isAbsoluteVerticalCenter
            ])),

            Right : (wid.isAlignRight ? [wid.right, wid.isAbsoluteRight] : wid.isAlignHorizontalCenter),

            Top : (wid.isAlignTop ? [wid.top, wid.isAbsoluteTop] : wid.isAlignVerticalCenter),

            nMode : wid.alignMode
        };
    },

    _AddWidgetByPairQuad : function(node, pairquad)
    {
        var wid = node.addComponent(cc.Widget);

        wid.isAlignLeft = (pairquad.Left && pairquad.Right !== true);
        wid.isAlignBottom = (pairquad.Bottom && pairquad.Top !== true);
        wid.isAlignRight = (typeof pairquad.Right === "object");
        wid.isAlignTop = (typeof pairquad.Top === "object");
        wid.isAlignHorizontalCenter = (pairquad.Right === true);
        wid.isAlignVerticalCenter = (pairquad.Top === true);

        this.sSides.forEach(function(sSide, i){
            if (wid["isAlign" + sSide])
            {
                var sPqSide = (i >= 4 ? this.sSides[i - 4] : sSide);
                wid[sSide.toLowerCase()] = pairquad[sPqSide][0];
                wid["isAbsolute" + sSide] = pairquad[sPqSide][1];
            }
        }.bind(this));

        wid.alignMode = pairquad.nMode;
        return wid;
    },

    _AddMaskSprite : function(node)
    {
        var spr = node.addComponent(cc.Sprite);
        spr.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        CUtil.LoadSpriteFrame(spr, "singleColor", null, function(){
            node.color = this.colorMask;
            var shader = GLMaterialMgr.GetShader("SpriteDlgMask");
            if (!shader)
            {
                shader = {
                    name: "SpriteDlgMask",
                    vert: "precision highp float;\n\
                        uniform mat4 cc_matViewProj;\n\
                        attribute vec3 a_position;\n\
                        attribute mediump vec2 a_uv0;\n\
                        varying mediump vec2 v_uv0;\n\
                        void main(){\n\
                            gl_Position = cc_matViewProj * vec4(a_position, 1.0);\n\
                            v_uv0 = a_uv0;\n\
                        }",
                    frag: "precision highp float;\n\
                        uniform sampler2D u_Texture;\n\
                        uniform vec4 u_color;\n\
                        varying mediump vec2 v_uv0;\n\
                        void main(void){\n\
                            vec4 color = texture2D(u_Texture, v_uv0);\n\
                            gl_FragColor = color * vec4(0.196, 0.196, 0.196, 0.588);//u_color;\n\
                        }",
                    defines: [],
                };
                GLMaterialMgr.AddShader(shader);
            }
            var mtl = GLMaterialMgr.GenMaterialFromShader(shader.name);
            mtl.SetCustomOpactiy(this.colorMask.a);
            GLMaterialMgr.SetSpriteMaterial(spr, mtl);
        }.bind(this));
    },

    _AdaptRecursive : function(parent, config)
    {
        var adaptOne = function(node, conf, groupTri)
        {
            groupTri = groupTri || [];
            var bFakePrt = (typeof conf.back === "string");
            var prt = (bFakePrt ? parent.getChildByName(conf.back) : parent);
            var prtConf = (bFakePrt ? config[conf.back] : config);
            var posOri = node.getPosition(), sizeOri = node.getContentSize();
            
            if (this.nAdaptFlags & (1 << 0) && conf.Hori)
            {
                var nDiff = this.nodeLayer.width - this.sizeLayout.width;
                groupTri[1] = this._autoAdapt(node, prt, conf.Hori, prtConf.Hori,
                    bFakePrt, ["X", "x", "width"], nDiff, groupTri[1], groupTri[0],
                    this.nodeLayer.width, posOri, sizeOri);
                if (conf.Hori.nOffset)
                    posOri.x += nDiff * conf.Hori.nOffset;
                if (conf.Hori.nSizeRatio)
                    sizeOri.width += nDiff * conf.Hori.nSizeRatio;
            }
            
            if (this.nAdaptFlags & (1 << 1) && conf.Vert)
            {
                var nDiff = this.nodeLayer.height - this.sizeLayout.height;
                groupTri[2] = this._autoAdapt(node, prt, conf.Vert, prtConf.Vert,
                    bFakePrt, ["Y", "y", "height"], nDiff, groupTri[2], groupTri[0],
                    this.nodeLayer.height, posOri, sizeOri);
                if (conf.Vert.nOffset)
                    posOri.y += nDiff * conf.Vert.nOffset;
                if (conf.Vert.nSizeRatio)
                    sizeOri.height += nDiff * conf.Vert.nSizeRatio;
            }

            node.position = posOri;
            node.setContentSize(sizeOri);
            if (typeof conf === "object")
                this._AdaptRecursive(node, conf);
            return groupTri;
        }.bind(this);

        var adaptItem = function(sKey, conf)
        {
            if (conf.Group)
            {
                var groupTri = [parent.getChildByName(sKey + conf.Group[1])];
                for (var i = conf.Group[0]; i <= conf.Group[1]; i += (conf.Group[2] || 1))
                {
                    var node = parent.getChildByName(sKey + i);
                    adaptOne(node, conf, groupTri);
                }
            }
            else
                adaptOne(parent.getChildByName(sKey), conf);
        };

        var backList = [];
        for (var sKey in config)
        {
            if (sKey === "Hori" || sKey === "Vert" || sKey === "Group" || sKey === "Back")
                continue;
            var conf = config[sKey];
            if (conf.Back)
                backList.push([sKey, conf]);
            else
                adaptItem(sKey, conf);
        }
        backList.forEach(function(backPair, i){
            adaptItem(backPair[0], backPair[1]);
        });
    },

    _autoAdapt : function(node, parent, dirConf, prtDirConf,
        bFakePrt, dirTri, nDiff, nRatio, nodeBack, nViSizeDir, posOri, sizeOri)
    {
        if (!dirConf.Auto) return nRatio;
        var bSet = !posOri;
        nViSizeDir = nViSizeDir || this.nodeLayer.getContentSize()[dirTri[2]];
        posOri = posOri || node.position;
        sizeOri = sizeOri || node.getContentSize();

        var prtAuto = prtDirConf && prtDirConf.Auto;
        var nPrtSizeDir = (prtAuto ? parent.getContentSize()[dirTri[2]] : nViSizeDir);
        var nPrtOldSizeDir = (prtAuto ? prtDirConf["old" + dirTri[2]] : nViSizeDir - nDiff);
        var nPrtPosDir = (prtAuto ? parent.position[dirTri[1]] : 0);
        var nPrtOldPosDir = (prtAuto ? prtDirConf["old" + dirTri[1]] : 0);

        var indents = this._getIndents([node, nodeBack], parent, dirConf,
            bFakePrt, dirTri[0], nPrtOldSizeDir, nPrtOldPosDir);
        if (nodeBack)
            dirConf.FrontIndent = indents[0];
        if (nRatio === undefined)
            nRatio = (nPrtSizeDir - indents[0] - indents[1]) / (nPrtOldSizeDir - indents[0] - indents[1]);
        
        dirConf["old" + dirTri[1]] = posOri[dirTri[1]];
        dirConf["old" + dirTri[2]] = sizeOri[dirTri[2]];
        var nOriPosDir = posOri[dirTri[1]] - (bFakePrt ? nPrtOldPosDir : 0);
        nOriPosDir += nPrtOldSizeDir * parent["anchor" + dirTri[0]];//TODOJK 完成win32多分辨率和游戏设置功能后再测试自动适配
        if (dirConf.Auto !== FrameAdaptations.EAutoType.None)
        {
            nOriPosDir = (nOriPosDir - indents[0]) * nRatio;
            if (dirConf.Auto === FrameAdaptations.EAutoType.PosAndSize)
                sizeOri[dirTri[2]] *= nRatio;
            else if (dirConf.Auto === FrameAdaptations.EAutoType.PosWithOffset)
            {
                var nAnchorSizeDir = sizeOri[dirTri[2]] - sizeOri[dirTri[2]] * node["anchor" + dirTri[0]] * 2;
                nOriPosDir += (nAnchorSizeDir * nRatio - nAnchorSizeDir) / 2;
            }
            nOriPosDir += indents[0];
        }
        nOriPosDir -= nPrtSizeDir * parent["anchor" + dirTri[0]];
        posOri[dirTri[1]] = nOriPosDir + (prtAuto ? (bFakePrt ? nPrtPosDir : 0) : -(nDiff / 2));

        if (bSet)
        {
            node.position = posOri;
            node.setContentSize(sizeOri);
        }
        return nRatio;
    },

    _getIndents : function(nodes, parent, dirConf,
        bFakePrt, sDirSuff, nPrtOldSizeDir, nPrtOldPosDir)
    {
        nPrtOldPosDir = (bFakePrt ? nPrtOldPosDir : 0);

        var retPair = [];
        [["Front", "Min"], ["Back", "Max"]].forEach(function(pair, i){
            var nIndent = 0, indent = dirConf[pair[0] + "Indent"];
            var node = (i && nodes[1] || nodes[0]);
            if (typeof indent === "number")
                nIndent = indent;
            else if (typeof indent === "string")
            {
                var nodeIndent = parent.getChildByName(indent) || node;
                nIndent = cc["rectGet" + pair[1] + sDirSuff](nodeIndent.getBoundingBox());
                if (i) nIndent = nPrtOldSizeDir - nIndent;
            }
            else
            {
                nIndent = cc["rectGet" + pair[1] + sDirSuff](node.getBoundingBox()) - nPrtOldPosDir;
                if (i) nIndent = nPrtOldSizeDir - nIndent;
            }
            retPair.push(nIndent);
        });
        return retPair;
    },

    _CompStringToPrefix : function(sComp)
    {
        switch (sComp)
        {
            case "Sprite":      return "spr";
            case "Label":       return "lbl";
            case "Button":      return "btn";
            case "RichText":    return "rtx";
            case "EditBox":     return "edb";
            case "Layout":      return "lyt";
            case "PageView":    return "pgv";
            case "ProgressBar": return "pgb";
            case "ScrollView":  return "scv";
            case "Slider":      return "sld";
            case "Toggle":      return "tgl";
            case "VideoPlayer": return "vpl";
            case "WebView":     return "wbv";
            //TODOJK 验证组件名称并补充其他需要组件
        }
        return null;
    },

    OnNodeFrameFocus : function(event)
    {
        var sName = Scattered.ReplaceG(event.target.name, "#", "/");
        var nodeFrameInfo = this.nodeFrameMap[sName];
        if (nodeFrameInfo)
        {
            var eZGroup = event.target.zIndex;
            var zGroupList = this.nodeFrameListTri[eZGroup];
            if (zGroupList.head && nodeFrameInfo.frame !== zGroupList.head.value)
            {
                event.target.removeFromParent(false);
                this.nodeLayer.addChild(event.target, eZGroup);

                if (zGroupList.delete(nodeFrameInfo.frame))
                    zGroupList.prepend(nodeFrameInfo.frame);
            }
        }
        event.stopPropagation();
    },

    OnStackFrameClick : function(event)
    {
        var sName = Scattered.ReplaceG(event.target.name, "#", "/");
        var stackFrameInfo = this.stackFrames[this.stackFrames.length - 1];
        if (stackFrameInfo && stackFrameInfo.frame._sName === sName && stackFrameInfo.bDialog)
        {
            var nodePrefab = stackFrameInfo.node.children[0];
            var posTouch = stackFrameInfo.node.convertToNodeSpaceAR(event.getLocation());
            var bHit = nodePrefab.getBoundingBox().contains(posTouch);
            if (event.type === cc.Node.EventType.TOUCH_END)
            {
                if (!bHit && stackFrameInfo.bTouchOut)
                    this.GoBackStack(stackFrameInfo.frame);
                delete stackFrameInfo.bTouchOut;
            }
            else if (event.type === cc.Node.EventType.TOUCH_START)
                stackFrameInfo.bTouchOut = !bHit;
        }
        event.stopPropagation();
    }
};

module.exports = PxvUIFrameMgr;