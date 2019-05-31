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
            "u_Texture": {/*value: TODOJK*/},
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

    getProperty: function(sPropName)
    {
        return this._effect.getProperty(sPropName);
    },

    setProperty: function(sPropName, value)
    {
        this._effect.setProperty(sPropName, value);
    },

    setDefine: function(sDefName, value)
    {
        this._effect.define(sDefName, value);
    }
});

var GLMaterialMgr = {
    //FLAGJK
};

module.exports = GLMaterialMgr;