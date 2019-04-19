var LinkedList = require("LinkedList");
var Scattered = require("Scattered");
var CUtil = require("CUtil");

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
        this.vLayerPosi = cc.p(this.nodeLayer.width * 0.5, this.nodeLayer.height * 0.5);
        this.nodeLayer.position = cc.pNeg(this.vLayerPosi);

        for (var e = this.EFrameZGroup.Bottom; e < this.EFrameZGroup.Stack; ++e)
            this.nodeFrameListTri[e] = new LinkedList();
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

        cc.loader.loadRes("UI/" + sFile, function(err, prefab){
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
                //TODOJK 自动适配
            }

            if (fnCallback)
                fnCallback(sFile, nodePrefab);
        }.bind(this));
        return true;
    },

    _InitPrefabNode : function(nodePrefab, eFrameType, sFile)
    {
        var pos = cc.pAdd(this.vLayerPosi, nodePrefab.position);
        var wid = nodePrefab.getComponent(cc.Widget);
        if (eFrameType === this.EFrameType.Node)
        {
            if (!wid)
            {
                var fPfPosiX = nodePrefab.width * nodePrefab.anchorX;
                var fPfPosiY = nodePrefab.height * nodePrefab.anchorY;
                pos = cc.pAdd(pos, cc.p(-fPfPosiX, -fPfPosiY));
                nodePrefab.position = cc.p(fPfPosiX, fPfPosiY);
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
        node.position = cc.p(0, 0);
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
            frame : frame, node : null, pos : cc.p(0, 0), bFilled : false
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
            var eZGroup = nodeFrameInfo.node.getLocalZOrder();
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

    GetFrameByName: function(sName)
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
                pair[0].vTouchNega = cc.pNeg(pair[1].convertToNodeSpaceAR(event.getLocation()));
        });
        nodeDrag.on(cc.Node.EventType.TOUCH_MOVE, function(event){
            var pair = getInfoAndNode();
            if (pair && pair[0].vTouchNega)
                pair[1].position = cc.pAdd(this.nodeLayer.convertToNodeSpaceAR(event.getLocation()), pair[0].vTouchNega);
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
        CUtil.LoadSpriteFrame(spr, "singleColor");
        node.color = this.colorMask;
        node.cascadeOpacity = false;
        node.opacity = this.colorMask.a;
    },

    _CompStringToPrefix: function(sComp)
    {
        switch (sComp)
        {
            case "Sprite":      return "spr";
            case "Label":       return "lbl";
            case "Button":      return "btn";
            //TODOJK 补充其他组件
        }
        return null;
    },

    OnNodeFrameFocus : function(event)
    {
        var sName = Scattered.ReplaceG(event.target.name, "#", "/");
        var nodeFrameInfo = this.nodeFrameMap[sName];
        if (nodeFrameInfo)
        {
            var eZGroup = event.target.getLocalZOrder();
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
            var bHit = cc.rectContainsPoint(nodePrefab.getBoundingBox(), posTouch);
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