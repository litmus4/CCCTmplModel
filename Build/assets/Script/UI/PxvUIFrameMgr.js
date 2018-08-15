var LinkedList = require("LinkedList");
var Scattered = require("Scattered");

var PxvUIFrameMgr = {
    EFrameType : {
        Node : 1, Stack : 2
    },
    EFrameZGroup : {
        Bottom : 1, Normal : 2, Top : 3, Stack : 4
    },

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
        //UILayer的尺寸要与Canvas一致，而下边的(0.5,0.5)表示UI编辑场景的Canvas使用默认锚点
        this.vLayerPosi = cc.p(this.nodeLayer.width * 0.5, this.nodeLayer.height * 0.5);

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
                //TODOJK 递归绑定控件
            }

            if (fnCallback)
                fnCallback(sFile, nodePrefab);
        }.bind(this));
        return true;
    },

    _InitPrefabNode : function(nodePrefab, eFrameType, sFile)
    {
        var pos = cc.pAdd(this.vLayerPosi, nodePrefab.position);
        if (eFrameType === this.EFrameType.Node)
        {
            var fPfPosiX = nodePrefab.width * nodePrefab.anchorX;
            var fPfPosiY = nodePrefab.height * nodePrefab.anchorY;
            pos = cc.pAdd(pos, cc.p(-fPfPosiX, -fPfPosiY));

            var nodeFrameInfo = this.nodeFrameMap[sFile];
            if (!nodeFrameInfo)//[1]未加入UILayer，暂存等待信息：容器节点位置
                this._SetWait(sFile, null, pos, false);
            else
                nodeFrameInfo.pos = pos;
            
            nodePrefab.position = cc.p(fPfPosiX, fPfPosiY);
        }
        else if (eFrameType === this.EFrameType.Stack)
            nodePrefab.position = pos;
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
            node.position = nodeFrameInfo.pos;//强制赋值正确的位置
            nodeFrameInfo.bFilled = true;
        }
        else//[2]未加入UILayer，暂存等待信息：容器节点，填充标记
            this._SetWait(sFile, node, null, true);
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
            if (!nodeFrameInfo.node)//"[2]"未执行才会赋值node
                nodeFrameInfo.node = node;
            node.name = Scattered.ReplaceG(frame._sName, "/", "#");
            node.position = nodeFrameInfo.pos;
            node.on(cc.Node.EventType.TOUCH_START, this.OnNodeFrameFocus, this);
        }
        return true;
    },

    CloseNodeFrame : function(frame, sNodeName, bWait)
    {
        if (!frame || !frame._sName)
            return;
        var nodeIn = (sNodeName ? frame[sNodeName] : frame.node);

        var nodeFrameInfo = this.nodeFrameMap[frame._sName];
        if (nodeFrameInfo)
        {
            let node = nodeFrameInfo.node || nodeIn;
            if (node)
            {
                var eZGroup = node.getLocalZOrder();
                node.destroy();
                delete this.nodeFrameMap[frame._sName];

                var zGroupList = this.nodeFrameListTri[eZGroup];
                if (zGroupList)
                    zGroupList.delete(frame);
            }
        }

        var frameWaitInfo = this.frameWaitMap[frame._sName];
        if (bWait && frameWaitInfo)//暂不考虑执行了[1]还没执行[2]的情况
        {
            let node = frameWaitInfo.node || nodeIn;
            if (node)
            {
                node.destroy();
                delete this.frameWaitMap[frame._sName];
            }
        }
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

    OnNodeFrameFocus : function(event)
    {
        var sName = Scattered.ReplaceG(event.target.name, "#", "/");
        var nodeFrameInfo = this.nodeFrameMap[sName];
        if (nodeFrameInfo)
        {
            var eZGroup = event.target.getLocalZOrder();

            event.target.removeFromParent(false);
            this.nodeLayer.addChild(event.target, eZGroup);

            var zGroupList = this.nodeFrameListTri[eZGroup];
            if (zGroupList.delete(nodeFrameInfo.frame))
                zGroupList.prepend(nodeFrameInfo.frame);
        }
        event.stopPropagation();
    }
};

module.exports = PxvUIFrameMgr;