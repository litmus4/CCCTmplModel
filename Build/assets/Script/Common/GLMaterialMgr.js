var Material = cc.Material;

var GLMaterial = function(sName, properties, defines)
{
    Material.call(this, false);

    var pass = new cc.renderer.Pass(sName);
    pass.setDepth(false, false);
    pass.setCullMode(cc.gfx.CULL_NONE);
    pass.setBlend(
        cc.gfx.BLEND_FUNC_ADD,
        cc.gfx.BLEND_SRC_ALPHA, cc.gfx.BLEND_ONE_MINUS_SRC_ALPHA,
        cc.gfx.BLEND_FUNC_ADD,
        cc.gfx.BLEND_SRC_ALPHA, cc.gfx.BLEND_ONE_MINUS_SRC_ALPHA
    );

    var tech = new cc.renderer.Technique(//FLAGJK
        ['transparent'],
        // params || [//2.1.1
        //     {name: "u_Texture", type: cc.gfx.PARAM_TEXTURE_2D},
        //     {name: "u_color", type: cc.gfx.PARAM_COLOR4},
        // ],
        [pass]
    );

    this._effect = new cc.Effect(
        sName, [tech],//2.1.1
        properties || {//2.1.1
            "u_Texture": {value: null, type: cc.gfx.PARAM_TEXTURE_2D},//FLAGJK 是否在cc.gfx下
            "u_color": {value: new cc.Vec4(1, 1, 1, 1), type: cc.gfx.PARAM_FLOAT4}
        },
        defines
    );

    this.sName = sName;
    this._texture = null;
    this._color = new cc.Vec4(1, 1, 1, 1);//FLAGJK 是否可以直接使用Vec4
    this._mainTech = tech;
};

cc.js.extend(GLMaterial, Material);
cc.js.mixin(GLMaterial.prototype, {
    GetTexture: function()
    {
        return this._texture;
    },

    SetTexture: function(tex)
    {
        if (!tex) return;

        if (this._texture !== tex)
        {
            this._texture = tex;
            this._effect.setProperty("u_Texture", tex.getImpl());
            //this._texIds["u_Texture"] = tex.getId();//2.1.1
        }
    },

    GetColor: function()
    {
        return this._color;
    },

    SetColor: function(color)
    {
        if (!color) return;

        this._color.x = color.r / 255;
        this._color.y = color.g / 255;
        this._color.z = color.b / 255;
        this._color.w = color.a / 255;
        this._effect.setProperty("u_color", this._color);
    },

    // GetProperty: function(sPropName)
    // {
    //     return this._effect.getProperty(sPropName);
    // },

    // SetProperty: function(sPropName, value)
    // {
    //     this._effect.setProperty(sPropName, value);
    // },

    // SetDefine: function(sDefName, value)
    // {
    //     this._effect.define(sDefName, value);
    // }

    Reset: function()
    {
        this._texture = null;
        this._color = new cc.Vec4(1, 1, 1, 1);
        this._effect._properties = {};
        this._effect._defines = {};
    }
});

