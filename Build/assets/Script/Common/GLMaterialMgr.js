var Material = cc.Material;

var GLMaterial = function(sName, properties, defines)
{
    Material.call(this);

    for (var sKey in (properties = properties || {
        "u_Texture": {value: null, type: 29/*cc.gfx.PARAM_TEXTURE_2D*/},//FLAGJK 是否在cc.gfx下，先用数字吧
        "u_color": {value: cc.sys.isBrowser ? [1, 1, 1, 1] : new cc.Vec4(1, 1, 1, 1), type: 16/*cc.gfx.PARAM_FLOAT4*/}
    }))
        properties[sKey].name = sKey;

    this._pass = new cc.renderer.Pass(sName, "", sName, "opaque", properties, defines);
    this._pass.setDepth(false, false);
    this._pass.setCullMode(cc.gfx.CULL_NONE);
    this._pass.setBlend(true,
        cc.gfx.BLEND_FUNC_ADD,
        cc.gfx.BLEND_SRC_ALPHA, cc.gfx.BLEND_ONE_MINUS_SRC_ALPHA,
        cc.gfx.BLEND_FUNC_ADD,
        cc.gfx.BLEND_SRC_ALPHA, cc.gfx.BLEND_ONE_MINUS_SRC_ALPHA
    );

    var tech = new cc.renderer.Technique(
        sName, [this._pass]
    );

    this._effectEx = new cc.Effect(
        sName, [tech], 0, undefined
    );
    this._effect = new cc.EffectVariant();
    this._effect.init(this._effectEx);

    this.sName = sName;
    this._texture = null;
    this._color = new cc.Vec4(1, 1, 1, 1);
    if (!cc.sys.isBrowser)
        this._color.toArray = null;
    this.nOpa = null;
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
            this._effectEx.setProperty("u_Texture", tex);
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
        this._effectEx.setProperty("u_color", this._color);//FLAGJK 现在颜色还是显示白色
    },

    SetCustomOpactiy: function(nOpa)
    {
        if (nOpa && (nOpa < 0 || nOpa > 255))
            return;
        this.nOpa = nOpa;
    },

    // GetProperty: function(sPropName)
    // {
    //     return this._effectEx.getProperty(sPropName);
    // },

    // SetProperty: function(sPropName, value)
    // {
    //     this._effectEx.setProperty(sPropName, value);
    // },

    // SetDefine: function(sDefName, value)
    // {
    //     this._effectEx.define(sDefName, value);
    // }

    Reset: function()
    {
        this._texture = null;
        this._color = new cc.Vec4(1, 1, 1, 1);
        if (!cc.sys.isBrowser)
            this._color.toArray = null;
        this.nOpa = null;
        this._pass._properties = {};
        this._pass._defines = {};
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
                cc.renderer._forward._programLib.define(shaderInfo);
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
                if (mtl._ownerEx && mtl._ownerEx.materials)
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
        var materials = spr.materials, mtlUdfRet = null;
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
        spr.materials = materials;//触发_activateMaterial
        return mtlUdfRet;
    }
};

//*重载
cc.Sprite.prototype._activateMaterial = function()
{
    let materials = this._materials;
    let bFirstGL = false;
    if (!materials[0]) {
        let material = this._getDefaultMaterial();
        materials[0] = material;
    }
    else if (materials[0] instanceof GLMaterial)
        bFirstGL = true;

    for (let i = 0; i < materials.length; i++) {
        if (i !== 0 || !bFirstGL)
            materials[i] = cc.MaterialVariant.create(materials[i], this);
    }

    this._updateMaterial();
};

cc.Sprite.prototype._updateMaterial = function()
{
    let texture = this._spriteFrame && this._spriteFrame.getTexture();
    
    let material = this._materials[0];
    let bFirstGL = (material && (material instanceof GLMaterial));
    if (!bFirstGL)
        material = this.getMaterial(0);
    
    if (material) {
        if (material.getDefine('USE_TEXTURE') !== undefined) {
            material.define('USE_TEXTURE', true);
        }

        if (bFirstGL)
        {
            material.SetTexture(texture);
            if (this.node)
            {
                var color = this.node.color;
                if (material.nOpa)
                    color.a = material.nOpa;
                material.SetColor(color);
            }
        }
        else
            material.setProperty('texture', texture);
    }

    cc.BlendFunc.prototype._updateMaterial.call(this);
};
//*/

module.exports = GLMaterialMgr;