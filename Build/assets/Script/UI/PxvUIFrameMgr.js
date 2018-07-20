var PxvUIFrameMgr = {
    nodeLayer : null,
    vLayerPosi : null,
    nodeFrameMap : {},
    stackFrames : [],

    Init : function()
    {
        this.nodeLayer = cc.find("Canvas/UILayer");
        //UILayer的尺寸要与Canvas一致，而下边的(0.5,0.5)表示UI编辑场景的Canvas使用默认锚点
        this.vLayerPosi = cc.p(this.nodeLayer.width * 0.5, this.nodeLayer.height * 0.5);
    },

    LoadFromPrefab : function(sFile, binder, fnCallback, bFrame)
    {
        cc.loader.loadRes("UI/" + sFile, function(err, prefab){
            if (err)
            {
                cc.error(err.message || err);
                return;
            }

            var nodePrefab = cc.instantiate(prefab);
            if (nodePrefab)
            {
                var nodeFrameInfo = this.nodeFrameMap[sFile];
                if (nodeFrameInfo && bFrame)
                {
                    var fPfNegaX = -(nodePrefab.width * nodePrefab.anchorX);
                    var fPfNegaY = -(nodePrefab.height * nodePrefab.anchorY);
                    var pos = cc.pAdd(this.vLayerPosi, nodePrefab.position);
                    nodeFrameInfo.pos = cc.pAdd(pos, cc.p(fPfNegaX, fPfNegaY));
                }
                nodePrefab.setAnchorPoint(0, 0);
                nodePrefab.position = cc.p(0, 0);
            }

            binder = binder || nodePrefab;
            if (binder)
            {
                //TODOJK 递归绑定控件
            }

            if (fnCallback)
                fnCallback(sFile, nodePrefab);
        }.bind(this));

        if (binder && bFrame)
            binder._sName = sFile;
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
    },

    OpenNodeFrame : function(frame, sNodeName, bSetNode)
    {
        if (!frame || !frame._sName) return false;

        var node = (sNodeName ? frame[sNodeName] : frame.node);
        if (!node) return false;
        this.nodeLayer.addChild(node);

        var nodeFrameInfo = this.nodeFrameMap[frame._sName];
        if (!nodeFrameInfo)
        {
            nodeFrameInfo = {
                frame : frame, node : null, pos : cc.p(0, 0), bFilled = false
            };
            this.nodeFrameMap[frame._sName] = nodeFrameInfo;
        }

        if (bSetNode)
        {
            nodeFrameInfo.node = node;
            node.position = nodeFrameInfo.pos;
        }
        return true;
    }
};

module.exports = PxvUIFrameMgr;