var GLMaterialMgr = {
    shaderMap: {},
    materialMap: {},

    AddShader: function(shaderInfo)
    {
        if (!shaderInfo || !shaderInfo.name)
            return;
        if (this.shaderMap[shaderInfo.name])
            return;
        
        this.shaderMap[shaderInfo.name] = shaderInfo;
        if (!cc.renderer._forward)
        {
            cc.game.once(cc.game.EVENT_ENGINE_INITED, function(){
                cc.renderer._forward._programLib.define(shaderInfo);//2.1.1
            });
        }
        else
            cc.renderer._forward._programLib.define(shaderInfo);
    },

    RemoveShader: function(sName)
    {
        delete this.shaderMap[sName];
        //cc.renderer._forward._programLib内的shader暂时无法删除，引擎未提供接口
    },

    GetShader: function(sName)
    {
        return this.shaderMap[sName];
    },

    GenMaterialFromShader: function(sName, properties, defines, bNew)
    {
        if (!this.shaderMap[sName]) return null;

        var mtlListPair = this.materialMap[sName], mtl = null;
        if (!mtlListPair || mtlListPair[0].length === 0 || bNew)
        {
            mtl = new GLMaterial(sName, properties, defines);
            if (!mtlListPair)
                this.materialMap[sName] = [[mtl], []];
            else
                mtlListPair[0].push(mtl);
        }
        else
            mtl = mtlListPair[0][0];
        return mtl;
    },

    ClearMaterialsByName: function(sName, bAll)
    {
        var mtlListPair = this.materialMap[sName];
        if (!mtlListPair) return;

        mtlListPair[0].splice(0);
        if (bAll)
        {
            mtlListPair[1].forEach(function(mtl, i){
                if (mtl._ownerEx && mtl._ownerEx.sharedMaterials)//2.1.1
                    this._SetSpriteSharedMaterial(mtl._ownerEx, undefined, 0);//TODOJK 不只是Sprite
            }.bind(this));
            mtlListPair[1].splice(0);
        }
    },

    SetSpriteMaterial: function(spr, material)
    {
        if (!spr) return;

        if (material)
        {
            var mtlListPair = this.materialMap[material.sName || 0];
            if (mtlListPair)
            {
                if (mtlListPair[1].indexOf(material) >= 0)
                    return;
                var nIndex = mtlListPair[0].indexOf(material);
                if (nIndex >= 0)
                {
                    mtlListPair[0].splice(nIndex, 1);
                    mtlListPair[1].push(material);
                }
            }
            material._ownerEx = spr;
        }

        var mtlUsed = this._SetSpriteSharedMaterial(spr, material, 0);

        if (mtlUsed)
        {
            var mtlListPair = this.materialMap[mtlUsed.sName || 0];
            var nIndex = (mtlListPair ? mtlListPair[1].indexOf(mtlUsed) : -1);
            if (nIndex >= 0)
            {
                mtlListPair[1].splice(nIndex, 1);
                mtlUsed.Reset();
                mtlListPair[0].push(mtlUsed);
            }
        }
    },

    SetSpriteMaterialByName: function(spr, sName)
    {
        if (!spr) return;

        var mtlListPair = this.materialMap[sName];
        if (mtlListPair && mtlListPair[0].length > 0)
        {
            var mtl = mtlListPair[0].shift();
            mtl._ownerEx = spr;
            this._SetSpriteSharedMaterial(spr, mtl, 0);
            mtlListPair[1].push(mtl);
        }
    },

    _SetSpriteSharedMaterial: function(spr, material, nIndex)
    {
        var materials = spr.sharedMaterials, mtlUdfRet = null;
        for (var i = 0; i < materials.length; ++i)
        {
            if (i === nIndex)
            {
                mtlUdfRet = materials[i];
                if (mtlUdfRet)
                {
                    mtlUdfRet._ownerEx = null;
                    materials[i] = null;
                }
                if (material)
                    materials[i] = material;
                break;
            }
        }
        spr.sharedMaterials = materials;//触发_activateMaterial on 2.1.1
        return mtlUdfRet;
    }
};

//重载 2.1.1
cc.Sprite.prototype._activateMaterial = function()
{
    // If render type is canvas, just return.
    if (cc.game.renderType === cc.game.RENDER_TYPE_CANVAS) {
        this.markForUpdateRenderData(true);
        this.markForRender(true);
        return;
    }

    let spriteFrame = this._spriteFrame;
    // If spriteframe not loaded, disable render and return.
    if (!spriteFrame || !spriteFrame.textureLoaded()) {
        this.disableRender();
        return;
    }
    
    // make sure material is belong to self.
    let material = this.sharedMaterials[0];
    if (!material) {
        material = Material.getInstantiatedBuiltinMaterial('2d-sprite', this);
    }
    else if (!(material instanceof GLMaterial)) {
        material = Material.getInstantiatedMaterial(material, this);
    }
    
    let texture = spriteFrame.getTexture();
    if (material instanceof GLMaterial)
    {
        material.SetTexture(texture);
        if (this.node)
            material.SetColor(this.node.color);
    }
    else
        material.setProperty('texture', texture);

    this.setMaterial(0, material);
    this.markForRender(true);
};

module.exports = GLMaterialMgr;