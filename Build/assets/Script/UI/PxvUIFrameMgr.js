var PxvUIFrameMgr = {
    nodeLayer : null,
    nodeFrameMap : {},
    stackFrames : [],

    Init : function()
    {
        this.nodeLayer = cc.find("Canvas/UILayer");
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
        });

        if (binder && bFrame)
        {
            this.nodeFrameMap[sFile] = {
                frame : binder, node : null, bFilled : false
            };
        }
    },

    FillNodeFrame : function(sFile, node, nodePrefab)
    {
        if (!node || !nodePrefab)
            return;
        
        var nodeFrameInfo = this.nodeFrameMap[sFile];
        if (nodeFrameInfo)
        {
            if (!nodeFrameInfo.node)
                nodeFrameInfo.node = node;
            
            node.setAnchorPoint(0, 0);
            node.setContentSize(nodePrefab.getContentSize());
            node.addChild(nodePrefab);

            nodeFrameInfo.bFilled = true;
        }
    },

    OpenNodeFrame : function(frame, sNodeName, bSetNode)
    {
        if (!frame) return;

        var node = (sNodeName ? frame[sNodeName] : frame.node);
        if (!node) return;

        this.nodeLayer.addChild(node);
        if (bSetNode)
        {
            for (var sFile in this.nodeFrameMap)
            {
                var curNodeFrameInfo = this.nodeFrameMap[sFile];
                if (curNodeFrameInfo.frame === frame)
                {
                    curNodeFrameInfo.node = node;
                    break;
                }
            }
        }
    }
};