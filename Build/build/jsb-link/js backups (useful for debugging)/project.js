window.__require = function e(t, n, r) {
function i(a, s) {
if (!n[a]) {
if (!t[a]) {
var c = a.split("/");
c = c[c.length - 1];
if (!t[c]) {
var l = "function" == typeof __require && __require;
if (!s && l) return l(c, !0);
if (o) return o(c, !0);
throw new Error("Cannot find module '" + a + "'");
}
}
var u = n[a] = {
exports: {}
};
t[a][0].call(u.exports, function(e) {
return i(t[a][1][e] || e);
}, u, u.exports, e, t, n, r);
}
return n[a].exports;
}
for (var o = "function" == typeof __require && __require, a = 0; a < r.length; a++) i(r[a]);
return i;
}({
CUtil: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "92f03k85gdBJ5A14UgG4ak9", "CUtil");
var r = e("JsonTableParser"), i = e("TextTableCenter"), o = e("GLMaterialMgr"), a = e("format"), s = {
sLanguage: "zh_cn",
atlasMap: {},
Init: function(e, t, n) {
this.sLanguage = e;
this.sDefFont = t;
var i = new r();
i.Load("Atlas/AtlasMap", function(e, t, r) {
for (var o = ""; i.ReadRow(); ) {
var a = i.GetValue("Atlas");
a.length > 0 && (o = a);
this.atlasMap[i.GetValue("Frame")] = {
sAtlas: o,
bGlobal: Boolean(i.GetValue("IsGlobal"))
};
}
n && n();
}.bind(this), !1);
},
LoadSpriteFrame: function(e, t, n, r) {
if (e) {
var i = this.atlasMap[t] || n && {
sAtlas: n,
bGlobal: !1
};
if (i) {
var o = function(n, i) {
if (!n) {
e.spriteFrame = i.getSpriteFrame(t);
r && r();
}
}, a = "Atlas/" + ((i.bGlobal ? this.sLanguage : "") + "/") + i.sAtlas, s = cc.loader.getRes(a, cc.SpriteAtlas);
s ? o(null, s) : cc.loader.loadRes(a, cc.SpriteAtlas, o);
} else {
var c = function(t, n) {
if (!t) {
e.spriteFrame = n;
r && r();
}
}, l = "Image/" + t, u = cc.loader.getRes(l, cc.SpriteFrame);
u ? c(null, u) : cc.loader.loadRes(l, cc.SpriteFrame, c);
}
}
},
ForeachNodeRecursive: function(e, t, n) {
if (e && t) {
t(e, !1);
n && e._components.forEach(function(e, n) {
t(e, !0);
});
e.children.forEach(function(e, r) {
this.ForeachNodeRecursive(e, t, n);
}.bind(this));
}
},
AdaptVisible: function(e) {
if (e) {
var t = cc.view.getVisibleSize(), n = t.width / e.width, r = t.height / e.height;
e.scale = Math.max(n, r);
}
},
ChangeParent: function(e, t) {
if (e && e.parent && t) {
var n = e.parent.convertToWorldSpaceAR(e.position);
e.position = t.convertToNodeSpaceAR(n);
e.removeFromParent(!1);
t.addChild(e);
}
},
SetSpriteGray: function(e, t) {
if (e && e.sharedMaterials) if (t) {
var n = o.GetShader("SpriteGray");
if (!n) {
n = {
name: "SpriteGray",
vert: "precision highp float;\n                        uniform mat4 cc_matViewProj;\n                        attribute vec3 a_position;\n                        attribute mediump vec2 a_uv0;\n                        varying mediump vec2 v_uv0;\n                        void main(){\n                            gl_Position = cc_matViewProj * vec4(a_position, 1.0);\n                            v_uv0 = a_uv0;\n                        }",
frag: "precision highp float;\n                        uniform sampler2D u_Texture;\n                        uniform vec4 u_color;\n                        varying mediump vec2 v_uv0;\n                        void main(void){\n                            vec4 c = texture2D(u_Texture, v_uv0);\n                            vec3 grayc = vec3(0.299*c.r + 0.587*c.g +0.114*c.b);\n                            gl_FragColor = vec4(grayc.rgb, c.w) * u_color;\n                        }",
defines: []
};
o.AddShader(n);
}
var r = o.GenMaterialFromShader(n.name);
o.SetSpriteMaterial(e, r);
} else o.SetSpriteMaterial(e, void 0);
},
SetSpriteGrayRecursive: function(e, t) {
this.ForeachNodeRecursive(e, function(e, n) {
n && this.SetSpriteGray(e, t);
}.bind(this), !0);
},
SetColorRecursive: function(e, t) {
this.ForeachNodeRecursive(e, function(e, n) {
e.color && (e.color = t);
}, !1);
},
RegisterClick: function(e, t, n) {
if (e && t) {
e.on(cc.Node.EventType.TOUCH_START, function(e) {});
e.on(cc.Node.EventType.TOUCH_END, function(e) {
n ? t.call(n, e) : t(e);
e.stopPropagation();
});
}
},
IsTouchMoved: function(e, t) {
t = t || 2;
var n = e.getPreviousLocation(), r = e.getLocation();
return Math.abs(n.x - r.x) >= t || Math.abs(n.y - r.y) >= t;
},
RegisterPush: function(e, t, n, r, i) {
if (e && t && n) {
var o = 0, a = null, s = !1;
e.on(cc.Node.EventType.TOUCH_START, function(t) {
o = 0;
a = e.runAction(cc.sequence(cc.delayTime(i || 1), cc.callFunc(function() {
s = !0;
r ? n.call(r, t) : n(t);
})));
});
e.on(cc.Node.EventType.TOUCH_MOVE, function(t) {
this.IsTouchMoved(t) && o++;
if (o > 3 && a) {
e.stopAction(a);
a = null;
}
t.stopPropagation();
}.bind(this));
var c = function(n) {
if (s) s = !1; else {
if (a) {
e.stopAction(a);
a = null;
}
o <= 3 && (r ? t.call(r, n) : t(n));
}
n.stopPropagation();
};
e.on(cc.Node.EventType.TOUCH_END, c);
e.on(cc.Node.EventType.TOUCH_CANCEL, c);
}
},
RegisterClickOrMove: function(e, t, n, r, i, o) {
if (e && t && n) {
var a = 0, s = !1, c = null;
e.on(cc.Node.EventType.TOUCH_START, function(e) {
a = 0;
o && (c = o(e));
});
e.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
var t = this.IsTouchMoved(e, i);
t && a++;
if (!s) {
var o = !c || c(e, t, a);
if (a > 3 && o) {
r ? n.call(r, e) : n(e);
s = !0;
c = null;
}
}
e.stopPropagation();
}.bind(this));
var l = function(e) {
s ? s = !1 : a <= 3 && (r ? t.call(r, e) : t(e));
c = null;
e.stopPropagation();
};
e.on(cc.Node.EventType.TOUCH_END, l);
e.on(cc.Node.EventType.TOUCH_CANCEL, l);
}
},
GetClsCheckMoveRadian: function(e, t, n) {
return function(r) {
var i = 0;
return function(r, o, a) {
if (!o) return !1;
if (a <= t) {
var s = r.getPreviousLocation(), c = r.getLocation(), l = Math.atan2(c.y - s.y, c.x - s.x);
e(l) && i++;
}
return a >= t && i >= n;
};
};
},
FormatCaption: function(e, t) {
var n = e ? i.GetCaptionByTag(t) : i.GetCaption(t);
n.length > 0 && (t = n);
var r = [].slice.call(arguments, 1);
if (r.length > 1) {
r[0] = t;
return a.apply(null, r);
}
return t;
},
FakeRichText: function(e, t, n, r, i) {
var o = {
"白": new cc.Color(255, 255, 255, 255),
"绿": new cc.Color(25, 225, 95, 255),
"蓝": new cc.Color(55, 185, 255, 255),
"紫": new cc.Color(215, 80, 255, 255),
"橙": new cc.Color(255, 175, 70, 255),
"黄": new cc.Color(255, 220, 65, 255),
"红": new cc.Color(196, 29, 41, 255),
"灰": new cc.Color(128, 128, 128, 255)
};
n = n || 20;
if (i) {
for (var a = "", s = 0, c = 0, l = "", u = !1, h = "", f = ""; c < e.length; ) {
var d = e[c];
if ("#" === d) u = !0; else if (u || 0 === c) {
u = !1;
if (o[d]) h = d; else {
h = "";
l += d;
}
} else l += d;
c++;
var p = e.slice(s, c);
if (i(l) && "#" !== d || c >= e.length) {
a += 0 === s ? p : "*" + f + p;
f = h;
l = "";
s = c;
}
}
e = a;
}
t.forEach(function(e, t) {
e.removeAllChildren();
e.bAdded && e.removeFromParent();
});
var m = null, v = null;
if (t.length > 1) {
m = Math.abs(t[0].y - t[1].y);
v = t[0].x;
}
var g = e.split("*");
g.length <= 1 && (g = e.split("\n"));
g.forEach(function(e, i) {
var a = 0;
e.split("#").forEach(function(e, s) {
var c = e[0], l = o[c] ? e.slice(1) : e, u = new cc.Node("richPhrase_" + i + "_" + s), h = u.addComponent(cc.Label);
h.string = l;
this.sDefFont && (h.fontFamily = this.sDefFont);
h.fontSize = n;
u.setAnchorPoint(0, .5);
u.position = cc.v2(a, 0);
u.color = o[c] || r || o["白"];
if (!t[i]) {
if (!m) return 0;
var f = new cc.Node("richSection_" + i), d = t[i - 1];
f.position = cc.v2(v, d.y - m);
d.parent.addChild(f);
f.bAdded = !0;
t.push(f);
}
t[i].addChild(u);
a += u.width;
}.bind(this));
}.bind(this));
return g.length;
},
RollNumber: function(e, t, n, r) {
if (e && e.node && Math.floor(t) === t && Math.floor(n) === n) {
e.string = String(t);
r = r || 1;
var i = .05, o = Math.floor(r / i), a = n - t;
Math.abs(a) < o && (i = +(r / (o = Math.max(Math.abs(a), 1))).toFixed(2));
var s = Math.floor(a / o), c = 0;
e.node.stopAllActions();
e.node.runAction(cc.repeatForever(cc.sequence(cc.delayTime(i), cc.callFunc(function() {
if (++c < o) {
t += s;
e.string = String(t);
} else {
e.node.stopAllActions();
e.string = String(n);
}
}))));
}
}
};
t.exports = s;
cc._RF.pop();
}, {
GLMaterialMgr: "GLMaterialMgr",
JsonTableParser: "JsonTableParser",
TextTableCenter: "TextTableCenter",
format: "format"
} ],
Comparator: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "922643IsNNDFZ8ITPQJKKxf", "Comparator");
var r = function(e) {
this.compare = e || this.defaultCompareFunction;
};
r.prototype = {
defaultCompareFunction: function(e, t) {
return e === t ? 0 : e < t ? -1 : 1;
},
equal: function(e, t) {
return 0 === this.compare(e, t);
},
lessThan: function(e, t) {
return this.compare(e, t) < 0;
},
greaterThan: function(e, t) {
return this.compare(e, t) > 0;
},
lessThanOrEqual: function(e, t) {
return this.lessThan(e, t) || this.equal(e, t);
},
greaterThanOrEqual: function(e, t) {
return this.greaterThan(e, t) || this.equal(e, t);
},
reverse: function() {
var e = this.compare;
this.compare = function(t, n) {
return e(n, t);
};
}
};
t.exports = r;
cc._RF.pop();
}, {} ],
1: [ function(e, t, n) {
var r, i, o = t.exports = {};
function a() {
throw new Error("setTimeout has not been defined");
}
function s() {
throw new Error("clearTimeout has not been defined");
}
(function() {
try {
r = "function" == typeof setTimeout ? setTimeout : a;
} catch (e) {
r = a;
}
try {
i = "function" == typeof clearTimeout ? clearTimeout : s;
} catch (e) {
i = s;
}
})();
function c(e) {
if (r === setTimeout) return setTimeout(e, 0);
if ((r === a || !r) && setTimeout) {
r = setTimeout;
return setTimeout(e, 0);
}
try {
return r(e, 0);
} catch (t) {
try {
return r.call(null, e, 0);
} catch (t) {
return r.call(this, e, 0);
}
}
}
function l(e) {
if (i === clearTimeout) return clearTimeout(e);
if ((i === s || !i) && clearTimeout) {
i = clearTimeout;
return clearTimeout(e);
}
try {
return i(e);
} catch (t) {
try {
return i.call(null, e);
} catch (t) {
return i.call(this, e);
}
}
}
var u, h = [], f = !1, d = -1;
function p() {
if (f && u) {
f = !1;
u.length ? h = u.concat(h) : d = -1;
h.length && m();
}
}
function m() {
if (!f) {
var e = c(p);
f = !0;
for (var t = h.length; t; ) {
u = h;
h = [];
for (;++d < t; ) u && u[d].run();
d = -1;
t = h.length;
}
u = null;
f = !1;
l(e);
}
}
o.nextTick = function(e) {
var t = new Array(arguments.length - 1);
if (arguments.length > 1) for (var n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
h.push(new v(e, t));
1 !== h.length || f || c(m);
};
function v(e, t) {
this.fun = e;
this.array = t;
}
v.prototype.run = function() {
this.fun.apply(null, this.array);
};
o.title = "browser";
o.browser = !0;
o.env = {};
o.argv = [];
o.version = "";
o.versions = {};
function g() {}
o.on = g;
o.addListener = g;
o.once = g;
o.off = g;
o.removeListener = g;
o.removeAllListeners = g;
o.emit = g;
o.prependListener = g;
o.prependOnceListener = g;
o.listeners = function(e) {
return [];
};
o.binding = function(e) {
throw new Error("process.binding is not supported");
};
o.cwd = function() {
return "/";
};
o.chdir = function(e) {
throw new Error("process.chdir is not supported");
};
o.umask = function() {
return 0;
};
}, {} ],
FrameAdaptations: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "471839+cNdLsZcUq0AhwaPz", "FrameAdaptations");
t.exports = {
EAutoType: {
None: 0,
PosOnly: 1,
PosAndSize: 2,
PosWithOffset: 3
}
};
cc._RF.pop();
}, {} ],
GLMaterialMgr: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "73b2fLHNWVFKbipUh9vnvW1", "GLMaterialMgr");
var r = cc.Material, i = function(e, t, n) {
r.call(this, !1);
var i = new cc.renderer.Pass(e);
i.setDepth(!1, !1);
i.setCullMode(cc.gfx.CULL_NONE);
i.setBlend(cc.gfx.BLEND_FUNC_ADD, cc.gfx.BLEND_SRC_ALPHA, cc.gfx.BLEND_ONE_MINUS_SRC_ALPHA, cc.gfx.BLEND_FUNC_ADD, cc.gfx.BLEND_SRC_ALPHA, cc.gfx.BLEND_ONE_MINUS_SRC_ALPHA);
var o = new cc.renderer.Technique([ "opaque" ], [ i ]);
for (var a in t = t || {
u_Texture: {
value: null,
type: 13
},
u_color: {
value: new cc.Vec4(1, 1, 1, 1),
type: 7
}
}) t[a].name = a;
this._effect = new cc.Effect(e, [ o ], t, n);
this.sName = e;
this._texture = null;
this._color = new cc.Vec4(1, 1, 1, 1);
this._mainTech = o;
};
cc.js.extend(i, r);
cc.js.mixin(i.prototype, {
GetTexture: function() {
return this._texture;
},
SetTexture: function(e) {
if (e && this._texture !== e) {
this._texture = e;
this._effect.setProperty("u_Texture", e.getImpl());
}
},
GetColor: function() {
return this._color;
},
SetColor: function(e) {
if (e) {
this._color.x = e.r / 255;
this._color.y = e.g / 255;
this._color.z = e.b / 255;
this._color.w = e.a / 255;
this._effect.setProperty("u_color", this._color);
}
},
Reset: function() {
this._texture = null;
this._color = new cc.Vec4(1, 1, 1, 1);
this._effect._properties = {};
this._effect._defines = {};
}
});
var o = {
shaderMap: {},
materialMap: {},
AddShader: function(e) {
if (e && e.name && !this.shaderMap[e.name]) {
this.shaderMap[e.name] = e;
cc.renderer._forward ? cc.renderer._forward._programLib.define(e) : cc.game.once(cc.game.EVENT_ENGINE_INITED, function() {
cc.renderer._forward._programLib.define(e);
});
}
},
RemoveShader: function(e) {
delete this.shaderMap[e];
},
GetShader: function(e) {
return this.shaderMap[e];
},
GenMaterialFromShader: function(e, t, n, r) {
if (!this.shaderMap[e]) return null;
var o = this.materialMap[e], a = null;
if (!o || 0 === o[0].length || r) {
a = new i(e, t, n);
o ? o[0].push(a) : this.materialMap[e] = [ [ a ], [] ];
} else a = o[0][0];
return a;
},
ClearMaterialsByName: function(e, t) {
var n = this.materialMap[e];
if (n) {
n[0].splice(0);
if (t) {
n[1].forEach(function(e, t) {
e._ownerEx && e._ownerEx.sharedMaterials && this._SetSpriteSharedMaterial(e._ownerEx, void 0, 0);
}.bind(this));
n[1].splice(0);
}
}
},
SetSpriteMaterial: function(e, t) {
if (e) {
if (t) {
if (r = this.materialMap[t.sName || 0]) {
if (r[1].indexOf(t) >= 0) return;
if ((i = r[0].indexOf(t)) >= 0) {
r[0].splice(i, 1);
r[1].push(t);
}
}
t._ownerEx = e;
}
var n = this._SetSpriteSharedMaterial(e, t, 0);
if (n) {
var r, i;
if ((i = (r = this.materialMap[n.sName || 0]) ? r[1].indexOf(n) : -1) >= 0) {
r[1].splice(i, 1);
n.Reset();
r[0].push(n);
}
}
}
},
SetSpriteMaterialByName: function(e, t) {
if (e) {
var n = this.materialMap[t];
if (n && n[0].length > 0) {
var r = n[0].shift();
r._ownerEx = e;
this._SetSpriteSharedMaterial(e, r, 0);
n[1].push(r);
}
}
},
_SetSpriteSharedMaterial: function(e, t, n) {
for (var r = e.sharedMaterials, i = null, o = 0; o < r.length; ++o) if (o === n) {
if (i = r[o]) {
i._ownerEx = null;
r[o] = null;
}
t && (r[o] = t);
break;
}
e.sharedMaterials = r;
return i;
}
};
cc.Sprite.prototype._activateMaterial = function() {
if (cc.game.renderType !== cc.game.RENDER_TYPE_CANVAS) {
var e = this._spriteFrame;
if (e && e.textureLoaded()) {
var t = this.sharedMaterials[0];
t ? t instanceof i || (t = r.getInstantiatedMaterial(t, this)) : t = r.getInstantiatedBuiltinMaterial("2d-sprite", this);
var n = e.getTexture();
if (t instanceof i) {
t.SetTexture(n);
this.node && t.SetColor(this.node.color);
} else t.setProperty("texture", n);
this.setMaterial(0, t);
this.markForRender(!0);
} else this.disableRender();
} else {
this.markForUpdateRenderData(!0);
this.markForRender(!0);
}
};
t.exports = o;
cc._RF.pop();
}, {} ],
HelloWorld: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "280c3rsZJJKnZ9RqbALVwtK", "HelloWorld");
var r = e("JsonTableParser"), i = e("LoadController"), o = e("TextTableCenter"), a = e("OtherTableCenter"), s = e("CUtil"), c = e("PxvUIFrameMgr"), l = e("NdfLeft"), u = e("NdfTop"), h = e("NdfRight"), f = e("NdfBottom");
cc.Class({
extends: cc.Component,
properties: {
sprBg: {
default: null,
type: cc.Sprite
},
label: {
default: null,
type: cc.Label
},
label1: {
default: null,
type: cc.Label
},
label2: {
default: null,
type: cc.Label
},
label3: {
default: null,
type: cc.Label
},
label4: {
default: null,
type: cc.Label
},
cocos: {
default: null,
type: cc.Sprite
},
sprite1: {
default: null,
type: cc.Sprite
},
text: "Hello, World!",
sText1s: [],
nLoadCount: 0,
nLoadMax: 0
},
onLoad: function() {
this.label.string = this.text;
var e = new r();
this.nLoadMax++;
e.Load("DataTables/test/array_test", function(t, n, r) {
this.nLoadCount++;
this.sText1s[0] = "";
for (;e.ReadRow(); ) {
this.sText1s[0] += String(e.GetValue("HP"));
this.sText1s[0] += " ";
}
this.checkOnAllLoaded();
}.bind(this), !1);
this.nLoadMax++;
e.Load("DataTables/test/map_test", function(t, n, r) {
this.nLoadCount++;
var i = e.GetRow("BS002");
this.sText1s[1] = i.Name + " ";
this.checkOnAllLoaded();
}.bind(this), !0);
this.nLoadMax++;
i.Reset(function(e) {
console.log("&&&&& Table Loading Progress : %d%", Math.floor(100 * e));
}, function() {
this.nLoadCount++;
this.sText1s[2] = o.GetText("5") + o.GetCaptionByTag("C0") + a.GetGlobalParamRow("5").Desc;
this.checkOnAllLoaded();
}.bind(this));
o.Init("zh_cn", !0);
a.Init();
s.Init("zh_cn", null, function() {
s.LoadSpriteFrame(this.sprite1, "pxc_small");
s.SetSpriteGrayRecursive(this.cocos.node, !0);
s.SetColorRecursive(this.cocos.node, new cc.Color(255, 0, 0, 255));
this.cocos.node.runAction(cc.sequence(cc.delayTime(1), cc.callFunc(function() {
s.SetSpriteGrayRecursive(this.cocos.node, !1);
s.SetColorRecursive(this.cocos.node, new cc.Color(255, 255, 255, 255));
s.ChangeParent(this.sprite1.node, this.label.node);
this.label.node.runAction(cc.moveBy(.5, cc.v2(20, 0)));
}, this)));
}.bind(this));
s.AdaptVisible(this.sprBg.node);
s.FakeRichText("甲甲甲甲#绿一一#乙乙乙乙乙乙#蓝二二#丙丙丙丙#紫三三#完事", [ this.label3.node, this.label4.node ], 20, null, function(e) {
return e.length >= 8;
});
s.RegisterClick(this.sprite1.node, this.onSprite1NodeClick, this);
s.RegisterPush(this.cocos.node, this.onCocosNodeClick, this.onCocosNodeHold, this);
var t = s.GetClsCheckMoveRadian(function(e) {
return e >= 3 * Math.PI / 4 || e <= 3 * -Math.PI / 4;
}, 3, 1);
s.RegisterClickOrMove(this.label.node, this.onLabelNodeClick, this.onLabelNodeMove, this, null, t);
c.Init();
},
update: function(e) {},
checkOnAllLoaded: function() {
if (this.nLoadCount === this.nLoadMax) {
this.label1.string = "";
this.sText1s.forEach(function(e, t) {
this.label1.string += e;
}.bind(this));
this.label2.string = "-20";
}
},
onSprite1NodeClick: function(e) {
this.scaleCocosAndRollLabel2(1.2);
this.label1.string += s.FormatCaption(!0, "C1", 9);
c.OpenNodeFrame(new l(), null, c.EFrameZGroup.Bottom, !1);
c.OpenNodeFrame(new u(), null, null, !1);
c.OpenNodeFrame(new h(), null, c.EFrameZGroup.Top, !1);
c.OpenNodeFrame(new f(), null, null, !1);
},
onCocosNodeClick: function(e) {
this.scaleCocosAndRollLabel2(1.4);
},
onCocosNodeHold: function(e) {
this.scaleCocosAndRollLabel2(1);
},
onLabelNodeClick: function(e) {
this.scaleCocosAndRollLabel2(1.4);
},
onLabelNodeMove: function(e) {
this.scaleCocosAndRollLabel2(1);
},
scaleCocosAndRollLabel2: function(e) {
var t = this.cocos.node.scale;
this.cocos.node.scale = e;
var n = !1, r = -20, i = -20;
if (t > 1) {
n = !n;
r = t > 1.3 ? 20 : -17;
}
if (e > 1) {
n = !n;
i = e > 1.3 ? 20 : -17;
}
n ? s.RollNumber(this.label2, r, i) : this.label2.string = String(i);
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
JsonTableParser: "JsonTableParser",
LoadController: "LoadController",
NdfBottom: "NdfBottom",
NdfLeft: "NdfLeft",
NdfRight: "NdfRight",
NdfTop: "NdfTop",
OtherTableCenter: "OtherTableCenter",
PxvUIFrameMgr: "PxvUIFrameMgr",
TextTableCenter: "TextTableCenter"
} ],
IDPool: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "24ce7hiAJVExozhPiElNTCE", "IDPool");
var r = function(e, t, n) {
if (e > t) {
var r = e;
e = t;
t = r;
} else e === t && t++;
this.nMin = e;
this.nMax = t;
this.nInvalid = n;
this.nCur = n === e ? e + 1 : e;
this.usedFlags = {};
this.freeFlags = {};
this.nFreeNum = 0;
};
r.prototype = {
Generate: function() {
var e = this.nCur;
if (0 === this.nFreeNum) {
if (this.nCur > this.nMax) return this.nInvalid;
for (;this.usedFlags[this.nCur] || this.nCur === this.nInvalid; ) e = ++this.nCur;
this.nCur++;
this.nCur === this.nInvalid && this.nCur++;
} else {
e = Object.keys(this.freeFlags)[0];
delete this.freeFlags[e];
this.nFreeNum--;
}
this.usedFlags[e] = !0;
return e;
},
Free: function(e) {
if (this.usedFlags[e]) {
delete this.usedFlags[e];
this.freeFlags[e] = !0;
this.nFreeNum++;
}
},
Declare: function(e) {
if (this.freeFlags[e]) {
delete this.freeFlags[e];
this.nFreeNum--;
} else if (e < this.nMin || e > this.nMax || e === this.nInvalid) return;
this.usedFlags[e] = !0;
}
};
t.exports = r;
cc._RF.pop();
}, {} ],
JsonTableParser: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "d9394aASMVPhrHpOGbwYL9h", "JsonTableParser");
var r = function() {
this.data = null;
this.nIndex = 0;
}, i = r.prototype;
i.Load = function(e, t, n) {
cc.loader.loadRes(e, function(r, i) {
if (r) cc.error(r.message || r); else {
this.data = i.json;
this.nIndex = n ? -1 : 0;
t && t(e, r, i.json);
}
}.bind(this));
};
i.SetString = function(e, t) {
this.data = JSON.parse(e);
this.nIndex = t ? -1 : 0;
};
i.SetData = function(e, t) {
if (e && e.length > 0) {
this.data = e;
this.nIndex = t ? -1 : 0;
}
};
i.ReadRow = function() {
if (this.nIndex < 0 || this.nIndex + 1 >= this.data.length) return !1;
this.nIndex++;
return !0;
};
i.GetValue = function(e) {
if (this.nIndex < 0) return null;
var t = this.data[this.nIndex][e];
return null === t ? this.data[0][e] : t;
};
i.GetRow = function(e) {
return this.nIndex >= 0 ? null : this.data[e];
};
i.Reset = function() {
this.data = null;
this.nIndex = 0;
};
t.exports = r;
cc._RF.pop();
}, {} ],
LinkedList: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "80e7aGX0MdJkIPU8yDDUBxx", "LinkedList");
var r = e("Comparator"), i = function(e, t) {
this.value = e;
this.next = t;
};
i.prototype = {
toString: function(e) {
return e ? e(this.value) : "${this.value}";
}
};
var o = function(e) {
this.head = null;
this.tail = null;
this.compare = new r(e);
};
o.prototype = {
prepend: function(e) {
var t = new i(e, this.head);
this.head = t;
this.tail || (this.tail = t);
return t;
},
append: function(e) {
var t = new i(e);
if (!this.head) {
this.head = t;
this.tail = t;
return this;
}
this.tail.next = t;
this.tail = t;
return t;
},
delete: function(e) {
if (!this.head) return null;
for (var t = null; this.head && this.compare.equal(this.head.value, e); ) {
t = this.head;
this.head = this.head.next;
}
var n = this.head;
if (null !== n) for (;n.next; ) if (this.compare.equal(n.next.value, e)) {
t = n.next;
n.next = n.next.next;
} else n = n.next;
this.compare.equal(this.tail.value, e) && (this.tail = n);
return t;
},
find: function(e, t) {
if (!this.head) return null;
for (var n = this.head; n; ) {
if (t && t(n.value)) return n;
if (void 0 !== e && this.compare.equal(n.value, e)) return n;
n = n.next;
}
return null;
},
deleteTail: function() {
if (this.head === this.tail) {
var e = this.tail;
this.head = null;
this.tail = null;
return e;
}
for (var t = this.tail, n = this.head; n.next; ) n.next.next ? n = n.next : n.next = null;
this.tail = n;
return t;
},
deleteHead: function() {
if (!this.head) return null;
var e = this.head;
if (this.head.next) this.head = this.head.next; else {
this.head = null;
this.tail = null;
}
return e;
},
toArray: function() {
for (var e = [], t = this.head; t; ) {
e.push(t);
t = t.next;
}
return e;
},
toString: function(e) {
return this.toArray().map(function(t) {
return t.toString(e);
}).toString();
}
};
t.exports = o;
cc._RF.pop();
}, {
Comparator: "Comparator"
} ],
LoadController: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "0e8a9z4LdBMzJCUb2j10Wcc", "LoadController");
var r = {
nParserNum: 0,
nParsedNum: 1,
exLoadFuncs: {},
fnOnProgress: null,
fnOnEnd: null,
CheckEnd: function(e, t, n) {
this.nParsedNum++;
if (this.exLoadFuncs[e]) {
this.exLoadFuncs[e]();
delete this.exLoadFuncs[e];
}
this.fnOnProgress && this.nParserNum > 0 && this.fnOnProgress(Math.min(this.nParsedNum / this.nParserNum, 1));
if (this.nParsedNum === this.nParserNum) {
this.fnOnEnd && this.fnOnEnd();
this.Reset(null);
}
},
GetCheckFunc: function(e, t) {
0 === this.nParserNum && (this.nParsedNum = 0);
this.nParserNum++;
e && (this.exLoadFuncs[e] = t);
return this.CheckEnd.bind(this);
},
Reset: function(e, t) {
this.nParserNum = 0;
this.nParsedNum = 1;
e && (this.fnOnProgress = e);
t && (this.fnOnEnd = t);
}
};
t.exports = r;
cc._RF.pop();
}, {} ],
NdfBottom: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "a06eexB2KlKSKz26p4rZsTx", "NdfBottom");
var r = e("PxvUIFrameMgr"), i = e("CUtil"), o = e("StfBottom");
cc.Class({
extends: cc.Component,
properties: {
node: {
default: null,
type: cc.Node,
override: !0
}
},
ctor: function() {
this.node = new cc.Node();
r.LoadFromPrefab("Test/Bottom", this, function(e, t) {
r.FillNodeFrame(e, this.node, t);
var n = t.getChildByName("Button");
i.RegisterClick(n, this.OnBtnClick, this);
}.bind(this), r.EFrameType.Node);
},
OnBtnClick: function(e) {
r.CloseNodeFrame(this);
r.OpenStackFrame(new o(), null, !1, !1, !1);
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
PxvUIFrameMgr: "PxvUIFrameMgr",
StfBottom: "StfBottom"
} ],
NdfLeft: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "d527dHiZhRCu5Uy+IfxprE8", "NdfLeft");
var r = e("PxvUIFrameMgr"), i = e("CUtil");
cc.Class({
extends: cc.Component,
properties: {
node: {
default: null,
type: cc.Node,
override: !0
}
},
ctor: function() {
this.node = new cc.Node();
r.LoadFromPrefab("Test/Left", this, function(e, t) {
r.FillNodeFrame(e, this.node, t);
var n = t.getChildByName("Button");
i.RegisterClick(n, this.OnBtnClick, this);
}.bind(this), r.EFrameType.Node);
},
OnBtnClick: function(e) {
r.CloseNodeFrame(this);
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
PxvUIFrameMgr: "PxvUIFrameMgr"
} ],
NdfRight: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "15f7evvomROdoJ0un7ODZLM", "NdfRight");
var r = e("PxvUIFrameMgr"), i = e("CUtil");
cc.Class({
extends: cc.Component,
properties: {
node: {
default: null,
type: cc.Node,
override: !0
}
},
ctor: function() {
this.node = new cc.Node();
r.LoadFromPrefab("Test/Right", this, function(e, t) {
r.PresetWidgetOffsets(e, null, -530, null, null);
r.FillNodeFrame(e, this.node, t);
var n = t.getChildByName("Button");
i.RegisterClick(n, this.OnBtnClick, this);
}.bind(this), r.EFrameType.Node);
},
OnBtnClick: function(e) {
r.CloseNodeFrame(this);
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
PxvUIFrameMgr: "PxvUIFrameMgr"
} ],
NdfTop: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "70d9dWp0nNL8ZGyEl0CGIq0", "NdfTop");
var r = e("PxvUIFrameMgr"), i = e("CUtil");
cc.Class({
extends: cc.Component,
properties: {
node: {
default: null,
type: cc.Node,
override: !0
}
},
ctor: function() {
this.node = new cc.Node();
r.LoadFromPrefab("Test/Top", this, function(e, t) {
r.FillNodeFrame(e, this.node, t);
var n = t.getChildByName("Button");
i.RegisterClick(n, this.OnBtnClick, this);
}.bind(this), r.EFrameType.Node);
},
OnBtnClick: function(e) {
r.CloseNodeFrame(this);
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
PxvUIFrameMgr: "PxvUIFrameMgr"
} ],
OtherTableCenter: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "3fc8627zrZDy4V5sj5C9G9W", "OtherTableCenter");
var r = e("JsonTableParser"), i = e("LoadController"), o = {
globalParamParser: null,
Init: function() {
this.globalParamParser = new r();
this.globalParamParser.Load("DataTables/OtherTable/GlobalParam", i.GetCheckFunc(), !0);
},
Release: function() {
this.globalParamParser = null;
},
GetGlobalParamRow: function(e) {
return this.globalParamParser.GetRow(e);
}
};
t.exports = o;
cc._RF.pop();
}, {
JsonTableParser: "JsonTableParser",
LoadController: "LoadController"
} ],
PxvUIFrameMgr: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "ef8b78Q+BNF+YjuS8XAt3z9", "PxvUIFrameMgr");
var r = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
return typeof e;
} : function(e) {
return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
}, i = e("LinkedList"), o = e("Scattered"), a = e("CUtil"), s = e("FrameAdaptations"), c = {
EFrameType: {
Node: 1,
Stack: 2
},
EFrameZGroup: {
Bottom: 1,
Normal: 2,
Top: 3,
Stack: 4
},
sSides: [ "Left", "Bottom", "Right", "Top", "HorizontalCenter", "VerticalCenter" ],
colorMask: new cc.Color(50, 50, 50, 150),
sizeLayout: new cc.Size(960, 640),
nodeLayer: null,
vLayerPosi: null,
nodeFrameMap: {},
nodeFrameListTri: {},
stackFrames: [],
frameWaitMap: {},
Init: function() {
this.nodeLayer = cc.find("Canvas/UILayer");
this.nodeLayer.setContentSize(cc.view.getVisibleSize());
this.vLayerPosi = cc.v2(.5 * this.nodeLayer.width, .5 * this.nodeLayer.height);
this.nodeLayer.position = this.vLayerPosi.neg();
for (var e = this.EFrameZGroup.Bottom; e < this.EFrameZGroup.Stack; ++e) this.nodeFrameListTri[e] = new i();
this.nAdaptFlags = 0;
[ "width", "height" ].forEach(function(e, t) {
var n = Math.abs(this.nodeLayer[e] - this.sizeLayout[e]);
this.nAdaptFlags |= (n > 1e-4 ? 1 : 0) << t;
}.bind(this));
},
LoadFromPrefab: function(e, t, n, r) {
if (r) {
if (this.nodeFrameMap[e]) return !1;
t && (t._sName = e);
}
cc.loader.loadRes("UI/" + e, function(i, o) {
if (i) cc.error(i.message || i); else {
var a = cc.instantiate(o);
a && this._InitPrefabNode(a, r, e);
if (t = t || a) {
this._BindRecursive(t, a);
s[e] && this.nAdaptFlags && this._AdaptRecursive(a, s[e]);
}
n && n(e, a);
}
}.bind(this));
return !0;
},
_InitPrefabNode: function(e, t, n) {
var r = this.vLayerPosi.add(e.position), i = e.getComponent(cc.Widget);
if (t === this.EFrameType.Node) {
if (i) {
r = this._WidgetPairquadFromComp(i);
this.sSides.forEach(function(e, t) {
i["isAlign" + e] = t < 4;
if (t < 4) {
i["isAbsolute" + e] = !0;
i[e.toLowerCase()] = 0;
}
});
} else {
var o = e.width * e.anchorX, a = e.height * e.anchorY;
r = r.add(cc.v2(-o, -a));
e.position = cc.v2(o, a);
}
var s = this.nodeFrameMap[n];
s ? s.pos = r : this._SetWait(n, null, r, !1);
} else t === this.EFrameType.Stack && (i || (e.position = r));
},
_BindRecursive: function(e, t) {
e.nodeBind = t;
var n = {};
t._components.forEach(function(t, r) {
var i = this._CompStringToPrefix(t.name.split(/<|>/)[1]);
if (n[i]) e[i + "Bind" + n[i]++] = t; else {
e[i + "Bind"] = t;
n[i] = 1;
}
}.bind(this));
t.children.forEach(function(t, n) {
if ("_DragArea" !== t.name) {
e[t.name] = {};
this._BindRecursive(e[t.name], t);
}
}.bind(this));
},
FillNodeFrame: function(e, t, n) {
if (t && n) {
t.setAnchorPoint(0, 0);
t.setContentSize(n.getContentSize());
t.addChild(n);
var r = this.nodeFrameMap[e];
if (r) {
if (!r.node) {
r.node = t;
t.name = o.ReplaceG(e, "/", "#");
t.on(cc.Node.EventType.TOUCH_START, this.OnNodeFrameFocus, this);
}
r.pos instanceof cc.Vec2 ? t.position = r.pos : this._AddWidgetByPairQuad(t, r.pos);
r.bFilled = !0;
} else this._SetWait(e, t, null, !0);
this._RegisterNodeDrag(e, n);
}
},
FillStackFrame: function(e, t, n) {
if (t && n) {
t.setAnchorPoint(0, 0);
t.position = cc.v2(0, 0);
t.setContentSize(this.nodeLayer.getContentSize());
t.addChild(n);
for (var r = this.stackFrames.length - 1; r >= 0; --r) {
var i = this.stackFrames[r];
if (i.frame._sName === e && !i.bFilled) {
if (!i.node) {
i.node = t;
t.name = o.ReplaceG(e, "/", "#");
t.on(cc.Node.EventType.TOUCH_START, this.OnStackFrameClick, this);
t.on(cc.Node.EventType.TOUCH_END, this.OnStackFrameClick, this);
}
i.bMask && this._AddMaskSprite(t);
i.bFilled = !0;
break;
}
}
r < 0 && this._SetWait(e, t, null, !0);
}
},
PresetWidgetOffsets: function(e, t, n, i, o) {
var a = null, s = this.nodeFrameMap[e];
if (s) a = s.pos; else {
var c = this.frameWaitMap[e];
c && (a = c.pos);
}
if (a && !(a instanceof cc.Vec2)) {
t && a.Left && !a.Left[1] && (a.Left[0] += t / this.nodeLayer.width);
n && a.Bottom && !a.Bottom[1] && (a.Bottom[0] += n / this.nodeLayer.height);
i && "object" === r(a.Right) && !a.Right[1] && (a.Right[0] += i / this.nodeLayer.width);
o && "object" === r(a.Top) && !a.Top[1] && (a.Top[0] += o / this.nodeLayer.height);
}
},
OpenNodeFrame: function(e, t, n, r) {
if (!e || !e._sName) return !1;
var i = this.nodeFrameMap[e._sName];
if (i) return !1;
n = n || this.EFrameZGroup.Normal;
var a = this.nodeFrameListTri[n];
if (!a) return !1;
var s = t ? e[t] : e.node;
if (!s) return !1;
this.nodeLayer.addChild(s, n);
i = {
frame: e,
node: null,
pos: cc.v2(0, 0),
bFilled: !1
};
this.nodeFrameMap[e._sName] = i;
a.prepend(e);
var c = this.frameWaitMap[e._sName];
if (c) {
i.node = c.node;
i.pos = c.pos;
i.bFilled = c.bFilled;
delete this.frameWaitMap[e._sName];
r = !0;
}
if (r) {
var l = null !== i.node;
l || (i.node = s);
s.name = o.ReplaceG(e._sName, "/", "#");
i.pos instanceof cc.Vec2 ? s.position = i.pos : l && this._AddWidgetByPairQuad(s, i.pos);
s.on(cc.Node.EventType.TOUCH_START, this.OnNodeFrameFocus, this);
}
return !0;
},
OpenStackFrame: function(e, t, n, r, i) {
if (!e || !e._sName) return !1;
var a = t ? e[t] : e.node;
if (!a) return !1;
this.nodeLayer.addChild(a, this.EFrameZGroup.Stack);
var s = this.stackFrames[this.stackFrames.length - 1];
if (s && !n) {
var c = s.node;
if (!c) {
var l = s.frame;
c = s.sNodeName ? l[s.sNodeName] : l.node;
}
c && c.removeFromParent(!1);
}
s = {
frame: e,
sNodeName: t,
node: null,
bDialog: n,
bMask: r,
bFilled: !1
};
this.stackFrames.push(s);
var u = this.frameWaitMap[e._sName];
if (u) {
s.node = u.node;
s.bFilled = u.bFilled;
delete this.frameWaitMap[e._sName];
i = !0;
}
if (i) {
s.node ? r && this._AddMaskSprite(a) : s.node = a;
a.name = o.ReplaceG(e._sName, "/", "#");
a.on(cc.Node.EventType.TOUCH_START, this.OnStackFrameClick, this);
a.on(cc.Node.EventType.TOUCH_END, this.OnStackFrameClick, this);
}
},
CloseNodeFrame: function(e, t) {
if (e && e._sName) {
var n = this.nodeFrameMap[e._sName];
if (n && n.node) {
var r = n.node.zIndex;
n.node.destroy();
delete this.nodeFrameMap[e._sName];
var i = this.nodeFrameListTri[r];
i && i.delete(e);
}
var o = this.frameWaitMap[e._sName];
if (t && o && o.node) {
o.node.destroy();
delete this.frameWaitMap[e._sName];
}
}
},
GoBackStack: function(e) {
var t = this.stackFrames[this.stackFrames.length - 1];
if (t && t.node) {
var n = t.bDialog;
t.node.destroy();
this.stackFrames.pop();
if ((t = this.stackFrames[this.stackFrames.length - 1]) && !n) {
var r = t.node;
if (!r) {
var i = t.frame;
r = t.sNodeName ? i[t.sNodeName] : i.node;
}
this.nodeLayer.addChild(r, this.EFrameZGroup.Stack);
}
}
if (e) {
var o = this.frameWaitMap[e._sName];
if (o && o.node) {
o.node.destroy();
delete this.frameWaitMap[frame._sName];
}
}
},
GetFrameByName: function(e) {
var t = this.nodeFrameMap[e];
if (t) return t.frame;
for (var n = 0; n < this.stackFrames.length; ++n) if ((t = this.stackFrames[n]).frame._sName === e) return t.frame;
return null;
},
_SetWait: function(e, t, n, r) {
var i = this.frameWaitMap[e];
if (i) {
i.node && i.node.destroy();
t && (i.node = t);
n && (i.pos = n);
r && (i.bFilled = r);
} else this.frameWaitMap[e] = {
node: t,
pos: n,
bFilled: r
};
},
_RegisterNodeDrag: function(e, t) {
var n = t.getChildByName("_DragArea");
if (n) {
var r = function() {
var t = this.nodeFrameMap[e];
return t && t.node ? [ t, t.node ] : null;
}.bind(this);
n.on(cc.Node.EventType.TOUCH_START, function(e) {
var t = r();
t && (t[0].vTouchNega = t[1].convertToNodeSpaceAR(e.getLocation()).neg());
});
n.on(cc.Node.EventType.TOUCH_MOVE, function(e) {
var t = r();
t && t[0].vTouchNega && (t[1].position = this.nodeLayer.convertToNodeSpaceAR(e.getLocation()).add(t[0].vTouchNega));
}, this);
n.on(cc.Node.EventType.TOUCH_END, function(e) {
var t = r();
t && delete t[0].vTouchNega;
});
}
},
_WidgetPairquadFromComp: function(e) {
return {
Left: e.isAlignLeft ? [ e.left, e.isAbsoluteLeft ] : e.isAlignHorizontalCenter && [ e.horizontalCenter, e.isAbsoluteHorizontalCenter ],
Bottom: e.isAlignBottom ? [ e.bottom, e.isAbsoluteBottom ] : e.isAlignVerticalCenter && [ e.verticalCenter, e.isAbsoluteVerticalCenter ],
Right: e.isAlignRight ? [ e.right, e.isAbsoluteRight ] : e.isAlignHorizontalCenter,
Top: e.isAlignTop ? [ e.top, e.isAbsoluteTop ] : e.isAlignVerticalCenter,
nMode: e.alignMode
};
},
_AddWidgetByPairQuad: function(e, t) {
var n = e.addComponent(cc.Widget);
n.isAlignLeft = t.Left && !0 !== t.Right;
n.isAlignBottom = t.Bottom && !0 !== t.Top;
n.isAlignRight = "object" === r(t.Right);
n.isAlignTop = "object" === r(t.Top);
n.isAlignHorizontalCenter = !0 === t.Right;
n.isAlignVerticalCenter = !0 === t.Top;
this.sSides.forEach(function(e, r) {
if (n["isAlign" + e]) {
var i = r >= 4 ? this.sSides[r - 4] : e;
n[e.toLowerCase()] = t[i][0];
n["isAbsolute" + e] = t[i][1];
}
}.bind(this));
n.alignMode = t.nMode;
return n;
},
_AddMaskSprite: function(e) {
var t = e.addComponent(cc.Sprite);
t.sizeMode = cc.Sprite.SizeMode.CUSTOM;
a.LoadSpriteFrame(t, "singleColor", null, function() {
e.color = this.colorMask;
e.opacity = this.colorMask.a;
}.bind(this));
},
_AdaptRecursive: function(e, t) {
var n = function(n, i, o) {
o = o || [];
var a = "string" == typeof i.back, s = a ? e.getChildByName(i.back) : e, c = a ? t[i.back] : t, l = n.getPosition(), u = n.getContentSize();
if (1 & this.nAdaptFlags && i.Hori) {
var h = this.nodeLayer.width - this.sizeLayout.width;
o[1] = this._autoAdapt(n, s, i.Hori, c.Hori, a, [ "X", "x", "width" ], h, o[1], o[0], this.nodeLayer.width, l, u);
i.Hori.nOffset && (l.x += h * i.Hori.nOffset);
i.Hori.nSizeRatio && (u.width += h * i.Hori.nSizeRatio);
}
if (2 & this.nAdaptFlags && i.Vert) {
h = this.nodeLayer.height - this.sizeLayout.height;
o[2] = this._autoAdapt(n, s, i.Vert, c.Vert, a, [ "Y", "y", "height" ], h, o[2], o[0], this.nodeLayer.height, l, u);
i.Vert.nOffset && (l.y += h * i.Vert.nOffset);
i.Vert.nSizeRatio && (u.height += h * i.Vert.nSizeRatio);
}
n.position = l;
n.setContentSize(u);
"object" === ("undefined" == typeof i ? "undefined" : r(i)) && this._AdaptRecursive(n, i);
return o;
}.bind(this), i = function(t, r) {
if (r.Group) for (var i = [ e.getChildByName(t + r.Group[1]) ], o = r.Group[0]; o <= r.Group[1]; o += r.Group[2] || 1) {
var a = e.getChildByName(t + o);
n(a, r, i);
} else n(e.getChildByName(t), r);
}, o = [];
for (var a in t) if ("Hori" !== a && "Vert" !== a && "Group" !== a && "Back" !== a) {
var s = t[a];
s.Back ? o.push([ a, s ]) : i(a, s);
}
o.forEach(function(e, t) {
i(e[0], e[1]);
});
},
_autoAdapt: function(e, t, n, r, i, o, a, c, l, u, h, f) {
if (!n.Auto) return c;
var d = !h;
u = u || this.nodeLayer.getContentSize()[o[2]];
h = h || e.position;
f = f || e.getContentSize();
var p = r && r.Auto, m = p ? t.getContentSize()[o[2]] : u, v = p ? r["old" + o[2]] : u - a, g = p ? t.position[o[1]] : 0, C = p ? r["old" + o[1]] : 0, b = this._getIndents([ e, l ], t, n, i, o[0], v, C);
l && (n.FrontIndent = b[0]);
void 0 === c && (c = (m - b[0] - b[1]) / (v - b[0] - b[1]));
n["old" + o[1]] = h[o[1]];
n["old" + o[2]] = f[o[2]];
var y = h[o[1]] - (i ? C : 0);
y += v * t["anchor" + o[0]];
if (n.Auto !== s.EAutoType.None) {
y = (y - b[0]) * c;
if (n.Auto === s.EAutoType.PosAndSize) f[o[2]] *= c; else if (n.Auto === s.EAutoType.PosWithOffset) {
var _ = f[o[2]] - f[o[2]] * e["anchor" + o[0]] * 2;
y += (_ * c - _) / 2;
}
y += b[0];
}
y -= m * t["anchor" + o[0]];
h[o[1]] = y + (p ? i ? g : 0 : -a / 2);
if (d) {
e.position = h;
e.setContentSize(f);
}
return c;
},
_getIndents: function(e, t, n, r, i, o, a) {
a = r ? a : 0;
var s = [];
[ [ "Front", "Min" ], [ "Back", "Max" ] ].forEach(function(r, c) {
var l = 0, u = n[r[0] + "Indent"], h = c && e[1] || e[0];
if ("number" == typeof u) l = u; else if ("string" == typeof u) {
var f = t.getChildByName(u) || h;
l = cc["rectGet" + r[1] + i](f.getBoundingBox());
c && (l = o - l);
} else {
l = cc["rectGet" + r[1] + i](h.getBoundingBox()) - a;
c && (l = o - l);
}
s.push(l);
});
return s;
},
_CompStringToPrefix: function(e) {
switch (e) {
case "Sprite":
return "spr";

case "Label":
return "lbl";

case "Button":
return "btn";

case "RichText":
return "rtx";

case "EditBox":
return "edb";

case "Layout":
return "lyt";

case "PageView":
return "pgv";

case "ProgressBar":
return "pgb";

case "ScrollView":
return "scv";

case "Slider":
return "sld";

case "Toggle":
return "tgl";

case "VideoPlayer":
return "vpl";

case "WebView":
return "wbv";
}
return null;
},
OnNodeFrameFocus: function(e) {
var t = o.ReplaceG(e.target.name, "#", "/"), n = this.nodeFrameMap[t];
if (n) {
var r = e.target.zIndex, i = this.nodeFrameListTri[r];
if (i.head && n.frame !== i.head.value) {
e.target.removeFromParent(!1);
this.nodeLayer.addChild(e.target, r);
i.delete(n.frame) && i.prepend(n.frame);
}
}
e.stopPropagation();
},
OnStackFrameClick: function(e) {
var t = o.ReplaceG(e.target.name, "#", "/"), n = this.stackFrames[this.stackFrames.length - 1];
if (n && n.frame._sName === t && n.bDialog) {
var r = n.node.children[0], i = n.node.convertToNodeSpaceAR(e.getLocation()), a = r.getBoundingBox().contains(i);
if (e.type === cc.Node.EventType.TOUCH_END) {
!a && n.bTouchOut && this.GoBackStack(n.frame);
delete n.bTouchOut;
} else e.type === cc.Node.EventType.TOUCH_START && (n.bTouchOut = !a);
}
e.stopPropagation();
}
};
t.exports = c;
cc._RF.pop();
}, {
CUtil: "CUtil",
FrameAdaptations: "FrameAdaptations",
LinkedList: "LinkedList",
Scattered: "Scattered"
} ],
Random: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "074e2ixUsRDaaRbHkVRK5+I", "Random");
var r = {
RandInt: function(e, t) {
if (e > t) {
var n = e;
e = t;
t = n;
} else if (e === t) return e;
return e + Math.floor(Math.random() * (t - e + 1));
},
RandFloat: function(e, t) {
if (e > t) {
var n = e;
e = t;
t = n;
} else if (Math.abs(t - e) < 1e-7) return e;
return e + Math.random() * (t - e);
},
Rand_1To100: function() {
return this.RandInt(1, 100);
},
Rand_1To360: function(e) {
return e ? this.RandInt(0, 359) : this.RandInt(1, 360);
},
Rand_0To100_Float: function() {
return this.RandFloat(0, 100);
},
Rand_0To360_Float: function() {
return this.RandFloat(0, 360);
},
Rand_0To2PI_Float: function() {
return this.RandFloat(0, 2 * Math.PI);
},
DrawLots: function(e) {
var t = e.length;
return 0 === t ? 0 : e[this.RandInt(0, t - 1)];
},
DrawLotsW: function(e) {
var t = 0;
e.forEach(function(e, n) {
e[1] >= 0 && (t += e[1]);
});
if (0 === t) return 0;
for (var n = this.RandFloat(0, t), r = 0, i = 0; i < e.length; ++i) {
var o = e[i];
if (o[1] >= 0) {
nCurMax = r + o[1];
if (n >= r && n < nCurMax) return o[0];
r = nCurMax;
}
}
return 0;
},
DrawLotsM: function(e, t, n) {
var r = [];
e.forEach(function(i, o) {
t < e.length ? r.push(i) : n.push(i);
});
if (t >= e.length) return n.length > 0;
for (var i = 0; i < t; ++i) {
var o = this.RandInt(0, r.length - 1);
n.push(r[o]);
r.splice(o, 1);
}
return n.length > 0;
},
DrawLotsWM: function(e, t, n) {
var r = [];
e.forEach(function(i, o) {
t < e.length ? r.push(i) : i[1] >= 0 && n.push(i[0]);
});
if (t >= e.length) return n.length > 0;
var i = 0;
r.forEach(function(e, t) {
e[1] >= 0 && (i += e[1]);
});
if (0 === i) return !1;
for (var o = 0; o < t && !(i <= 0); ++o) for (var a = this.RandFloat(0, i), s = 0, c = 0; c < r.length; ++c) {
var l = r[c];
if (l[1] >= 0) {
var u = s + l[1];
if (a >= s && a < u) {
n.push(l[0]);
i -= l[1];
r.splice(c, 1);
break;
}
s = u;
}
}
return n.length > 0;
}
};
t.exports = r;
cc._RF.pop();
}, {} ],
Scattered: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "cfbffaxlRlNr4tQSn+ck9ns", "Scattered");
var r = {
ReplaceG: function(e, t, n) {
var r = new RegExp(t, "g");
return e.replace(r, n);
}
};
t.exports = r;
cc._RF.pop();
}, {} ],
StateMachine: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "06e24tJpNVFz7v36bPq0sp/", "StateMachine");
var r = function() {
this.stateMap = {};
this.sCurrent = null;
};
r.prototype = {
AddState: function(e, t, n) {
this.stateMap[e] || (this.stateMap[e] = {
fnOnEnter: t,
fnOnExit: n,
eventMap: {}
});
},
AddTransfer: function(e, t, n) {
var r = this.stateMap[e];
if (!r) return !1;
if (!this.stateMap[n]) return !1;
if (!r.eventMap[t]) {
r.eventMap[t] = n;
return !0;
}
return !1;
},
SetState: function(e, t) {
if (e === this.sCurrent) return !0;
var n = this.sCurrent ? this.stateMap[this.sCurrent] : null;
if (!t) {
if (!n) return !1;
var r = !1;
for (var i in n.eventMap) if (n.eventMap[i] === e) {
r = !0;
break;
}
if (!r) return !1;
}
var o = this.stateMap[e];
if (o) {
n && n.fnOnExit();
this.sCurrent = e;
o.fnOnEnter();
return !0;
}
return !1;
},
TriggerEvent: function(e) {
var t = this.sCurrent ? this.stateMap[this.sCurrent] : null;
if (!t) return !1;
var n = t.eventMap[e];
return !!n && this.SetState(n, !0);
},
GetStateNum: function() {
var e = 0;
for (var t in this.stateMap) e++;
return e;
},
GetCurrentState: function() {
return this.sCurrent;
}
};
t.exports = r;
cc._RF.pop();
}, {} ],
StfBottomDlg: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "452fdYMPdNMfZeAx9BY+fRg", "StfBottomDlg");
var r = e("PxvUIFrameMgr"), i = e("CUtil");
cc.Class({
extends: cc.Component,
properties: {
node: {
default: null,
type: cc.Node,
override: !0
}
},
ctor: function() {
this.node = new cc.Node();
r.LoadFromPrefab("Test/Bottom", this, function(e, t) {
r.FillStackFrame(e, this.node, t);
var n = t.getChildByName("Button");
i.RegisterClick(n, this.OnBtnClick, this);
n.getChildByName("Label").getComponent(cc.Label).string = "BottomD";
}.bind(this), r.EFrameType.Stack);
},
OnBtnClick: function(e) {
r.GoBackStack(this);
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
PxvUIFrameMgr: "PxvUIFrameMgr"
} ],
StfBottom: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "c027cFPzu9DELWZr2ZuloQS", "StfBottom");
var r = e("PxvUIFrameMgr"), i = e("CUtil"), o = e("StfLeft");
cc.Class({
extends: cc.Component,
properties: {
node: {
default: null,
type: cc.Node,
override: !0
},
bCanBack: !1
},
ctor: function() {
this.node = new cc.Node();
r.LoadFromPrefab("Test/Bottom", this, function(e, t) {
r.FillStackFrame(e, this.node, t);
var n = t.getChildByName("Button");
i.RegisterClick(n, this.OnBtnClick, this);
n.getChildByName("Label").getComponent(cc.Label).string = "BottomS";
}.bind(this), r.EFrameType.Stack);
},
OnBtnClick: function(e) {
if (this.bCanBack) r.GoBackStack(this); else {
r.OpenStackFrame(new o(), null, !1, !1, !1);
this.bCanBack = !0;
}
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
PxvUIFrameMgr: "PxvUIFrameMgr",
StfLeft: "StfLeft"
} ],
StfLeft: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "69aa2q+Y3xHZYGNkQuc7urT", "StfLeft");
var r = e("PxvUIFrameMgr"), i = e("CUtil"), o = e("StfBottomDlg");
cc.Class({
extends: cc.Component,
properties: {
node: {
default: null,
type: cc.Node,
override: !0
},
bCanBack: !1
},
ctor: function() {
this.node = new cc.Node();
r.LoadFromPrefab("Test/LeftS", this, function(e, t) {
r.FillStackFrame(e, this.node, t);
var n = t.getChildByName("Button");
i.RegisterClick(n, this.OnBtnClick, this);
}.bind(this), r.EFrameType.Stack);
},
OnBtnClick: function(e) {
if (this.bCanBack) r.GoBackStack(this); else {
r.OpenStackFrame(new o(), null, !0, !0, !1);
this.bCanBack = !0;
}
}
});
cc._RF.pop();
}, {
CUtil: "CUtil",
PxvUIFrameMgr: "PxvUIFrameMgr",
StfBottomDlg: "StfBottomDlg"
} ],
TextTableCenter: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "305c0xhmT9Gd4LhtCuGNUBQ", "TextTableCenter");
var r = e("JsonTableParser"), i = e("LoadController"), o = {
textParser: null,
captionParser: null,
captionTagMap: {},
storyTextParser: null,
Init: function(e, t) {
var n = "DataTables/TextTable/" + e + "/";
this.textParser = new r();
this.textParser.Load(n + "Text", i.GetCheckFunc(), !0);
this.captionParser = new r();
this.captionParser.Load(n + "Caption", i.GetCheckFunc(n + "Caption", function() {
if (t) for (var e in this.captionParser.data) this.captionTagMap[this.captionParser.GetRow(e).Tag] = e;
}.bind(this)), !0);
this.storyTextParser = new r();
this.storyTextParser.Load(n + "StoryText", i.GetCheckFunc(), !0);
},
Release: function() {
this.textParser = null;
this.captionParser = null;
this.captionTagMap = {};
this.storyTextParser = null;
},
GetTextRow: function(e) {
return this.textParser.GetRow(e);
},
GetText: function(e) {
var t = this.textParser.GetRow(e);
return t ? t.Text : "";
},
GetCaptionRow: function(e) {
return this.captionParser.GetRow(e);
},
GetCaption: function(e) {
var t = this.captionParser.GetRow(e);
return t ? t.Text : "";
},
GetCaptionByTag: function(e) {
var t = this.captionTagMap[e];
if (t) {
var n = this.captionParser.GetRow(t);
if (n) return n.Text;
}
return "";
},
GetStoryTextRow: function(e) {
return this.storyTextParser.GetRow(e);
},
GetStoryText: function(e) {
var t = this.storyTextParser.GetRow(e);
return t ? t.Text : "";
}
};
t.exports = o;
cc._RF.pop();
}, {
JsonTableParser: "JsonTableParser",
LoadController: "LoadController"
} ],
format: [ function(e, t, n) {
"use strict";
cc._RF.push(t, "bb93expcZhHuaoAxd5xA9qW", "format");
(function() {
var e;
(e = "undefined" != typeof t ? t.exports = n : function() {
return this || (0, eval)("this");
}()).format = n;
e.vsprintf = function(e, t) {
return n.apply(null, [ e ].concat(t));
};
"undefined" != typeof console && "function" == typeof console.log && (e.printf = function() {
console.log(n.apply(null, arguments));
});
function n(e) {
for (var t, n, r, i, o = 1, a = [].slice.call(arguments), s = 0, c = e.length, l = "", u = !1, h = !1, f = function() {
return a[o++];
}, d = function() {
for (var n = ""; /\d/.test(e[s]); ) {
n += e[s++];
t = e[s];
}
return n.length > 0 ? parseInt(n) : null;
}; s < c; ++s) {
t = e[s];
if (u) {
u = !1;
if ("." == t) {
h = !1;
t = e[++s];
} else if ("0" == t && "." == e[s + 1]) {
h = !0;
t = e[s += 2];
} else h = !0;
i = d();
switch (t) {
case "b":
l += parseInt(f(), 10).toString(2);
break;

case "c":
"string" == typeof (n = f()) || n instanceof String ? l += n : l += String.fromCharCode(parseInt(n, 10));
break;

case "d":
l += parseInt(f(), 10);
break;

case "f":
r = String(parseFloat(f()).toFixed(i || 6));
l += h ? r : r.replace(/^0/, "");
break;

case "j":
l += JSON.stringify(f());
break;

case "o":
l += "0" + parseInt(f(), 10).toString(8);
break;

case "s":
l += f();
break;

case "x":
l += "0x" + parseInt(f(), 10).toString(16);
break;

case "X":
l += "0x" + parseInt(f(), 10).toString(16).toUpperCase();
break;

default:
l += t;
}
} else "%" === t ? u = !0 : l += t;
}
return l;
}
})();
cc._RF.pop();
}, {} ],
md5: [ function(require, module, exports) {
(function(process, global) {
"use strict";
cc._RF.push(module, "1783ej/ha9PGJzpJmvkybfx", "md5");
var _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
return typeof e;
} : function(e) {
return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
};
(function() {
var ERROR = "input is invalid type", WINDOW = "object" === ("undefined" == typeof window ? "undefined" : _typeof(window)), root = WINDOW ? window : {};
root.JS_MD5_NO_WINDOW && (WINDOW = !1);
var WEB_WORKER = !WINDOW && "object" === ("undefined" == typeof self ? "undefined" : _typeof(self)), NODE_JS = !root.JS_MD5_NO_NODE_JS && "object" === ("undefined" == typeof process ? "undefined" : _typeof(process)) && process.versions && process.versions.node;
NODE_JS ? root = global : WEB_WORKER && (root = self);
var COMMON_JS = !root.JS_MD5_NO_COMMON_JS && "object" === ("undefined" == typeof module ? "undefined" : _typeof(module)) && module.exports, AMD = "function" == typeof define && define.amd, ARRAY_BUFFER = !root.JS_MD5_NO_ARRAY_BUFFER && "undefined" != typeof ArrayBuffer, HEX_CHARS = "0123456789abcdef".split(""), EXTRA = [ 128, 32768, 8388608, -2147483648 ], SHIFT = [ 0, 8, 16, 24 ], OUTPUT_TYPES = [ "hex", "array", "digest", "buffer", "arrayBuffer", "base64" ], BASE64_ENCODE_CHAR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split(""), blocks = [], buffer8;
if (ARRAY_BUFFER) {
var buffer = new ArrayBuffer(68);
buffer8 = new Uint8Array(buffer);
blocks = new Uint32Array(buffer);
}
!root.JS_MD5_NO_NODE_JS && Array.isArray || (Array.isArray = function(e) {
return "[object Array]" === Object.prototype.toString.call(e);
});
var createOutputMethod = function(e) {
return function(t) {
return new Md5(!0).update(t)[e]();
};
}, createMethod = function() {
var e = createOutputMethod("hex");
NODE_JS && (e = nodeWrap(e));
e.create = function() {
return new Md5();
};
e.update = function(t) {
return e.create().update(t);
};
for (var t = 0; t < OUTPUT_TYPES.length; ++t) {
var n = OUTPUT_TYPES[t];
e[n] = createOutputMethod(n);
}
return e;
}, nodeWrap = function nodeWrap(method) {
var crypto = eval("require('crypto')"), Buffer = eval("require('buffer').Buffer"), nodeMethod = function(e) {
if ("string" == typeof e) return crypto.createHash("md5").update(e, "utf8").digest("hex");
if (null === e || void 0 === e) throw ERROR;
e.constructor === ArrayBuffer && (e = new Uint8Array(e));
return Array.isArray(e) || ArrayBuffer.isView(e) || e.constructor === Buffer ? crypto.createHash("md5").update(new Buffer(e)).digest("hex") : method(e);
};
return nodeMethod;
};
function Md5(e) {
if (e) {
blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
this.blocks = blocks;
this.buffer8 = buffer8;
} else if (ARRAY_BUFFER) {
var t = new ArrayBuffer(68);
this.buffer8 = new Uint8Array(t);
this.blocks = new Uint32Array(t);
} else this.blocks = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
this.h0 = this.h1 = this.h2 = this.h3 = this.start = this.bytes = 0;
this.finalized = this.hashed = !1;
this.first = !0;
}
Md5.prototype.update = function(e) {
if (!this.finalized) {
var t = "string" != typeof e;
if (t) {
if (null === e || void 0 === e) throw ERROR;
e.constructor === root.ArrayBuffer && (e = new Uint8Array(e));
}
var n = e.length;
if (t && ("number" != typeof n || !Array.isArray(e) && (!ARRAY_BUFFER || !ArrayBuffer.isView(e)))) throw ERROR;
for (var r, i, o = 0, a = this.blocks, s = this.buffer8; o < n; ) {
if (this.hashed) {
this.hashed = !1;
a[0] = a[16];
a[16] = a[1] = a[2] = a[3] = a[4] = a[5] = a[6] = a[7] = a[8] = a[9] = a[10] = a[11] = a[12] = a[13] = a[14] = a[15] = 0;
}
if (t) if (ARRAY_BUFFER) for (i = this.start; o < n && i < 64; ++o) s[i++] = e[o]; else for (i = this.start; o < n && i < 64; ++o) a[i >> 2] |= e[o] << SHIFT[3 & i++]; else if (ARRAY_BUFFER) for (i = this.start; o < n && i < 64; ++o) if ((r = e.charCodeAt(o)) < 128) s[i++] = r; else if (r < 2048) {
s[i++] = 192 | r >> 6;
s[i++] = 128 | 63 & r;
} else if (r < 55296 || r >= 57344) {
s[i++] = 224 | r >> 12;
s[i++] = 128 | r >> 6 & 63;
s[i++] = 128 | 63 & r;
} else {
r = 65536 + ((1023 & r) << 10 | 1023 & e.charCodeAt(++o));
s[i++] = 240 | r >> 18;
s[i++] = 128 | r >> 12 & 63;
s[i++] = 128 | r >> 6 & 63;
s[i++] = 128 | 63 & r;
} else for (i = this.start; o < n && i < 64; ++o) if ((r = e.charCodeAt(o)) < 128) a[i >> 2] |= r << SHIFT[3 & i++]; else if (r < 2048) {
a[i >> 2] |= (192 | r >> 6) << SHIFT[3 & i++];
a[i >> 2] |= (128 | 63 & r) << SHIFT[3 & i++];
} else if (r < 55296 || r >= 57344) {
a[i >> 2] |= (224 | r >> 12) << SHIFT[3 & i++];
a[i >> 2] |= (128 | r >> 6 & 63) << SHIFT[3 & i++];
a[i >> 2] |= (128 | 63 & r) << SHIFT[3 & i++];
} else {
r = 65536 + ((1023 & r) << 10 | 1023 & e.charCodeAt(++o));
a[i >> 2] |= (240 | r >> 18) << SHIFT[3 & i++];
a[i >> 2] |= (128 | r >> 12 & 63) << SHIFT[3 & i++];
a[i >> 2] |= (128 | r >> 6 & 63) << SHIFT[3 & i++];
a[i >> 2] |= (128 | 63 & r) << SHIFT[3 & i++];
}
this.lastByteIndex = i;
this.bytes += i - this.start;
if (i >= 64) {
this.start = i - 64;
this.hash();
this.hashed = !0;
} else this.start = i;
}
return this;
}
};
Md5.prototype.finalize = function() {
if (!this.finalized) {
this.finalized = !0;
var e = this.blocks, t = this.lastByteIndex;
e[t >> 2] |= EXTRA[3 & t];
if (t >= 56) {
this.hashed || this.hash();
e[0] = e[16];
e[16] = e[1] = e[2] = e[3] = e[4] = e[5] = e[6] = e[7] = e[8] = e[9] = e[10] = e[11] = e[12] = e[13] = e[14] = e[15] = 0;
}
e[14] = this.bytes << 3;
this.hash();
}
};
Md5.prototype.hash = function() {
var e, t, n, r, i, o, a = this.blocks;
if (this.first) t = ((t = ((e = ((e = a[0] - 680876937) << 7 | e >>> 25) - 271733879 << 0) ^ (n = ((n = (-271733879 ^ (r = ((r = (-1732584194 ^ 2004318071 & e) + a[1] - 117830708) << 12 | r >>> 20) + e << 0) & (-271733879 ^ e)) + a[2] - 1126478375) << 17 | n >>> 15) + r << 0) & (r ^ e)) + a[3] - 1316259209) << 22 | t >>> 10) + n << 0; else {
e = this.h0;
t = this.h1;
n = this.h2;
t = ((t += ((e = ((e += ((r = this.h3) ^ t & (n ^ r)) + a[0] - 680876936) << 7 | e >>> 25) + t << 0) ^ (n = ((n += (t ^ (r = ((r += (n ^ e & (t ^ n)) + a[1] - 389564586) << 12 | r >>> 20) + e << 0) & (e ^ t)) + a[2] + 606105819) << 17 | n >>> 15) + r << 0) & (r ^ e)) + a[3] - 1044525330) << 22 | t >>> 10) + n << 0;
}
t = ((t += ((e = ((e += (r ^ t & (n ^ r)) + a[4] - 176418897) << 7 | e >>> 25) + t << 0) ^ (n = ((n += (t ^ (r = ((r += (n ^ e & (t ^ n)) + a[5] + 1200080426) << 12 | r >>> 20) + e << 0) & (e ^ t)) + a[6] - 1473231341) << 17 | n >>> 15) + r << 0) & (r ^ e)) + a[7] - 45705983) << 22 | t >>> 10) + n << 0;
t = ((t += ((e = ((e += (r ^ t & (n ^ r)) + a[8] + 1770035416) << 7 | e >>> 25) + t << 0) ^ (n = ((n += (t ^ (r = ((r += (n ^ e & (t ^ n)) + a[9] - 1958414417) << 12 | r >>> 20) + e << 0) & (e ^ t)) + a[10] - 42063) << 17 | n >>> 15) + r << 0) & (r ^ e)) + a[11] - 1990404162) << 22 | t >>> 10) + n << 0;
t = ((t += ((e = ((e += (r ^ t & (n ^ r)) + a[12] + 1804603682) << 7 | e >>> 25) + t << 0) ^ (n = ((n += (t ^ (r = ((r += (n ^ e & (t ^ n)) + a[13] - 40341101) << 12 | r >>> 20) + e << 0) & (e ^ t)) + a[14] - 1502002290) << 17 | n >>> 15) + r << 0) & (r ^ e)) + a[15] + 1236535329) << 22 | t >>> 10) + n << 0;
t = ((t += ((r = ((r += (t ^ n & ((e = ((e += (n ^ r & (t ^ n)) + a[1] - 165796510) << 5 | e >>> 27) + t << 0) ^ t)) + a[6] - 1069501632) << 9 | r >>> 23) + e << 0) ^ e & ((n = ((n += (e ^ t & (r ^ e)) + a[11] + 643717713) << 14 | n >>> 18) + r << 0) ^ r)) + a[0] - 373897302) << 20 | t >>> 12) + n << 0;
t = ((t += ((r = ((r += (t ^ n & ((e = ((e += (n ^ r & (t ^ n)) + a[5] - 701558691) << 5 | e >>> 27) + t << 0) ^ t)) + a[10] + 38016083) << 9 | r >>> 23) + e << 0) ^ e & ((n = ((n += (e ^ t & (r ^ e)) + a[15] - 660478335) << 14 | n >>> 18) + r << 0) ^ r)) + a[4] - 405537848) << 20 | t >>> 12) + n << 0;
t = ((t += ((r = ((r += (t ^ n & ((e = ((e += (n ^ r & (t ^ n)) + a[9] + 568446438) << 5 | e >>> 27) + t << 0) ^ t)) + a[14] - 1019803690) << 9 | r >>> 23) + e << 0) ^ e & ((n = ((n += (e ^ t & (r ^ e)) + a[3] - 187363961) << 14 | n >>> 18) + r << 0) ^ r)) + a[8] + 1163531501) << 20 | t >>> 12) + n << 0;
t = ((t += ((r = ((r += (t ^ n & ((e = ((e += (n ^ r & (t ^ n)) + a[13] - 1444681467) << 5 | e >>> 27) + t << 0) ^ t)) + a[2] - 51403784) << 9 | r >>> 23) + e << 0) ^ e & ((n = ((n += (e ^ t & (r ^ e)) + a[7] + 1735328473) << 14 | n >>> 18) + r << 0) ^ r)) + a[12] - 1926607734) << 20 | t >>> 12) + n << 0;
t = ((t += ((o = (r = ((r += ((i = t ^ n) ^ (e = ((e += (i ^ r) + a[5] - 378558) << 4 | e >>> 28) + t << 0)) + a[8] - 2022574463) << 11 | r >>> 21) + e << 0) ^ e) ^ (n = ((n += (o ^ t) + a[11] + 1839030562) << 16 | n >>> 16) + r << 0)) + a[14] - 35309556) << 23 | t >>> 9) + n << 0;
t = ((t += ((o = (r = ((r += ((i = t ^ n) ^ (e = ((e += (i ^ r) + a[1] - 1530992060) << 4 | e >>> 28) + t << 0)) + a[4] + 1272893353) << 11 | r >>> 21) + e << 0) ^ e) ^ (n = ((n += (o ^ t) + a[7] - 155497632) << 16 | n >>> 16) + r << 0)) + a[10] - 1094730640) << 23 | t >>> 9) + n << 0;
t = ((t += ((o = (r = ((r += ((i = t ^ n) ^ (e = ((e += (i ^ r) + a[13] + 681279174) << 4 | e >>> 28) + t << 0)) + a[0] - 358537222) << 11 | r >>> 21) + e << 0) ^ e) ^ (n = ((n += (o ^ t) + a[3] - 722521979) << 16 | n >>> 16) + r << 0)) + a[6] + 76029189) << 23 | t >>> 9) + n << 0;
t = ((t += ((o = (r = ((r += ((i = t ^ n) ^ (e = ((e += (i ^ r) + a[9] - 640364487) << 4 | e >>> 28) + t << 0)) + a[12] - 421815835) << 11 | r >>> 21) + e << 0) ^ e) ^ (n = ((n += (o ^ t) + a[15] + 530742520) << 16 | n >>> 16) + r << 0)) + a[2] - 995338651) << 23 | t >>> 9) + n << 0;
t = ((t += ((r = ((r += (t ^ ((e = ((e += (n ^ (t | ~r)) + a[0] - 198630844) << 6 | e >>> 26) + t << 0) | ~n)) + a[7] + 1126891415) << 10 | r >>> 22) + e << 0) ^ ((n = ((n += (e ^ (r | ~t)) + a[14] - 1416354905) << 15 | n >>> 17) + r << 0) | ~e)) + a[5] - 57434055) << 21 | t >>> 11) + n << 0;
t = ((t += ((r = ((r += (t ^ ((e = ((e += (n ^ (t | ~r)) + a[12] + 1700485571) << 6 | e >>> 26) + t << 0) | ~n)) + a[3] - 1894986606) << 10 | r >>> 22) + e << 0) ^ ((n = ((n += (e ^ (r | ~t)) + a[10] - 1051523) << 15 | n >>> 17) + r << 0) | ~e)) + a[1] - 2054922799) << 21 | t >>> 11) + n << 0;
t = ((t += ((r = ((r += (t ^ ((e = ((e += (n ^ (t | ~r)) + a[8] + 1873313359) << 6 | e >>> 26) + t << 0) | ~n)) + a[15] - 30611744) << 10 | r >>> 22) + e << 0) ^ ((n = ((n += (e ^ (r | ~t)) + a[6] - 1560198380) << 15 | n >>> 17) + r << 0) | ~e)) + a[13] + 1309151649) << 21 | t >>> 11) + n << 0;
t = ((t += ((r = ((r += (t ^ ((e = ((e += (n ^ (t | ~r)) + a[4] - 145523070) << 6 | e >>> 26) + t << 0) | ~n)) + a[11] - 1120210379) << 10 | r >>> 22) + e << 0) ^ ((n = ((n += (e ^ (r | ~t)) + a[2] + 718787259) << 15 | n >>> 17) + r << 0) | ~e)) + a[9] - 343485551) << 21 | t >>> 11) + n << 0;
if (this.first) {
this.h0 = e + 1732584193 << 0;
this.h1 = t - 271733879 << 0;
this.h2 = n - 1732584194 << 0;
this.h3 = r + 271733878 << 0;
this.first = !1;
} else {
this.h0 = this.h0 + e << 0;
this.h1 = this.h1 + t << 0;
this.h2 = this.h2 + n << 0;
this.h3 = this.h3 + r << 0;
}
};
Md5.prototype.hex = function() {
this.finalize();
var e = this.h0, t = this.h1, n = this.h2, r = this.h3;
return HEX_CHARS[e >> 4 & 15] + HEX_CHARS[15 & e] + HEX_CHARS[e >> 12 & 15] + HEX_CHARS[e >> 8 & 15] + HEX_CHARS[e >> 20 & 15] + HEX_CHARS[e >> 16 & 15] + HEX_CHARS[e >> 28 & 15] + HEX_CHARS[e >> 24 & 15] + HEX_CHARS[t >> 4 & 15] + HEX_CHARS[15 & t] + HEX_CHARS[t >> 12 & 15] + HEX_CHARS[t >> 8 & 15] + HEX_CHARS[t >> 20 & 15] + HEX_CHARS[t >> 16 & 15] + HEX_CHARS[t >> 28 & 15] + HEX_CHARS[t >> 24 & 15] + HEX_CHARS[n >> 4 & 15] + HEX_CHARS[15 & n] + HEX_CHARS[n >> 12 & 15] + HEX_CHARS[n >> 8 & 15] + HEX_CHARS[n >> 20 & 15] + HEX_CHARS[n >> 16 & 15] + HEX_CHARS[n >> 28 & 15] + HEX_CHARS[n >> 24 & 15] + HEX_CHARS[r >> 4 & 15] + HEX_CHARS[15 & r] + HEX_CHARS[r >> 12 & 15] + HEX_CHARS[r >> 8 & 15] + HEX_CHARS[r >> 20 & 15] + HEX_CHARS[r >> 16 & 15] + HEX_CHARS[r >> 28 & 15] + HEX_CHARS[r >> 24 & 15];
};
Md5.prototype.toString = Md5.prototype.hex;
Md5.prototype.digest = function() {
this.finalize();
var e = this.h0, t = this.h1, n = this.h2, r = this.h3;
return [ 255 & e, e >> 8 & 255, e >> 16 & 255, e >> 24 & 255, 255 & t, t >> 8 & 255, t >> 16 & 255, t >> 24 & 255, 255 & n, n >> 8 & 255, n >> 16 & 255, n >> 24 & 255, 255 & r, r >> 8 & 255, r >> 16 & 255, r >> 24 & 255 ];
};
Md5.prototype.array = Md5.prototype.digest;
Md5.prototype.arrayBuffer = function() {
this.finalize();
var e = new ArrayBuffer(16), t = new Uint32Array(e);
t[0] = this.h0;
t[1] = this.h1;
t[2] = this.h2;
t[3] = this.h3;
return e;
};
Md5.prototype.buffer = Md5.prototype.arrayBuffer;
Md5.prototype.base64 = function() {
for (var e, t, n, r = "", i = this.array(), o = 0; o < 15; ) {
e = i[o++];
t = i[o++];
n = i[o++];
r += BASE64_ENCODE_CHAR[e >>> 2] + BASE64_ENCODE_CHAR[63 & (e << 4 | t >>> 4)] + BASE64_ENCODE_CHAR[63 & (t << 2 | n >>> 6)] + BASE64_ENCODE_CHAR[63 & n];
}
e = i[o];
return r += BASE64_ENCODE_CHAR[e >>> 2] + BASE64_ENCODE_CHAR[e << 4 & 63] + "==";
};
var exports = createMethod();
if (COMMON_JS) module.exports = exports; else {
root.md5 = exports;
AMD && define(function() {
return exports;
});
}
})();
cc._RF.pop();
}).call(this, require("_process"), "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
}, {
_process: 1
} ],
utf8: [ function(e, t, n) {
(function(e) {
"use strict";
cc._RF.push(t, "8bd31Cecm5EcbBQJmBmMRnF", "utf8");
var r = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(e) {
return typeof e;
} : function(e) {
return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
};
(function(i) {
var o = "object" == ("undefined" == typeof n ? "undefined" : r(n)) && n, a = "object" == ("undefined" == typeof t ? "undefined" : r(t)) && t && t.exports == o && t, s = "object" == ("undefined" == typeof e ? "undefined" : r(e)) && e;
s.global !== s && s.window !== s || (i = s);
var c, l, u, h = String.fromCharCode;
function f(e) {
for (var t, n, r = [], i = 0, o = e.length; i < o; ) if ((t = e.charCodeAt(i++)) >= 55296 && t <= 56319 && i < o) if (56320 == (64512 & (n = e.charCodeAt(i++)))) r.push(((1023 & t) << 10) + (1023 & n) + 65536); else {
r.push(t);
i--;
} else r.push(t);
return r;
}
function d(e) {
for (var t, n = e.length, r = -1, i = ""; ++r < n; ) {
if ((t = e[r]) > 65535) {
i += h((t -= 65536) >>> 10 & 1023 | 55296);
t = 56320 | 1023 & t;
}
i += h(t);
}
return i;
}
function p(e) {
if (e >= 55296 && e <= 57343) throw Error("Lone surrogate U+" + e.toString(16).toUpperCase() + " is not a scalar value");
}
function m(e, t) {
return h(e >> t & 63 | 128);
}
function v(e) {
if (0 == (4294967168 & e)) return h(e);
var t = "";
if (0 == (4294965248 & e)) t = h(e >> 6 & 31 | 192); else if (0 == (4294901760 & e)) {
p(e);
t = h(e >> 12 & 15 | 224);
t += m(e, 6);
} else if (0 == (4292870144 & e)) {
t = h(e >> 18 & 7 | 240);
t += m(e, 12);
t += m(e, 6);
}
return t += h(63 & e | 128);
}
function g() {
if (u >= l) throw Error("Invalid byte index");
var e = 255 & c[u];
u++;
if (128 == (192 & e)) return 63 & e;
throw Error("Invalid continuation byte");
}
function C() {
var e, t;
if (u > l) throw Error("Invalid byte index");
if (u == l) return !1;
e = 255 & c[u];
u++;
if (0 == (128 & e)) return e;
if (192 == (224 & e)) {
if ((t = (31 & e) << 6 | g()) >= 128) return t;
throw Error("Invalid continuation byte");
}
if (224 == (240 & e)) {
if ((t = (15 & e) << 12 | g() << 6 | g()) >= 2048) {
p(t);
return t;
}
throw Error("Invalid continuation byte");
}
if (240 == (248 & e) && (t = (7 & e) << 18 | g() << 12 | g() << 6 | g()) >= 65536 && t <= 1114111) return t;
throw Error("Invalid UTF-8 detected");
}
var b = {
version: "2.1.2",
encode: function(e) {
for (var t = f(e), n = t.length, r = -1, i = ""; ++r < n; ) i += v(t[r]);
return i;
},
decode: function(e) {
c = f(e);
l = c.length;
u = 0;
for (var t, n = []; !1 !== (t = C()); ) n.push(t);
return d(n);
}
};
if ("function" == typeof define && "object" == r(define.amd) && define.amd) define(function() {
return b;
}); else if (o && !o.nodeType) if (a) a.exports = b; else {
var y = {}.hasOwnProperty;
for (var _ in b) y.call(b, _) && (o[_] = b[_]);
} else i.utf8 = b;
})(void 0);
cc._RF.pop();
}).call(this, "undefined" != typeof global ? global : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
}, {} ]
}, {}, [ "CUtil", "GLMaterialMgr", "LoadController", "OtherTableCenter", "TextTableCenter", "HelloWorld", "IDPool", "JsonTableParser", "Random", "Scattered", "StateMachine", "Comparator", "LinkedList", "format", "md5", "utf8", "FrameAdaptations", "PxvUIFrameMgr", "NdfBottom", "NdfLeft", "NdfRight", "NdfTop", "StfBottom", "StfBottomDlg", "StfLeft" ]);