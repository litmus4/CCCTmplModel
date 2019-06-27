var renderEngine = cc.renderer.renderEngine;
var renderer = renderEngine.renderer;
var gfx = renderEngine.gfx;
var Material = renderEngine.Material;

var GLMaterial = function(sName, properties, defines)
{
    Material.call(this, false);

    var pass = new renderer.Pass(sName);
    pass.setDepth(false, false);
    pass.setCullMode(gfx.CULL_NONE);
    pass.setBlend(
        gfx.BLEND_FUNC_ADD,
        gfx.BLEND_SRC_ALPHA, gfx.BLEND_ONE_MINUS_SRC_ALPHA,
        gfx.BLEND_FUNC_ADD,
        gfx.BLEND_SRC_ALPHA, gfx.BLEND_ONE_MINUS_SRC_ALPHA
    );

    var tech = new renderer.Technique(
        ['transparent'],
        // params || [//2.1.1
        //     {name: "u_Texture", type: renderer.PARAM_TEXTURE_2D},
        //     {name: "u_color", type: renderer.PARAM_COLOR4},
        // ],
        [pass]
    );

    this._effect = new renderer.Effect(
        sName, [tech],//2.1.1
        properties || {
            "u_Texture": {/*value: TODOJK 2.1.1*/},
            "u_color": {/*value:*/}
        },
        defines
    );

    this._texture = null;
    this._color = {r: 1, g: 1, b: 1, a: 1};
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
            this._texIds["u_Texture"] = tex.getId();
        }
    },

    GetColor: function()
    {
        return this._color;
    },

    SetColor: function(color)
    {
        if (!color) return;

        this._color.r = color.r / 255;
        this._color.g = color.g / 255;
        this._color.b = color.b / 255;
        this._color.a = color.a / 255;
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

    GenMaterialFromShader: function(sName, properties, defines)
    {
        if (!this.shaderMap[sName]) return null;

        var mtl = new GLMaterial(sName, properties, defines);
        var mtlList = this.materialMap[sName];
        if (!mtlList)
            this.materialMap[sName] = [mtl];
        else
            mtlList.push(mtl);
        return mtl;
    },

    ClearMaterialsByName: function(sName, bAll)
    {
        var mtlList = this.materialMap[sName];
        if (!mtlList) return;

        var i = 0;
        while (i < mtlList.length)
        {
            if (mtl._owner)
            {
                if (bAll && mtl._owner.sharedMaterials)
                    this._SetSpriteSharedMaterial(mtl._owner, undefined, 0);
                i++;
            }
            else
                mtlList.splice(i, 1);
        }
    },

    SetSpriteMaterial: function(spr, material)
    {
        if (!spr || !material)
            return;
        material._owner = spr;
        this._SetSpriteSharedMaterial(spr, material, 0);
    },

    SetSpriteMaterialByName: function(spr, sName)
    {
        if (!spr) return;

        var mtlList = this.materialMap[sName];
        if (mtlList)
        {
            for (var i = 0; i < mtlList.length; ++i)
            {
                var mtl = mtlList[i];
                if (mtl._owner) continue;
                mtl._owner = spr;
                this._SetSpriteSharedMaterial(spr, mtl, 0);
                break;
            }
        }
    },

    _SetSpriteSharedMaterial: function(spr, material, nIndex)
    {
        var materials = spr.sharedMaterials;
        for (var i = 0; i < materials.length; ++i)
        {
            if (i === nIndex)
                materials[i] = material;
        }
        spr.sharedMaterials = materials;//触发_activateMaterial
    }
};

//重载
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
        material = Material.getInstantiatedBuiltinMaterial('sprite', this);
        material.define('USE_TEXTURE', true);
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