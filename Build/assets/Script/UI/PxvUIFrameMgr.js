var PxvUIFrameMgr = {
    EFrameType : {
        Node : 0, Stack : 1
    },

    nodeLayer : null,
    vLayerPosi : null,
    nodeFrameMap : {},
    stackFrames : [],
    frameWaitMap : {},

    Init : function()
    {
        this.nodeLayer = cc.find("Canvas/UILayer");
        //UILayer的尺寸要与Canvas一致，而下边的(0.5,0.5)表示UI编辑场景的Canvas使用默认锚点
        this.vLayerPosi = cc.p(this.nodeLayer.width * 0.5, this.nodeLayer.height * 0.5);
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
            {
                var pos = cc.pAdd(this.vLayerPosi, nodePrefab.position);
                if (eFrameType === this.EFrameType.Node)
                {
                    var fPfNegaX = -(nodePrefab.width * nodePrefab.anchorX);
                    var fPfNegaY = -(nodePrefab.height * nodePrefab.anchorY);
                    pos = cc.pAdd(pos, cc.p(fPfNegaX, fPfNegaY));

                    var nodeFrameInfo = this.nodeFrameMap[sFile];
                    if (!nodeFrameInfo)
                    {//[1]未加入UILayer，暂存等待信息：容器节点位置
                        this.frameWaitMap[sFile] = {
                            node : null, pos : pos, bFilled : false
                        };
                    }
                    else
                        nodeFrameInfo.pos = pos;
                    
                    nodePrefab.setAnchorPoint(0, 0);
                    nodePrefab.position = cc.p(0, 0);
                }
                else if (eFrameType === this.EFrameType.Stack)
                    nodePrefab.position = pos;
            }

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
            if (!nodeFrameInfo.node)
            {
                nodeFrameInfo.node = node;
                node.position = nodeFrameInfo.pos;
            }
            nodeFrameInfo.bFilled = true;
        }
        else
        {//[2]未加入UILayer，暂存等待信息：容器节点，填充标记
            var frameWaitInfo = this.frameWaitMap[sFile];
            if (frameWaitInfo)
            {
                frameWaitInfo.node = node;
                frameWaitInfo.bFilled = true;
            }
        }
    },

    OpenNodeFrame : function(frame, sNodeName, bSetNode)
    {
        if (!frame || !frame._sName)
            return false;

        var nodeFrameInfo = this.nodeFrameMap[frame._sName];
        if (nodeFrameInfo)
            return false;

        var node = (sNodeName ? frame[sNodeName] : frame.node);
        if (!node) return false;
        this.nodeLayer.addChild(node);
        nodeFrameInfo = {
            frame : frame, node : null, pos : cc.p(0, 0), bFilled : false
        };
        this.nodeFrameMap[frame._sName] = nodeFrameInfo;

        var frameWaitInfo = this.frameWaitMap[frame._sName];
        if (frameWaitInfo)
        {//发现等待信息
            nodeFrameInfo.node = frameWaitInfo.node;//"[2]"执行后才不为null
            nodeFrameInfo.pos = frameWaitInfo.pos;//"[1]"执行后便存在
            nodeFrameInfo.bFilled = frameWaitInfo.bFilled;//"[2]"执行后为true
        }
        if (bSetNode && !nodeFrameInfo.node)//"[2]"未执行才会SetNode
        {
            nodeFrameInfo.node = node;
            node.position = nodeFrameInfo.pos;
        }
        return true;
    }
};

module.exports = PxvUIFrameMgr;