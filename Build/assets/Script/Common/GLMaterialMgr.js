var renderEngine = cc.renderer.renderEngine;
var renderer = renderEngine.renderer;
var gfx = renderEngine.gfx;
var Material = renderEngine.Material;

var GLMaterial = function(sName, params, defines)
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
        params || [
            {name: 'u_Texture', type: renderer.PARAM_TEXTURE_2D},
            {name: 'u_color', type: renderer.PARAM_COLOR4},
        ],
        [pass]
    );

    this._effect = new renderer.Effect(
        [tech], {/*FLAGJK*/}, defines
    );

    this._texture = null;
    this._color = {r: 1, g: 1, b: 1, a: 1};
    this._mainTech = tech;
};

cc.js.extend(GLMaterial, Material);
cc.js.mixin(GLMaterial.prototype, {
    //
});

var GLMaterialMgr = {
    //
};

module.exports = GLMaterialMgr;