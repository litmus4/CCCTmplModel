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
    getTexture: function()
    {
        return this._texture;
    },

    setTexture: function(tex)
    {
        if (!tex) return;

        if (this._texture !== tex)
        {
            this._texture = tex;
            this._effect.setProperty("u_Texture", tex.getImpl());
            this._texIds["u_Texture"] = tex.getId();
        }
    },

    getColor: function()
    {
        return this._color;
    },

    setColor: function(color)
    {
        if (!color) return;

        this._color.r = color.r / 255;
        this._color.g = color.g / 255;
        this._color.b = color.b / 255;
        this._color.a = color.a / 255;
        this._effect.setProperty("u_color", this._color);
    },

    // getProperty: function(sPropName)
    // {
    //     return this._effect.getProperty(sPropName);
    // },

    // setProperty: function(sPropName, value)
    // {
    //     this._effect.setProperty(sPropName, value);
    // },

    // setDefine: function(sDefName, value)
    // {
    //     this._effect.define(sDefName, value);
    // }
});

var GLMaterialMgr = {
    shaderMap: {},
    materialMap: {},

    addShader: function(shaderInfo)
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

    getShaderByName: function(sName)
    {
        return this.shaderMap[sName];
    },

    genMaterialFromShader: function(sName, properties, defines)
    {
        var mtl = new GLMaterial(sName, properties, defines);
        var mtlList = this.materialMap[sName];
        if (!mtlList)
            this.materialMap[sName] = [mtl];
        else
            mtlList.push(mtl);
        return mtl;
    },

    setSpriteMaterial: function(spr, material)
    {
        if (!spr || !material)
            return;
        material._owner = spr;
        spr.sharedMaterials[0] = material;//FLAGJK
    },

    setSpriteMaterialByName: function(spr, sName)
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
                spr.sharedMaterials[0] = mtl;//FLAGJK
                break;
            }
        }
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
    let bgl = (material instanceof GLMaterial);
    if (!material) {
        material = Material.getInstantiatedBuiltinMaterial('sprite', this);
        material.define('USE_TEXTURE', true);
    }
    else if (!bgl) {
        material = Material.getInstantiatedMaterial(material, this);
    }
    
    let texture = spriteFrame.getTexture();
    if (bgl)
    {
        material.setTexture(texture);
        if (this.node)
            material.setColor(this.node.color);
    }
    else
        material.setProperty('texture', texture);

    this.setMaterial(0, material);
    this.markForRender(true);
};

module.exports = GLMaterialMgr;