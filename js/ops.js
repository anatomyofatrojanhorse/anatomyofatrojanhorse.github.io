"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Anim=Ops.Anim || {};
Ops.Html=Ops.Html || {};
Ops.Math=Ops.Math || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const fpsLimit=op.inValue("FPS Limit",0);
const trigger=op.outTrigger("trigger");
const width=op.outValue("width");
const height=op.outValue("height");
const reduceLoadingFPS=op.inValueBool("Reduce FPS loading");
const clear=op.inValueBool("Clear",true);
const clearAlpha=op.inValueBool("ClearAlpha",true);
const fullscreen=op.inValueBool("Fullscreen Button",false);
const active=op.inValueBool("Active",true);
const hdpi=op.inValueBool("Hires Displays",false);

op.onAnimFrame=render;
hdpi.onChange=function()
{
    if(hdpi.get()) op.patch.cgl.pixelDensity=window.devicePixelRatio;
        else op.patch.cgl.pixelDensity=1;

    op.patch.cgl.updateSize();
    if(CABLES.UI) gui.setLayout();
};

active.onChange=function()
{
    op.patch.removeOnAnimFrame(op);

    if(active.get())
    {
        op.setUiAttrib({"extendTitle":""});
        op.onAnimFrame=render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({"extendTitle":"Inactive"});
    }

};

var cgl=op.patch.cgl;
var rframes=0;
var rframeStart=0;

if(!op.patch.cgl) op.uiAttr( { 'error': 'No webgl cgl context' } );

var identTranslate=vec3.create();
vec3.set(identTranslate, 0,0,0);
var identTranslateView=vec3.create();
vec3.set(identTranslateView, 0,0,-2);

fullscreen.onChange=updateFullscreenButton;
setTimeout(updateFullscreenButton,100);
var fsElement=null;

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if(fsElement)fsElement.style.display="block";
    }

    function onMouseLeave()
    {
        if(fsElement)fsElement.style.display="none";
    }

    op.patch.cgl.canvas.addEventListener('mouseleave', onMouseLeave);
    op.patch.cgl.canvas.addEventListener('mouseenter', onMouseEnter);

    if(fullscreen.get())
    {
        if(!fsElement)
        {
            fsElement = document.createElement('div');

            var container = op.patch.cgl.canvas.parentElement;
            if(container)container.appendChild(fsElement);

            fsElement.addEventListener('mouseenter', onMouseEnter);
            fsElement.addEventListener('click', function(e)
            {
                if(CABLES.UI && !e.shiftKey) gui.cycleRendererSize();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding="10px";
        fsElement.style.position="absolute";
        fsElement.style.right="5px";
        fsElement.style.top="5px";
        fsElement.style.width="20px";
        fsElement.style.height="20px";
        fsElement.style.cursor="pointer";
        fsElement.style['border-radius']="40px";
        fsElement.style.background="#444";
        fsElement.style["z-index"]="9999";
        fsElement.style.display="none";
        fsElement.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 490 490" style="width:20px;height:20px;" xml:space="preserve" width="512px" height="512px"><g><path d="M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z" fill="#FFFFFF"/><path d="M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z" fill="#FFFFFF"/><path d="M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z" fill="#FFFFFF"/><path d="M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z" fill="#FFFFFF"/></g></svg>';
    }
    else
    {
        if(fsElement)
        {
            fsElement.style.display="none";
            fsElement.remove();
            fsElement=null;
        }
    }
}

fpsLimit.onChange=function()
{
    op.patch.config.fpsLimit=fpsLimit.get()||0;
};

op.onDelete=function()
{
    cgl.gl.clearColor(0,0,0,0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

op.patch.loading.setOnFinishedLoading(function(cb)
{
    op.patch.config.fpsLimit=fpsLimit.get();
});


function render(time)
{
    if(!active.get())return;
    if(cgl.aborted || cgl.canvas.clientWidth===0 || cgl.canvas.clientHeight===0)return;

    if(op.patch.loading.getProgress()<1.0 && reduceLoadingFPS.get())
    {
        op.patch.config.fpsLimit=5;
    }

    if(cgl.canvasWidth==-1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if(cgl.canvasWidth!=width.get() || cgl.canvasHeight!=height.get())
    {
        width.set(cgl.canvasWidth);
        height.set(cgl.canvasHeight);
    }

    if(CABLES.now()-rframeStart>1000)
    {
        CGL.fpsReport=CGL.fpsReport||[];
        if(op.patch.loading.getProgress()>=1.0 && rframeStart!==0)CGL.fpsReport.push(rframes);
        rframes=0;
        rframeStart=CABLES.now();
    }
    CGL.MESH.lastShader=null;
    CGL.MESH.lastMesh=null;

    cgl.renderStart(cgl,identTranslate,identTranslateView);

    if(clear.get())
    {
        cgl.gl.clearColor(0,0,0,1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if(CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if(CGL.Texture.previewTexture)
    {
        if(!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer=new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    if(clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if(!cgl.frameStore.phong)cgl.frameStore.phong={};
    rframes++;
};











};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Sequence
// 
// **************************************************************

Ops.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe=op.inTrigger("exe");
const exes=[];
const triggers=[];
const num=16;
exe.onTriggered=triggerAll;

function triggerAll()
{
    for(var i=0;i<triggers.length;i++) triggers[i].trigger();
}

for(var i=0;i<num;i++)
{
    triggers.push( op.outTrigger("trigger "+i));

    if(i<num-1)
    {
        var newExe=op.inTrigger("exe "+i);
        newExe.onTriggered=triggerAll;
        exes.push( newExe );
    }
}

};

Ops.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Sequence,objName:"Ops.Sequence"};




// **************************************************************
// 
// Ops.Gl.Render2Texture
// 
// **************************************************************

Ops.Gl.Render2Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const cgl=op.patch.cgl;

const
    render=op.inTrigger('render'),
    useVPSize=op.inValueBool("use viewport size",true),
    width=op.inValueInt("texture width",512),
    height=op.inValueInt("texture height",512),
    tfilter=op.inSwitch("filter",['nearest','linear','mipmap'],'linear'),
    msaa=op.inSwitch("MSAA",["none","2x","4x","8x"],"none"),
    trigger=op.outTrigger('trigger'),
    tex=op.outTexture("texture"),
    texDepth=op.outTexture("textureDepth"),
    fpTexture=op.inValueBool("HDR"),
    depth=op.inValueBool("Depth",true),
    clear=op.inValueBool("Clear",true);

var fb=null;
var reInitFb=true;
tex.set(CGL.Texture.getEmptyTexture(cgl));

op.setPortGroup('Alignment',[useVPSize,width,height,tfilter]);


// todo why does it only work when we render a mesh before>?>?????
// only happens with matcap material with normal map....

useVPSize.onChange=updateVpSize;
function updateVpSize()
{
    if(useVPSize.get())
    {
        width.setUiAttribs({greyout:true});
        height.setUiAttribs({greyout:true});
    }
    else
    {
        width.setUiAttribs({greyout:false});
        height.setUiAttribs({greyout:false});
    }
}

function initFbLater()
{
    reInitFb=true;
}

fpTexture.onChange=
    depth.onChange=
    clear.onChange=
    tfilter.onChange=
    msaa.onChange=initFbLater;

function doRender()
{
    if(!fb || reInitFb)
    {
        if(fb) fb.delete();
        if(cgl.glVersion>=2)
        {
            var ms=true;
            var msSamples=4;

            if(msaa.get()=="none")
            {
                msSamples=0;
                ms=false;
            }
            if(msaa.get()=="2x")msSamples=2;
            if(msaa.get()=="4x")msSamples=4;
            if(msaa.get()=="8x")msSamples=8;

            fb=new CGL.Framebuffer2(cgl,8,8,
            {
                isFloatingPointTexture:fpTexture.get(),
                multisampling:ms,
                depth:depth.get(),
                multisamplingSamples:msSamples,
                clear:clear.get()
            });
        }
        else
        {
            fb=new CGL.Framebuffer(cgl,8,8,{isFloatingPointTexture:fpTexture.get()});
        }

        if(tfilter.get()=='nearest') fb.setFilter(CGL.Texture.FILTER_NEAREST);
            else if(tfilter.get()=='linear') fb.setFilter(CGL.Texture.FILTER_LINEAR);
            else if(tfilter.get()=='mipmap') fb.setFilter(CGL.Texture.FILTER_MIPMAP);

        texDepth.set(fb.getTextureDepth());
        reInitFb=false;
    }

    if(useVPSize.val)
    {
        width.set( cgl.getViewPort()[2] );
        height.set( cgl.getViewPort()[3] );
    }

    if(fb.getWidth()!=Math.ceil(width.get()) || fb.getHeight()!=Math.ceil(height.get()) )
    {
        fb.setSize(
            Math.max(1,Math.ceil(width.get())),
            Math.max(1,Math.ceil(height.get())) );
    }

    fb.renderStart(cgl);

    trigger.trigger();
    fb.renderEnd(cgl);

    cgl.resetViewPort();

    tex.set( CGL.Texture.getEmptyTexture(op.patch.cgl));

    tex.set( fb.getTextureColor() );
}


render.onTriggered=doRender;
op.preRender=doRender;


updateVpSize();

};

Ops.Gl.Render2Texture.prototype = new CABLES.Op();
CABLES.OPS["d01fa820-396c-4cb5-9d78-6b14762852af"]={f:Ops.Gl.Render2Texture,objName:"Ops.Gl.Render2Texture"};




// **************************************************************
// 
// Ops.Gl.Matrix.OrbitControls
// 
// **************************************************************

Ops.Gl.Matrix.OrbitControls = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render=op.inTrigger("render");
const minDist=op.inValueFloat("min distance");
const maxDist=op.inValueFloat("max distance");

const minRotY=op.inValue("min rot y",0);
const maxRotY=op.inValue("max rot y",0);

// const minRotX=op.inValue("min rot x",0);
// const maxRotX=op.inValue("max rot x",0);

const initialRadius=op.inValue("initial radius",0);
const initialAxis=op.inValueSlider("initial axis y");
const initialX=op.inValueSlider("initial axis x");

const mul=op.inValueFloat("mul");
const smoothness=op.inValueSlider("Smoothness",1.0);
const speedX=op.inValue("Speed X",1);
const speedY=op.inValue("Speed Y",1);

const active=op.inValueBool("Active",true);

const allowPanning=op.inValueBool("Allow Panning",true);
const allowZooming=op.inValueBool("Allow Zooming",true);
const allowRotation=op.inValueBool("Allow Rotation",true);
const restricted=op.inValueBool("restricted",true);
const pointerLock=op.inValueBool("Pointerlock",false);

const trigger=op.outTrigger("trigger");
const outRadius=op.outValue("radius");
const outXDeg=op.outValue("Rot X");
const outYDeg=op.outValue("Rot Y");


// const
//     outPosX=op.outNumber("Eye Pos X"),
//     outPosY=op.outNumber("Eye Pos Y"),
//     outPosZ=op.outNumber("Eye Pos Z");

const inReset=op.inTriggerButton("Reset");

op.setPortGroup("Initial Values",[initialAxis,initialX,initialRadius]);
op.setPortGroup("Interaction",[mul,smoothness,speedX,speedY]);
op.setPortGroup("Boundaries",[minRotY,maxRotY,minDist,maxDist]);


mul.set(1);
minDist.set(0.05);
maxDist.set(99999);

inReset.onTriggered=reset;

const cgl=op.patch.cgl;
var eye=vec3.create();
var vUp=vec3.create();
var vCenter=vec3.create();
var viewMatrix=mat4.create();
var tempViewMatrix=mat4.create();
var vOffset=vec3.create();
var finalEyeAbs=vec3.create();

initialAxis.set(0.5);


var mouseDown=false;
var radius=5;
outRadius.set(radius);

var lastMouseX=0,lastMouseY=0;
var percX=0,percY=0;


vec3.set(vCenter, 0,0,0);
vec3.set(vUp, 0,1,0);

var tempEye=vec3.create();
var finalEye=vec3.create();
var tempCenter=vec3.create();
var finalCenter=vec3.create();

var px=0;
var py=0;

var divisor=1;
var element=null;
updateSmoothness();

op.onDelete=unbind;

var doLockPointer=false;

pointerLock.onChange=function()
{
    doLockPointer=pointerLock.get();
    console.log("doLockPointer",doLockPointer);
};

function reset()
{
    px=px%(Math.PI*2);
    py=py%(Math.PI*2);

    vec3.set(vOffset,0,0,0);
    vec3.set(vCenter, 0,0,0);
    vec3.set(vUp, 0,1,0);

    percX=(initialX.get()*Math.PI*2);
    percY=(initialAxis.get()-0.5);
    radius=initialRadius.get();
    eye=circlePos( percY );
}

function updateSmoothness()
{
    divisor=smoothness.get()*10+1.0;
}

smoothness.onChange=updateSmoothness;

var initializing=true;

function ip(val,goal)
{
    if(initializing)return goal;
    return val+(goal-val)/divisor;
}

var lastPy=0;
var lastPx=0;

render.onTriggered=function()
{
    cgl.pushViewMatrix();

    px=ip(px,percX);
    py=ip(py,percY);

    var degY=(py+0.5)*180;


    if(minRotY.get()!==0 && degY<minRotY.get())
    {
        degY=minRotY.get();
        py=lastPy;
    }
    else if(maxRotY.get()!==0 && degY>maxRotY.get())
    {
        degY=maxRotY.get();
        py=lastPy;
    }
    else
    {
        lastPy=py;
    }

    var degX=(px)*CGL.RAD2DEG;

    outYDeg.set( degY );
    outXDeg.set( degX );

    circlePosi(eye, py );

    vec3.add(tempEye, eye, vOffset);
    vec3.add(tempCenter, vCenter, vOffset);

    finalEye[0]=ip(finalEye[0],tempEye[0]);
    finalEye[1]=ip(finalEye[1],tempEye[1]);
    finalEye[2]=ip(finalEye[2],tempEye[2]);

    finalCenter[0]=ip(finalCenter[0],tempCenter[0]);
    finalCenter[1]=ip(finalCenter[1],tempCenter[1]);
    finalCenter[2]=ip(finalCenter[2],tempCenter[2]);






    var empty=vec3.create();
    // var fpm=mat4.create();

    // mat4.translate(fpm, fpm, finalEye);
    // mat4.rotate(fpm, fpm, px, vUp);
    // mat4.multiply(fpm,fpm, cgl.vMatrix);
    // vec3.transformMat4(finalEyeAbs, empty, fpm);

    // outPosX.set(finalEyeAbs[0]);
    // outPosY.set(finalEyeAbs[1]);
    // outPosZ.set(finalEyeAbs[2]);



    mat4.lookAt(viewMatrix, finalEye, finalCenter, vUp);
    mat4.rotate(viewMatrix, viewMatrix, px, vUp);

    // finaly multiply current scene viewmatrix
    mat4.multiply(cgl.vMatrix,cgl.vMatrix,viewMatrix);







    // vec3.transformMat4(finalEyeAbs, empty, cgl.vMatrix);

    // outPosX.set(finalEyeAbs[0]);
    // outPosY.set(finalEyeAbs[1]);
    // outPosZ.set(finalEyeAbs[2]);



    // var fpm=mat4.create();
    // mat4.identity(fpm);
    // mat4.translate(fpm,fpm,finalEye);
    // mat4.rotate(fpm, fpm, px, vUp);
    // mat4.multiply(fpm,fpm,cgl.vMatrix);

    // // vec3.copy(finalEyeAbs,finalEye);
    // // vec3.set(finalEyeAbs,0,1,0);
    // // mat4.rotate(viewMatrix, viewMatrix, px, vUp);
    // // vec3.transformMat4( finalEyeAbs, finalEye, fpm );

    // // vec3.transformMat4( finalEyeAbs, finalEyeAbs, cgl.vMatrix );
    // // mat4.getTranslation(finalEyeAbs,fpm);
    // var pos=vec3.create();
    // vec3.transformMat4(finalEyeAbs, empty, fpm);


    // outPosX.set(finalEyeAbs[0]);
    // outPosY.set(finalEyeAbs[1]);
    // outPosZ.set(finalEyeAbs[2]);


    trigger.trigger();
    cgl.popViewMatrix();
    initializing=false;
};

function circlePosi(vec,perc)
{
    const mmul=mul.get();
    if(radius<minDist.get()*mmul) radius = minDist.get() * mmul;
    if(radius>maxDist.get()*mmul) radius = maxDist.get() * mmul;

    outRadius.set(radius*mmul);

    var i=0,degInRad=0;
    // var vec=vec3.create();
    degInRad = 360*perc/2*CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad)*radius*mmul,
        Math.sin(degInRad)*radius*mmul,
        0);
    return vec;
}


function circlePos(perc)
{
    const mmul=mul.get();
    if(radius<minDist.get()*mmul)radius=minDist.get()*mmul;
    if(radius>maxDist.get()*mmul)radius=maxDist.get()*mmul;

    outRadius.set(radius*mmul);

    var i=0,degInRad=0;
    var vec=vec3.create();
    degInRad = 360*perc/2*CGL.DEG2RAD;
    vec3.set(vec,
        Math.cos(degInRad)*radius*mmul,
        Math.sin(degInRad)*radius*mmul,
        0);
    return vec;
}

function onmousemove(event)
{
    if(!mouseDown) return;

    var x = event.clientX;
    var y = event.clientY;

    var movementX=(x-lastMouseX);
    var movementY=(y-lastMouseY);

    if(doLockPointer)
    {
        movementX=event.movementX*mul.get();
        movementY=event.movementY*mul.get();
    }

    movementX*=speedX.get();
    movementY*=speedY.get();

    if(event.which==3 && allowPanning.get())
    {
        vOffset[2]+=movementX*0.01*mul.get();
        vOffset[1]+=movementY*0.01*mul.get();
    }
    else
    if(event.which==2 && allowZooming.get())
    {
        radius+=movementY*0.05;
        eye=circlePos(percY);
    }
    else
    {
        if(allowRotation.get())
        {
            percX+=movementX*0.003;
            percY+=movementY*0.002;

            if(restricted.get())
            {
                if(percY>0.5)percY=0.5;
                if(percY<-0.5)percY=-0.5;
            }
        }
    }

    lastMouseX=x;
    lastMouseY=y;
}

function onMouseDown(event)
{
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    mouseDown=true;

    if(doLockPointer)
    {
        var el=op.patch.cgl.canvas;
        el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock;
        if(el.requestPointerLock) el.requestPointerLock();
        else console.log("no t found");
        // document.addEventListener("mousemove", onmousemove, false);

        document.addEventListener('pointerlockchange', lockChange, false);
        document.addEventListener('mozpointerlockchange', lockChange, false);
        document.addEventListener('webkitpointerlockchange', lockChange, false);
    }
}

function onMouseUp()
{
    mouseDown=false;
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';

    if(doLockPointer)
    {
        document.removeEventListener('pointerlockchange', lockChange, false);
        document.removeEventListener('mozpointerlockchange', lockChange, false);
        document.removeEventListener('webkitpointerlockchange', lockChange, false);

        if(document.exitPointerLock) document.exitPointerLock();
        document.removeEventListener("mousemove", pointerLock, false);
    }
}

function lockChange()
{
    var el=op.patch.cgl.canvas;

    if (document.pointerLockElement === el || document.mozPointerLockElement === el || document.webkitPointerLockElement === el)
    {
        document.addEventListener("mousemove", onmousemove, false);
        console.log("listening...");
    }
}

function onMouseEnter(e)
{
    // cgl.canvas.style.cursor='url(/ui/img/rotate.png),pointer';
}

initialRadius.onChange=function()
{
    radius=initialRadius.get();
    reset();
};

initialX.onChange=function()
{
    px=percX=(initialX.get()*Math.PI*2);
};

initialAxis.onChange=function()
{
    py=percY=(initialAxis.get()-0.5);
    eye=circlePos(percY);
};

var onMouseWheel=function(event)
{
    if(allowZooming.get())
    {
        var delta=CGL.getWheelSpeed(event)*0.06;
        radius+=(parseFloat(delta))*1.2;

        eye=circlePos(percY);
        event.preventDefault();
    }
};

var ontouchstart=function(event)
{
    doLockPointer=false;
    if(event.touches && event.touches.length>0) onMouseDown(event.touches[0]);
};

var ontouchend=function(event)
{
    doLockPointer=false;
    onMouseUp();
};

var ontouchmove=function(event)
{
    doLockPointer=false;
    if(event.touches && event.touches.length>0) onmousemove(event.touches[0]);
};

active.onChange=function()
{
    if(active.get())bind();
        else unbind();
}

function setElement(ele)
{
    unbind();
    element=ele;
    bind();
}

function bind()
{
    element.addEventListener('mousemove', onmousemove);
    element.addEventListener('mousedown', onMouseDown);
    element.addEventListener('mouseup', onMouseUp);
    element.addEventListener('mouseleave', onMouseUp);
    element.addEventListener('mouseenter', onMouseEnter);
    element.addEventListener('contextmenu', function(e){e.preventDefault();});
    element.addEventListener('wheel', onMouseWheel);

    element.addEventListener('touchmove', ontouchmove);
    element.addEventListener('touchstart', ontouchstart);
    element.addEventListener('touchend', ontouchend);
}

function unbind()
{
    if(!element)return;

    element.removeEventListener('mousemove', onmousemove);
    element.removeEventListener('mousedown', onMouseDown);
    element.removeEventListener('mouseup', onMouseUp);
    element.removeEventListener('mouseleave', onMouseUp);
    element.removeEventListener('mouseenter', onMouseUp);
    element.removeEventListener('wheel', onMouseWheel);

    element.removeEventListener('touchmove', ontouchmove);
    element.removeEventListener('touchstart', ontouchstart);
    element.removeEventListener('touchend', ontouchend);
}

eye=circlePos(0);
setElement(cgl.canvas);


bind();

initialX.set(0.25);
initialRadius.set(0.05);


};

Ops.Gl.Matrix.OrbitControls.prototype = new CABLES.Op();
CABLES.OPS["eaf4f7ce-08a3-4d1b-b9f4-ebc0b7b1cde1"]={f:Ops.Gl.Matrix.OrbitControls,objName:"Ops.Gl.Matrix.OrbitControls"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inSpeed=op.inValue("Speed",1),
    playPause=op.inValueBool("Play",true),
    reset=op.inTriggerButton("Reset"),
    inSyncTimeline=op.inValueBool("Sync to timeline",false),
    outTime=op.outValue("Time");

op.setPortGroup("Controls",[playPause,reset,inSpeed]);

const timer=new CABLES.Timer();
var lastTime=null;
var time=0;
var syncTimeline=false;

playPause.onChange=setState;
setState();

function setState()
{
    if(playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered=doReset;

function doReset()
{
    time=0;
    lastTime=null;
    timer.setTime(0);
    outTime.set(0);
};

inSyncTimeline.onChange=function()
{
    syncTimeline=inSyncTimeline.get();
    playPause.setUiAttribs({greyout:syncTimeline});
    reset.setUiAttribs({greyout:syncTimeline});
};

op.onAnimFrame=function(tt)
{
    if(timer.isPlaying())
    {

        if(CABLES.overwriteTime!==undefined)
        {
            outTime.set(CABLES.overwriteTime*inSpeed.get());

        } else

        if(syncTimeline)
        {
            outTime.set(tt*inSpeed.get());
        }
        else
        {
            timer.update();
            var timerVal=timer.get();



            if(lastTime===null)
            {
                lastTime=timerVal;
                return;
            }

            var t=Math.abs(timerVal-lastTime);
            lastTime=timerVal;




            time+=t*inSpeed.get();
            if(time!=time)time=0;
            outTime.set(time);
        }
    }
};




};

Ops.Anim.Timer_v2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.PointMaterial
// 
// **************************************************************

Ops.Gl.Shader.PointMaterial = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"\n{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n#ifdef HAS_TEXTURES\n\n   #ifdef HAS_TEXTURE_DIFFUSE\n       UNI sampler2D diffTex;\n   #endif\n   #ifdef HAS_TEXTURE_MASK\n       UNI sampler2D texMask;\n   #endif\n#endif\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\n\n#ifdef VERTEX_COLORS\n    IN vec3 vertexColor;\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n\n    vec4 col=vec4(r,g,b,a);\n\n    #ifdef HAS_TEXTURES\n\n        #ifdef HAS_TEXTURE_MASK\n            float mask;\n            #ifdef LOOKUP_TEXTURE\n                mask=texture(texMask,texCoord).r;\n            #endif\n            #ifndef LOOKUP_TEXTURE\n                mask=texture(texMask,vec2(gl_PointCoord.x,(1.0-gl_PointCoord.y))).r;\n            #endif\n\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n\n            #ifdef LOOKUP_TEXTURE\n                col=texture(diffTex,texCoord);\n            #endif\n            #ifndef LOOKUP_TEXTURE\n                col=texture(diffTex,vec2(gl_PointCoord.x,(1.0-gl_PointCoord.y)));\n            #endif\n\n            #ifdef COLORIZE_TEXTURE\n              col.r*=r;\n              col.g*=g;\n              col.b*=b;\n            #endif\n        #endif\n        col.a*=a;\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef MAKE_ROUND\n        if ((gl_PointCoord.x-0.5)*(gl_PointCoord.x-0.5) + (gl_PointCoord.y-0.5)*(gl_PointCoord.y-0.5) > 0.25) discard; //col.a=0.0;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        col.rgb*=vertexColor;\n    #endif\n\n\n    #ifdef HAS_TEXTURE_MASK\n        col.a=mask;\n    #endif\n\n\n    // #ifdef RANDOMIZE_COLOR\n        // col.rgb*=fract(sin(dot(texCoord.xy ,vec2(12.9898,78.233))) * 43758.5453);\n    // #endif\n\n\n\n    outColor = col;\n}\n",shader_vert:"{{MODULES_HEAD}}\nIN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n   IN vec3 attrTangent;\n   IN vec3 attrBiTangent;\n\n#ifdef VERTEX_COLORS\n    IN vec3 attrVertColor;\n    OUT vec3 vertexColor;\n#endif\n\nOUT vec3 norm;\n#ifdef HAS_TEXTURES\n    OUT vec2 texCoord;\n#endif\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nUNI float pointSize;\nUNI vec3 camPos;\n\nUNI float canvasWidth;\nUNI float canvasHeight;\nUNI float camDistMul;\n\nUNI float randomSize;\n\nIN float attrVertIndex;\n\n\nfloat rand(float n){return fract(sin(n) * 43758.5453123);}\n\n#define POINTMATERIAL\n\nvoid main()\n{\n    float psMul=sqrt(canvasWidth/canvasHeight)+0.00000000001;\n    float sizeMultiply=1.0;\n\n    vec3 tangent=attrTangent;\n    vec3 bitangent=attrBiTangent;\n\n\n    #ifdef VERTEX_COLORS\n        vertexColor=attrVertColor;\n    #endif\n\n    #ifdef HAS_TEXTURES\n        texCoord=attrTexCoord;\n    #endif\n\n    mat4 mMatrix=modelMatrix;\n\n    vec4 pos = vec4( vPosition, 1. );\n\n    {{MODULE_VERTEX_POSITION}}\n\n    vec4 model=mMatrix * pos;\n\n    psMul+=rand(attrVertIndex)*randomSize;\n\n    psMul*=sizeMultiply;\n\n    #ifndef SCALE_BY_DISTANCE\n        gl_PointSize = pointSize * psMul;\n    #endif\n    #ifdef SCALE_BY_DISTANCE\n        float cameraDist = distance(model.xyz, camPos);\n        gl_PointSize = (pointSize / cameraDist) * psMul;\n    #endif\n\n    gl_Position = projMatrix * viewMatrix * model;\n}\n",};
const cgl=op.patch.cgl;

const
    render=op.inTrigger("render"),
    pointSize=op.inValueFloat("PointSize",3),
    randomSize=op.inValue("Random Size",3),
    makeRound=op.inValueBool("Round",true),
    doScale=op.inValueBool("Scale by Distance",false),
    r = op.inValueSlider("r", Math.random()),
    g = op.inValueSlider("g", Math.random()),
    b = op.inValueSlider("b", Math.random()),
    a = op.inValueSlider("a",1),
    preMultipliedAlpha=op.inValueBool("preMultiplied alpha"),
    vertCols=op.inBool("Vertex Colors",false),
    texture=op.inTexture("texture"),
    textureMask=op.inTexture("Texture Mask"),
    colorizeTexture=op.inValueBool("colorizeTexture",false),
    textureLookup=op.inValueBool("texture Lookup",false),
    trigger=op.outTrigger('trigger'),
    shaderOut=op.outObject("shader");

op.setPortGroup("Texture",[textureLookup,textureMask,texture,colorizeTexture]);
op.setPortGroup("Color",[r,g,b,a,preMultipliedAlpha,vertCols]);
op.setPortGroup("Size",[pointSize,randomSize,makeRound,doScale]);
r.setUiAttribs({ colorPick: true });

const shader=new CGL.Shader(cgl,'PointMaterial');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
shader.define('MAKE_ROUND');

const
    uniPointSize=new CGL.Uniform(shader,'f','pointSize',pointSize),
    uniRandomSize=new CGL.Uniform(shader,'f','randomSize',randomSize),
    runiform=new CGL.Uniform(shader,'f','r',r),
    guniform=new CGL.Uniform(shader,'f','g',g),
    buniform=new CGL.Uniform(shader,'f','b',b),
    auniform=new CGL.Uniform(shader,'f','a',a),
    uniWidth=new CGL.Uniform(shader,'f','canvasWidth',cgl.canvasWidth),
    uniHeight=new CGL.Uniform(shader,'f','canvasHeight',cgl.canvasHeight);

shaderOut.set(shader);
shader.setSource(attachments.shader_vert,attachments.shader_frag);
shader.glPrimitive=cgl.gl.POINTS;
shader.bindTextures=bindTextures;
shaderOut.ignoreValueSerialize=true;

render.onTriggered=doRender;

var textureUniform=null;
var textureMaskUniform=null;

op.preRender=function()
{
    if(shader)shader.bind();
    doRender();
};

function bindTextures()
{
    if(texture.get()) cgl.setTexture(0,texture.get().tex);
    if(textureMask.get()) cgl.setTexture(1,textureMask.get().tex);
}

function doRender()
{
    uniWidth.setValue(cgl.canvasWidth);
    uniHeight.setValue(cgl.canvasHeight);

    cgl.setShader(shader);
    bindTextures();
    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);

    trigger.trigger();
    if(preMultipliedAlpha.get())cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.setPreviousShader();
}

doScale.onChange=function()
{
    shader.toggleDefine('SCALE_BY_DISTANCE',doScale.get());
};

makeRound.onChange=function()
{
    shader.toggleDefine('MAKE_ROUND',makeRound.get());
};

colorizeTexture.onChange=function()
{
    shader.toggleDefine('COLORIZE_TEXTURE',colorizeTexture.get());
};

textureLookup.onChange=function()
{
    shader.toggleDefine('LOOKUP_TEXTURE',textureLookup.get());
};

vertCols.onChange=function()
{
    shader.toggleDefine('VERTEX_COLORS',vertCols.get());
};

texture.onChange=function()
{
    if(texture.get())
    {
        if(textureUniform!==null)return;
        shader.removeUniform('diffTex');
        shader.define('HAS_TEXTURE_DIFFUSE');
        textureUniform=new CGL.Uniform(shader,'t','diffTex',0);
    }
    else
    {
        shader.removeUniform('diffTex');
        shader.removeDefine('HAS_TEXTURE_DIFFUSE');
        textureUniform=null;
    }
};

textureMask.onChange=function()
{
    if(textureMask.get())
    {
        if(textureMaskUniform!==null)return;
        shader.removeUniform('texMask');
        shader.define('HAS_TEXTURE_MASK');
        textureMaskUniform=new CGL.Uniform(shader,'t','texMask',1);
    }
    else
    {
        shader.removeUniform('texMask');
        shader.removeDefine('HAS_TEXTURE_MASK');
        textureMaskUniform=null;
    }
};



};

Ops.Gl.Shader.PointMaterial.prototype = new CABLES.Op();
CABLES.OPS["f86a4a07-00ee-4f68-8839-e02d51d1cd2f"]={f:Ops.Gl.Shader.PointMaterial,objName:"Ops.Gl.Shader.PointMaterial"};




// **************************************************************
// 
// Ops.Gl.Matrix.Transform
// 
// **************************************************************

Ops.Gl.Matrix.Transform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render=op.inTrigger("render"),
    posX=op.inValue("posX",0),
    posY=op.inValue("posY",0),
    posZ=op.inValue("posZ",0),
    scale=op.inValue("scale",1),
    rotX=op.inValue("rotX",0),
    rotY=op.inValue("rotY",0),
    rotZ=op.inValue("rotZ",0),
    trigger=op.outTrigger("trigger");

op.setPortGroup('Rotation',[rotX,rotY,rotZ]);
op.setPortGroup('Position',[posX,posY,posZ]);
op.setPortGroup('Scale',[scale]);
op.setUiAxisPorts(posX,posY,posZ);

const cgl=op.patch.cgl;
var vPos=vec3.create();
var vScale=vec3.create();
var transMatrix = mat4.create();
mat4.identity(transMatrix);

var
    doScale=false,
    doTranslate=false,
    translationChanged=true,
    scaleChanged=true,
    rotChanged=true;

rotX.onChange=rotY.onChange=rotZ.onChange=setRotChanged;
posX.onChange=posY.onChange=posZ.onChange=setTranslateChanged;
scale.onChange=setScaleChanged;

render.onTriggered=function()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    var updateMatrix=false;
    if(translationChanged)
    {
        updateTranslation();
        updateMatrix=true;
    }
    if(scaleChanged)
    {
        updateScale();
        updateMatrix=true;
    }
    if(rotChanged) updateMatrix=true;

    if(updateMatrix) doUpdateMatrix();

    cgl.pushModelMatrix();
    mat4.multiply(cgl.mMatrix,cgl.mMatrix,transMatrix);

    trigger.trigger();
    cgl.popModelMatrix();

    if(CABLES.UI && gui.patch().isCurrentOp(op))
        gui.setTransformGizmo(
            {
                posX:posX,
                posY:posY,
                posZ:posZ,
            });
};

op.transform3d=function()
{
    return { pos:[posX,posY,posZ] };
};

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if(doTranslate)mat4.translate(transMatrix,transMatrix, vPos);

    if(rotX.get()!==0)mat4.rotateX(transMatrix,transMatrix, rotX.get()*CGL.DEG2RAD);
    if(rotY.get()!==0)mat4.rotateY(transMatrix,transMatrix, rotY.get()*CGL.DEG2RAD);
    if(rotZ.get()!==0)mat4.rotateZ(transMatrix,transMatrix, rotZ.get()*CGL.DEG2RAD);

    if(doScale)mat4.scale(transMatrix,transMatrix, vScale);
    rotChanged=false;
}

function updateTranslation()
{
    doTranslate=false;
    if(posX.get()!==0.0 || posY.get()!==0.0 || posZ.get()!==0.0) doTranslate=true;
    vec3.set(vPos, posX.get(),posY.get(),posZ.get());
    translationChanged=false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale=true;
    vec3.set(vScale, scale.get(),scale.get(),scale.get());
    scaleChanged=false;
}

function setTranslateChanged()
{
    translationChanged=true;
}

function setScaleChanged()
{
    scaleChanged=true;
}

function setRotChanged()
{
    rotChanged=true;
}

doUpdateMatrix();




};

Ops.Gl.Matrix.Transform.prototype = new CABLES.Op();
CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Gl.Matrix.Transform,objName:"Ops.Gl.Matrix.Transform"};




// **************************************************************
// 
// Ops.Anim.LFO
// 
// **************************************************************

Ops.Anim.LFO = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const time=op.inValue("Time");
const type=op.inValueSelect("Type",["sine","triangle","ramp up","ramp down","block"],"sine");
const phase=op.inValue("Phase",0);
const amplitude=op.inValue("Amplitude",1);
const result=op.outValue("Result");


let v=0;
type.onChange=updateType;

updateType();

const PI2=Math.PI/2;


function updateType()
{
    if(type.get()=='sine') time.onChange=sine;
    if(type.get()=='ramp up') time.onChange=rampUp;
    if(type.get()=='ramp down') time.onChange=rampDown;
    if(type.get()=='block') time.onChange=block;
    if(type.get()=='triangle') time.onChange=triangle;
}

function updateTime()
{
    return time.get()+phase.get();
}

function block()
{
    var t=updateTime()+0.5;
    v=t%2.0;
    if(v<=1.0)v=-1;
    else v=1;
    v*=amplitude.get();
    result.set(v);
}

function rampUp()
{
    var t=(updateTime()+1);
    t*=0.5;
    v=t%1.0;
    v-=0.5;
    v*=2.0;
    v*=amplitude.get();
    result.set(v);
}

function rampDown()
{
    var t=updateTime();
    v=t%1.0;
    v-=0.5;
    v*=-2.0;
    v*=amplitude.get();
    result.set(v);
}

function triangle()
{
    var t=updateTime();
    v=t%2.0;
    if(v>1) v= 2.0-v ;
    v-=0.5;
    v*=2.0;
    v*=amplitude.get();
    result.set(v);
}


function sine()
{
    var t=updateTime()*Math.PI-(PI2);
    v=Math.sin( (t) );
    v*=amplitude.get();
    result.set(v);
}

};

Ops.Anim.LFO.prototype = new CABLES.Op();
CABLES.OPS["559bb980-78fb-47a7-a199-16f10808b150"]={f:Ops.Anim.LFO,objName:"Ops.Anim.LFO"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v2
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={basicmaterial_frag:"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\nUNI vec4 color;\n// UNI float r;\n// UNI float g;\n// UNI float b;\n// UNI float a;\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=color;\n\n    #ifdef HAS_TEXTURES\n        vec2 uv=vec2(texCoord.s,1.0-texCoord.t);\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=color.r;\n                col.g*=color.g;\n                col.b*=color.b;\n            #endif\n        #endif\n        col.a*=color.a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                uv=vec2(texCoordOrig.s,1.0-texCoordOrig.t);\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    outColor = col;\n}\n",basicmaterial_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\nIN float attrVertIndex;\n\n{{MODULES_HEAD}}\n\nOUT vec3 norm;\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 mvMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=texCoord.y*diffuseRepeatY+texOffsetY;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       mvMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * mvMatrix * vec4((\n           position.x * vec3(\n               mvMatrix[0][0],\n               mvMatrix[1][0],\n               mvMatrix[2][0] ) +\n           position.y * vec3(\n               mvMatrix[0][1],\n               mvMatrix[1][1],\n               mvMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        mvMatrix=viewMatrix * mMatrix;\n    #endif\n\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * mvMatrix * pos;\n    #endif\n}\n",};
const render=op.inTrigger("render");
const trigger=op.outTrigger('trigger');
const shaderOut=op.outObject("shader");
shaderOut.ignoreValueSerialize=true;

const cgl=op.patch.cgl;

op.toWorkPortsNeedToBeLinked(render);

const shader=new CGL.Shader(cgl,"basicmaterialnew");
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);
// shader.bindTextures=bindTextures;
shader.setSource(attachments.basicmaterial_vert,attachments.basicmaterial_frag);
shaderOut.set(shader);

render.onTriggered=doRender;

// function bindTextures()
// {
//     // if(diffuseTexture.get()) cgl.setTexture(0, diffuseTexture.get().tex);
//     // if(textureOpacity.get()) cgl.setTexture(1, textureOpacity.get().tex);
// }

op.preRender=function()
{
    shader.bind();
    doRender();
};

function doRender()
{
    if(!shader)return;

    cgl.setShader(shader);
    // shader.bindTextures();
    shader.popTextures();

    if(diffuseTextureUniform && diffuseTexture.get())
        shader.pushTexture(diffuseTextureUniform,diffuseTexture.get().tex);
    if(textureOpacityUniform && textureOpacity.get())
        shader.pushTexture(textureOpacityUniform,textureOpacity.get().tex);
    trigger.trigger();


    cgl.setPreviousShader();
}

// rgba colors
const r=op.inValueSlider("r",Math.random());
const g=op.inValueSlider("g",Math.random());
const b=op.inValueSlider("b",Math.random());
const a=op.inValueSlider("a",1);
r.setUiAttribs({"colorPick":true});

const uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a);

op.setPortGroup("Color",[r,g,b,a]);

    // diffuse outTexture

    var diffuseTexture=op.inTexture("texture");
    var diffuseTextureUniform=null;
    // shader.bindTextures=bindTextures;

    diffuseTexture.onChange=updateDiffuseTexture;

    function updateDiffuseTexture()
    {
        if(diffuseTexture.get())
        {
            if(!shader.hasDefine('HAS_TEXTURE_DIFFUSE'))shader.define('HAS_TEXTURE_DIFFUSE');
            if(!diffuseTextureUniform)diffuseTextureUniform=new CGL.Uniform(shader,'t','texDiffuse',0);

            diffuseRepeatX.setUiAttribs({greyout:false});
            diffuseRepeatY.setUiAttribs({greyout:false});
            diffuseOffsetX.setUiAttribs({greyout:false});
            diffuseOffsetY.setUiAttribs({greyout:false});
            colorizeTexture.setUiAttribs({greyout:false});
        }
        else
        {
            shader.removeUniform('texDiffuse');
            shader.removeDefine('HAS_TEXTURE_DIFFUSE');
            diffuseTextureUniform=null;

            diffuseRepeatX.setUiAttribs({greyout:true});
            diffuseRepeatY.setUiAttribs({greyout:true});
            diffuseOffsetX.setUiAttribs({greyout:true});
            diffuseOffsetY.setUiAttribs({greyout:true});
            colorizeTexture.setUiAttribs({greyout:true});
        }
    }

const colorizeTexture=op.inValueBool("colorizeTexture",false);

op.setPortGroup("Color Texture",[diffuseTexture,colorizeTexture]);

// opacity texture
var textureOpacity=op.inTexture("textureOpacity");
var textureOpacityUniform=null;

op.alphaMaskSource=op.inSwitch("Alpha Mask Source",["Luminance","R","G","B","A"],"Luminance");
op.alphaMaskSource.onChange=updateAlphaMaskMethod;
op.alphaMaskSource.setUiAttribs({greyout:true});

function updateAlphaMaskMethod()
{
    if(op.alphaMaskSource.get()=='Alpha Channel') shader.define('ALPHA_MASK_ALPHA');
        else shader.removeDefine('ALPHA_MASK_ALPHA');

    if(op.alphaMaskSource.get()=='Luminance') shader.define('ALPHA_MASK_LUMI');
        else shader.removeDefine('ALPHA_MASK_LUMI');

    if(op.alphaMaskSource.get()=='R') shader.define('ALPHA_MASK_R');
        else shader.removeDefine('ALPHA_MASK_R');

    if(op.alphaMaskSource.get()=='G') shader.define("ALPHA_MASK_G");
        else shader.removeDefine('ALPHA_MASK_G');

    if(op.alphaMaskSource.get()=='B') shader.define('ALPHA_MASK_B');
        else shader.removeDefine('ALPHA_MASK_B');
}

textureOpacity.onChange=updateOpacity;
function updateOpacity()
{

    if(textureOpacity.get())
    {
        if(textureOpacityUniform!==null)return;
        shader.removeUniform('texOpacity');
        shader.define('HAS_TEXTURE_OPACITY');
        if(!textureOpacityUniform)textureOpacityUniform=new CGL.Uniform(shader,'t','texOpacity',1);

        op.alphaMaskSource.setUiAttribs({greyout:false});
        discardTransPxl.setUiAttribs({greyout:false});
        texCoordAlpha.setUiAttribs({greyout:false});

    }
    else
    {
        shader.removeUniform('texOpacity');
        shader.removeDefine('HAS_TEXTURE_OPACITY');
        textureOpacityUniform=null;

        op.alphaMaskSource.setUiAttribs({greyout:true});
        discardTransPxl.setUiAttribs({greyout:true});
        texCoordAlpha.setUiAttribs({greyout:true});
    }
    updateAlphaMaskMethod();
};


var texCoordAlpha=op.inValueBool("Opacity TexCoords Transform",false);
const discardTransPxl=op.inValueBool("Discard Transparent Pixels");

discardTransPxl.onChange=function()
{
    if(discardTransPxl.get()) shader.define('DISCARDTRANS');
        else shader.removeDefine('DISCARDTRANS');
};


texCoordAlpha.onChange=function()
{
    if(texCoordAlpha.get()) shader.define('TRANSFORMALPHATEXCOORDS');
        else shader.removeDefine('TRANSFORMALPHATEXCOORDS');
};

op.setPortGroup("Opacity",[textureOpacity,op.alphaMaskSource,discardTransPxl,texCoordAlpha]);


colorizeTexture.onChange=function()
{
    if(colorizeTexture.get()) shader.define('COLORIZE_TEXTURE');
        else shader.removeDefine('COLORIZE_TEXTURE');
};




// texture coords

const diffuseRepeatX=op.inValue("diffuseRepeatX",1);
const diffuseRepeatY=op.inValue("diffuseRepeatY",1);
const diffuseOffsetX=op.inValue("Tex Offset X",0);
const diffuseOffsetY=op.inValue("Tex Offset Y",0);

const diffuseRepeatXUniform=new CGL.Uniform(shader,'f','diffuseRepeatX',diffuseRepeatX);
const diffuseRepeatYUniform=new CGL.Uniform(shader,'f','diffuseRepeatY',diffuseRepeatY);
const diffuseOffsetXUniform=new CGL.Uniform(shader,'f','texOffsetX',diffuseOffsetX);
const diffuseOffsetYUniform=new CGL.Uniform(shader,'f','texOffsetY',diffuseOffsetY);

op.setPortGroup("Texture Transform",[diffuseRepeatX,diffuseRepeatY,diffuseOffsetX,diffuseOffsetY]);



const doBillboard=op.inValueBool("billboard",false);

doBillboard.onChange=function()
{
    if(doBillboard.get()) shader.define('BILLBOARD');
        else shader.removeDefine('BILLBOARD');
};

updateOpacity();
updateDiffuseTexture();

};

Ops.Gl.Shader.BasicMaterial_v2.prototype = new CABLES.Op();
CABLES.OPS["51f2207b-daaa-447f-bdbe-87fdd72f0c40"]={f:Ops.Gl.Shader.BasicMaterial_v2,objName:"Ops.Gl.Shader.BasicMaterial_v2"};




// **************************************************************
// 
// Ops.Gl.Meshes.FullscreenRectangle
// 
// **************************************************************

Ops.Gl.Meshes.FullscreenRectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={shader_frag:"UNI sampler2D tex;\nIN vec2 texCoord;\n\nvoid main()\n{\n   outColor= texture(tex,vec2(texCoord.x,(1.0-texCoord.y)));\n}\n",shader_vert:"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\nIN vec2 attrTexCoord;\n\nvoid main()\n{\n   vec4 pos=vec4(vPosition,  1.0);\n\n   texCoord=attrTexCoord;\n\n   gl_Position = projMatrix * mvMatrix * pos;\n}\n",};
const
    render=op.inTrigger('render'),
    centerInCanvas=op.inValueBool("Center in Canvas"),
    flipY=op.inValueBool("Flip Y"),
    flipX=op.inValueBool("Flip X"),
    inTexture=op.inTexture("Texture"),
    trigger=op.outTrigger('trigger');

const cgl=op.patch.cgl;
var mesh=null;
var geom=new CGL.Geometry("fullscreen rectangle");
var x=0,y=0,z=0,w=0,h=0;

centerInCanvas.onChange=rebuild;
    flipX.onChange=rebuildFlip;
    flipY.onChange=rebuildFlip;

const shader=new CGL.Shader(cgl,'fullscreenrectangle');
shader.setModules(['MODULE_VERTEX_POSITION','MODULE_COLOR','MODULE_BEGIN_FRAG']);

shader.setSource(attachments.shader_vert,attachments.shader_frag);
shader.fullscreenRectUniform=new CGL.Uniform(shader,'t','tex',0);

var useShader=false;
var updateShaderLater=true;
render.onTriggered=doRender;

op.toWorkPortsNeedToBeLinked(render);

inTexture.onChange=function()
{
    updateShaderLater=true;
};

function updateShader()
{
    var tex=inTexture.get();
    if(tex) useShader=true;
        else useShader=false;
}

op.preRender=function()
{
    updateShader();
    // if(useShader)
    {
        shader.bind();
        if(mesh)mesh.render(shader);
        doRender();
    }
};

function doRender()
{
    if( cgl.getViewPort()[2]!=w || cgl.getViewPort()[3]!=h ||!mesh ) rebuild();

    if(updateShaderLater) updateShader();

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w,h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    if(centerInCanvas.get())
    {
        var x=0;
        var y=0;
        if(w<cgl.canvasWidth) x=(cgl.canvasWidth-w)/2;
        if(h<cgl.canvasHeight) y=(cgl.canvasHeight-h)/2;

        cgl.setViewPort(x,y,w,h);
    }

    if(useShader)
    {
        if(inTexture.get())
        {
            cgl.setTexture(0,inTexture.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, inTexture.get().tex);
        }

        mesh.render(shader);
    }
    else
    {
        mesh.render(cgl.getShader());
    }

    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    trigger.trigger();
}

function rebuildFlip()
{
    mesh=null;
}


function rebuild()
{
    const currentViewPort=cgl.getViewPort();

    if(currentViewPort[2]==w && currentViewPort[3]==h && mesh)return;

    var xx=0,xy=0;

    w=currentViewPort[2];
    h=currentViewPort[3];

    geom.vertices = new Float32Array([
         xx+w, xy+h,  0.0,
         xx,   xy+h,  0.0,
         xx+w, xy,    0.0,
         xx,   xy,    0.0
    ]);

    var tc=null;

    if(flipY.get())
        tc=new Float32Array([
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
    else
        tc=new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

    if(flipX.get())
    {
        tc[0]=0.0;
        tc[2]=1.0;
        tc[4]=0.0;
        tc[6]=1.0;
    }

    geom.setTexCoords(tc);

    geom.verticesIndices = new Float32Array([
        2, 1, 0,
        3, 1, 2
    ]);


    geom.vertexNormals=new Float32Array([
        0,0,1,
        0,0,1,
        0,0,1,
        0,0,1,
        ]);
    geom.tangents=new Float32Array([
        -1,0,0,
        -1,0,0,
        -1,0,0,
        -1,0,0]);
    geom.biTangents==new Float32Array([
        0,-1,0,
        0,-1,0,
        0,-1,0,
        0,-1,0]);

                // norms.push(0,0,1);
                // tangents.push(-1,0,0);
                // biTangents.push(0,-1,0);


    if(!mesh) mesh=new CGL.Mesh(cgl,geom);
        else mesh.setGeom(geom);
}


};

Ops.Gl.Meshes.FullscreenRectangle.prototype = new CABLES.Op();
CABLES.OPS["255bd15b-cc91-4a12-9b4e-53c710cbb282"]={f:Ops.Gl.Meshes.FullscreenRectangle,objName:"Ops.Gl.Meshes.FullscreenRectangle"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const render=op.inTrigger("render");
// const useVPSize=op.addInPort(new CABLES.Port(op,"use viewport size",CABLES.OP_PORT_TYPE_VALUE,{ display:'bool' }));
const useVPSize=op.inBool("use viewport size");
const width=op.inValueInt("width");
const height=op.inValueInt("height");

const tfilter=op.inSwitch("filter",['nearest','linear','mipmap'],"linear");
const twrap=op.inValueSelect("wrap",['clamp to edge','repeat','mirrored repeat']);
const fpTexture=op.inValueBool("HDR");

const trigger=op.outTrigger("trigger");
const texOut=op.outTexture("texture_out");

const bgAlpha=op.inValueSlider("Background Alpha",1);
const outRatio=op.outValue("Aspect Ratio");

op.setPortGroup("Texture Size",[useVPSize,width,height]);
op.setPortGroup("Texture Settings",[twrap,tfilter,fpTexture]);



const cgl=op.patch.cgl;
texOut.set(CGL.Texture.getEmptyTexture(cgl));
var effect=null;
var tex=null;

var w=8,h=8;
var prevViewPort=[0,0,0,0];
var reInitEffect=true;

var bgFrag=''
    .endl()+'uniform float a;'
    .endl()+'void main()'
    .endl()+'{'
    .endl()+'   outColor= vec4(0.0,0.0,0.0,a);'
    .endl()+'}';
var bgShader=new CGL.Shader(cgl,'imgcompose bg');
bgShader.setSource(bgShader.getDefaultVertexShader(),bgFrag);
var uniBgAlpha=new CGL.Uniform(bgShader,'f','a',bgAlpha);

var selectedFilter=CGL.Texture.FILTER_LINEAR;
var selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

function initEffect()
{
    if(effect)effect.delete();
    if(tex)tex.delete();

    effect=new CGL.TextureEffect(cgl,{"isFloatingPointTexture":fpTexture.get()});

    tex=new CGL.Texture(cgl,
        {
            "name":"image compose",
            "isFloatingPointTexture":fpTexture.get(),
            "filter":selectedFilter,
            "wrap":selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(CGL.Texture.getEmptyTexture(cgl));
    // texOut.set(effect.getCurrentSourceTexture());

    // texOut.set(effect.getCurrentSourceTexture());

    reInitEffect=false;

    // op.log("reinit effect");
    // tex.printInfo();
}

fpTexture.onChange=function()
{
    reInitEffect=true;

    // var e1=cgl.gl.getExtension('EXT_color_buffer_float');
    // var e2=cgl.gl.getExtension('EXT_float_blend');

};

function updateResolution()
{
    if(!effect)initEffect();

    if(useVPSize.get())
    {
        w=cgl.getViewPort()[2];
        h=cgl.getViewPort()[3];
    }
    else
    {
        w=Math.ceil(width.get());
        h=Math.ceil(height.get());
    }

    if((w!=tex.width || h!= tex.height) && (w!==0 && h!==0))
    {
        height.set(h);
        width.set(w);
        tex.setSize(w,h);
        outRatio.set(w/h);
        effect.setSourceTexture(tex);
        // texOut.set(null);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
    }

    if(texOut.get())
        if(!texOut.get().isPowerOfTwo() )
        {
            if(!op.uiAttribs.hint)
                op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
        }
        else
        if(op.uiAttribs.hint)
        {
            op.uiAttr({hint:null,warning:null}); //todo only when needed...
        }

}


function updateSizePorts()
{
    if(useVPSize.get())
    {
        width.setUiAttribs({greyout:true});
        height.setUiAttribs({greyout:true});
    }
    else
    {
        width.setUiAttribs({greyout:false});
        height.setUiAttribs({greyout:false});
    }
}


useVPSize.onChange=function()
{
    updateSizePorts();
    if(useVPSize.get())
    {
        width.onChange=null;
        height.onChange=null;
    }
    else
    {
        width.onChange=updateResolution;
        height.onChange=updateResolution;
    }
    updateResolution();

};


op.preRender=function()
{
    doRender();
    bgShader.bind();
};


var doRender=function()
{
    if(!effect || reInitEffect)
    {
        initEffect();
    }
    var vp=cgl.getViewPort();
    prevViewPort[0]=vp[0];
    prevViewPort[1]=vp[1];
    prevViewPort[2]=vp[2];
    prevViewPort[3]=vp[3];

    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA);

    updateResolution();

    cgl.currentTextureEffect=effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    // render background color...
    cgl.setShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
    cgl.currentTextureEffect.finish();
    cgl.setPreviousShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());
    // texOut.set(effect.getCurrentTargetTexture());


    // if(effect.getCurrentSourceTexture.filter==CGL.Texture.FILTER_MIPMAP)
    // {
    //         this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, effect.getCurrentSourceTexture.tex);
    //         effect.getCurrentSourceTexture.updateMipMap();
    //     // else
    //     // {
    //     //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._textureSource.tex);;
    //     //     this._textureSource.updateMipMap();
    //     // }

    //     this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
    // }

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0],prevViewPort[1],prevViewPort[2],prevViewPort[3]);


    cgl.gl.blendFunc(cgl.gl.SRC_ALPHA,cgl.gl.ONE_MINUS_SRC_ALPHA);

    cgl.currentTextureEffect=null;
};


function onWrapChange()
{
    if(twrap.get()=='repeat') selectedWrap=CGL.Texture.WRAP_REPEAT;
    if(twrap.get()=='mirrored repeat') selectedWrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(twrap.get()=='clamp to edge') selectedWrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect=true;
    updateResolution();
}

twrap.set('repeat');
twrap.onChange=onWrapChange;


function onFilterChange()
{
    if(tfilter.get()=='nearest') selectedFilter=CGL.Texture.FILTER_NEAREST;
    if(tfilter.get()=='linear')  selectedFilter=CGL.Texture.FILTER_LINEAR;
    if(tfilter.get()=='mipmap')  selectedFilter=CGL.Texture.FILTER_MIPMAP;

    reInitEffect=true;
    updateResolution();
    // effect.setSourceTexture(tex);
    // updateResolution();
}

tfilter.set('linear');
tfilter.onChange=onFilterChange;

useVPSize.set(true);
render.onTriggered=doRender;
op.preRender=doRender;


width.set(640);
height.set(360);
onFilterChange();
onWrapChange();
updateSizePorts();

};

Ops.Gl.TextureEffects.ImageCompose.prototype = new CABLES.Op();
CABLES.OPS["5c04608d-1e42-4e36-be00-1be4a81fc309"]={f:Ops.Gl.TextureEffects.ImageCompose,objName:"Ops.Gl.TextureEffects.ImageCompose"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImage_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImage_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={drawimage_frag:"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\nIN mat3 transform;\nUNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            #ifdef ASPECT_AXIS_X\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n            #endif\n            #ifdef ASPECT_AXIS_Y\n                tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)/aspectTex);\n            #endif\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n        vec3 colNew=_blend(base,blend);\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,tc);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef ALPHA_FROM_INV_UMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=1.0-(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n    #endif\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)colNew.rgb=vec3(0.0);\n    #endif\n\n    #ifdef ASPECT_RATIO\n        #ifdef ASPECT_CROP\n            if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0) colNew.rgb=base.rgb;//vec3(0.0);\n        #endif\n    #endif\n\n    blendRGBA.rgb=mix( colNew, base ,1.0-blendRGBA.a*amount);\n    blendRGBA.a=1.0;\n\n    outColor= blendRGBA;\n\n}",drawimage_vert:"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nUNI float posX;\nUNI float posY;\nUNI float scaleX;\nUNI float scaleY;\nUNI float rotate;\n\nOUT vec2 texCoord;\nOUT vec3 norm;\nOUT mat3 transform;\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
var render=op.inTrigger('render');
var blendMode=CGL.TextureEffect.AddBlendSelect(op,"blendMode");
var amount=op.inValueSlider("amount",1);

var image=op.inTexture("image");
var removeAlphaSrc=op.inValueBool("removeAlphaSrc",false);

var imageAlpha=op.inTexture("imageAlpha");
var alphaSrc=op.inValueSelect("alphaSrc",['alpha channel','luminance','luminance inv']);
var invAlphaChannel=op.inValueBool("invert alpha channel");

const inAspect=op.inValueBool("Aspect Ratio",false);
const inAspectAxis=op.inValueSelect("Stretch Axis",['X','Y'],"X");
const inAspectPos=op.inValueSlider("Position",0.0);
const inAspectCrop=op.inValueBool("Crop",false);


var trigger=op.outTrigger('trigger');

blendMode.set('normal');
var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl,'drawimage');


imageAlpha.onLinkChanged=updateAlphaPorts;

op.setPortGroup("Mask",[imageAlpha,alphaSrc,invAlphaChannel]);
op.setPortGroup("Aspect Ratio",[inAspect,inAspectPos,inAspectCrop,inAspectAxis]);


removeAlphaSrc.onChange=updateRemoveAlphaSrc;

function updateAlphaPorts()
{
    if(imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({greyout:true});
        alphaSrc.setUiAttribs({greyout:false});
        invAlphaChannel.setUiAttribs({greyout:false});
    }
    else
    {
        removeAlphaSrc.setUiAttribs({greyout:false});
        alphaSrc.setUiAttribs({greyout:true});
        invAlphaChannel.setUiAttribs({greyout:true});
    }
}

op.toWorkPortsNeedToBeLinked(image);

shader.setSource(attachments.drawimage_vert,attachments.drawimage_frag);
var textureUniform=new CGL.Uniform(shader,'t','tex',0);
var textureImaghe=new CGL.Uniform(shader,'t','image',1);
var textureAlpha=new CGL.Uniform(shader,'t','imageAlpha',2);

const uniTexAspect=new CGL.Uniform(shader,'f','aspectTex',1);
const uniAspectPos=new CGL.Uniform(shader,'f','aspectPos',inAspectPos);

invAlphaChannel.onChange=function()
{
    if(invAlphaChannel.get()) shader.define('INVERT_ALPHA');
        else shader.removeDefine('INVERT_ALPHA');
};


inAspect.onChange=updateAspectRatio;
inAspectCrop.onChange=updateAspectRatio;
inAspectAxis.onChange=updateAspectRatio;
function updateAspectRatio()
{
    shader.removeDefine('ASPECT_AXIS_X');
    shader.removeDefine('ASPECT_AXIS_Y');

    if(inAspect.get())
    {
        shader.define('ASPECT_RATIO');

        if(inAspectCrop.get()) shader.define('ASPECT_CROP');
            else shader.removeDefine('ASPECT_CROP');

        if(inAspectAxis.get()=="X") shader.define('ASPECT_AXIS_X');
        if(inAspectAxis.get()=="Y") shader.define('ASPECT_AXIS_Y');


        inAspectPos.setUiAttribs({greyout:false});
        inAspectCrop.setUiAttribs({greyout:false});
        inAspectAxis.setUiAttribs({greyout:false});
    }
    else
    {
        shader.removeDefine('ASPECT_RATIO');
        if(inAspectCrop.get()) shader.define('ASPECT_CROP');
            else shader.removeDefine('ASPECT_CROP');

        if(inAspectAxis.get()=="X") shader.define('ASPECT_AXIS_X');
        if(inAspectAxis.get()=="Y") shader.define('ASPECT_AXIS_Y');

        inAspectPos.setUiAttribs({greyout:true});
        inAspectCrop.setUiAttribs({greyout:true});
        inAspectAxis.setUiAttribs({greyout:true});
    }
}




function updateRemoveAlphaSrc()
{
    if(removeAlphaSrc.get()) shader.define('REMOVE_ALPHA_SRC');
        else shader.removeDefine('REMOVE_ALPHA_SRC');
}


alphaSrc.onChange=function()
{
    shader.toggleDefine('ALPHA_FROM_LUMINANCE',alphaSrc.get()=='luminance');
    shader.toggleDefine('ALPHA_FROM_INV_UMINANCE',alphaSrc.get()=='luminance_inv');
};

alphaSrc.set("alpha channel");


{
    //
    // texture flip
    //
    var flipX=op.inValueBool("flip x");
    var flipY=op.inValueBool("flip y");

    flipX.onChange=function()
    {
        if(flipX.get()) shader.define('TEX_FLIP_X');
            else shader.removeDefine('TEX_FLIP_X');
    };

    flipY.onChange=function()
    {
        if(flipY.get()) shader.define('TEX_FLIP_Y');
            else shader.removeDefine('TEX_FLIP_Y');
    };
}

{
    //
    // texture transform
    //

    var doTransform=op.inValueBool("Transform");

    var scaleX=op.inValueSlider("Scale X",1);
    var scaleY=op.inValueSlider("Scale Y",1);

    var posX=op.inValue("Position X",0);
    var posY=op.inValue("Position Y",0);

    var rotate=op.inValue("Rotation",0);

    var inClipRepeat=op.inValueBool("Clip Repeat",false);

    inClipRepeat.onChange=updateClip;
    function updateClip()
    {
        if(inClipRepeat.get()) shader.define('CLIP_REPEAT');
            else shader.removeDefine('CLIP_REPEAT');
    }


    var uniScaleX=new CGL.Uniform(shader,'f','scaleX',scaleX);
    var uniScaleY=new CGL.Uniform(shader,'f','scaleY',scaleY);

    var uniPosX=new CGL.Uniform(shader,'f','posX',posX);
    var uniPosY=new CGL.Uniform(shader,'f','posY',posY);
    var uniRotate=new CGL.Uniform(shader,'f','rotate',rotate);

    doTransform.onChange=updateTransformPorts;
}

function updateTransformPorts()
{
    shader.toggleDefine('TEX_TRANSFORM',doTransform.get());
    if(doTransform.get())
    {
        // scaleX.setUiAttribs({hidePort:false});
        // scaleY.setUiAttribs({hidePort:false});
        // posX.setUiAttribs({hidePort:false});
        // posY.setUiAttribs({hidePort:false});
        // rotate.setUiAttribs({hidePort:false});

        scaleX.setUiAttribs({greyout:false});
        scaleY.setUiAttribs({greyout:false});
        posX.setUiAttribs({greyout:false});
        posY.setUiAttribs({greyout:false});
        rotate.setUiAttribs({greyout:false});
    }
    else
    {
        scaleX.setUiAttribs({greyout:true});
        scaleY.setUiAttribs({greyout:true});
        posX.setUiAttribs({greyout:true});
        posY.setUiAttribs({greyout:true});
        rotate.setUiAttribs({greyout:true});

        // scaleX.setUiAttribs({"hidePort":true});
        // scaleY.setUiAttribs({"hidePort":true});
        // posX.setUiAttribs({"hidePort":true});
        // posY.setUiAttribs({"hidePort":true});
        // rotate.setUiAttribs({"hidePort":true});


    }

    // op.refreshParams();
}

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

var amountUniform=new CGL.Uniform(shader,'f','amount',amount);

imageAlpha.onChange=function()
{
    if(imageAlpha.get() && imageAlpha.get().tex)
    {
        shader.define('HAS_TEXTUREALPHA');
    }
    else
    {
        shader.removeDefine('HAS_TEXTUREALPHA');
    }
};

function doRender()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var tex=image.get();
    if(tex && tex.tex && amount.get()>0.0)
    {
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex=cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0,imgTex.tex );

        uniTexAspect.setValue( 1/(tex.height/tex.width*imgTex.width/imgTex.height));



        cgl.setTexture(1, tex.tex );
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if(imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex );
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();
    }

    trigger.trigger();
}

render.onTriggered=doRender;
updateTransformPorts();
updateRemoveAlphaSrc();
updateAlphaPorts();
updateAspectRatio();


};

Ops.Gl.TextureEffects.DrawImage_v2.prototype = new CABLES.Op();
CABLES.OPS["f94b5136-61fd-4558-8348-e7c8db5a6348"]={f:Ops.Gl.TextureEffects.DrawImage_v2,objName:"Ops.Gl.TextureEffects.DrawImage_v2"};




// **************************************************************
// 
// Ops.Gl.Meshes.RandomPointSphere
// 
// **************************************************************

Ops.Gl.Meshes.RandomPointSphere = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe=op.inTrigger("Render"),
    num=op.inValueInt("Num",1000),
    size=op.inValue("Size",1),
    seed=op.inValue("Seed",0),
    distRand=op.inValueSlider("Distance Random",0),
    distrib=op.inValueSelect('Distribution',["Uniform","Poles","Half"]),
    inDoRender=op.inBool("Draw",true),
    outTrigger = op.outTrigger("Trigger out");

var outGeom=op.outObject("Geometry");
const outArr=op.outArray("Points");

var cgl=op.patch.cgl;
var mesh=null;

seed.onChange=reset;
num.onChange=reset;
size.onChange=reset;
distrib.onChange=reset;
distRand.onChange=reset;

exe.onTriggered=doRender;

reset();

function doRender()
{
    outTrigger.trigger();
    if(inDoRender.get() && mesh) mesh.render(cgl.getShader());
}

function reset()
{
    var geom=new CGL.Geometry();
    var verts=[];
    var texCoords=[];
    var vertColors=[];

    var n=Math.max(0,Math.round(num.get()));


    verts.length=n*3;
    texCoords.length=n*2;
    vertColors.length=n*3;

    Math.randomSeed=seed.get();

    var sizeMul=size.get();
    var rndq = quat.create();
    var tempv = vec3.create();

    var dist=0;
    if(distrib.get()=="Poles")dist=1;
    if(distrib.get()=="Half")dist=2;

    var dRand=distRand.get();

    for(var i=0;i<num.get();i++)
    {
        if(dist==1 || dist==2)
        {
            rndq[0]=Math.seededRandom();
            rndq[1]=Math.seededRandom();
            rndq[2]=Math.seededRandom();
            rndq[3]=Math.seededRandom();
        }
        else
        {
            rndq[0]=Math.seededRandom()*2.0-1.0;
            rndq[1]=Math.seededRandom()*2.0-1.0;
            rndq[2]=Math.seededRandom()*2.0-1.0;
            rndq[3]=Math.seededRandom()*2.0-1.0;
        }

        quat.normalize(rndq,rndq);

        if(dist==2)
        {
            tempv[0]=size.get();
        }
        else
        {
            if(i%2===0) tempv[0]=-size.get();
                else tempv[0]=size.get();
        }

        tempv[1]=0;
        tempv[2]=0;

        if(dRand!==0) tempv[0]-=Math.random()*dRand;

        vec3.transformQuat(tempv, tempv, rndq) ;
        verts[i*3]=tempv[0];
        verts[i*3+1]=tempv[1];
        verts[i*3+2]=tempv[2];

        texCoords[i*2]=Math.seededRandom();
        texCoords[i*2+1]=Math.seededRandom();
    }
    geom.vertices=verts;
    geom.vertColors=vertColors;
    geom.texCoords=texCoords;
    outGeom.set(null);
    outGeom.set(geom);
    outArr.set(null);
    outArr.set(verts);

    // if(mesh) mesh.addVertexNumbers=true;
    // if(mesh) mesh.setGeom(geom);
    if(mesh)mesh.dispose();
    mesh =new CGL.Mesh(cgl,geom,cgl.gl.POINTS);
    mesh.addVertexNumbers=true;
    // mesh.setGeom(geom);
}



};

Ops.Gl.Meshes.RandomPointSphere.prototype = new CABLES.Op();
CABLES.OPS["d8ac214e-0eff-4b31-a8e4-6af4f3cdf839"]={f:Ops.Gl.Meshes.RandomPointSphere,objName:"Ops.Gl.Meshes.RandomPointSphere"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ChromaticAberration
// 
// **************************************************************

Ops.Gl.TextureEffects.ChromaticAberration = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={chromatic_frag:"\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float pixel;\nUNI float onePixel;\nUNI float amount;\nUNI float lensDistort;\n\n#ifdef MASK\nUNI sampler2D texMask;\n#endif\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n   vec4 base=texture(tex,texCoord);\n   vec4 col=texture(tex,texCoord);\n\n   vec2 tc=texCoord;;\n   float pix = pixel;\n   if(lensDistort>0.0)\n   {\n       float dist = distance(texCoord, vec2(0.5,0.5));\n       tc-=0.5;\n       tc *=smoothstep(-0.9,1.0*lensDistort,1.0-dist);\n       tc+=0.5;\n   }\n\n    #ifdef MASK\n        vec4 m=texture(texMask,texCoord);\n        pix*=m.r*m.a;\n    #endif\n\n    #ifdef SMOOTH\n    #ifdef WEBGL2\n        float numSamples=round(pix/onePixel/4.0+1.0);\n        col.r=0.0;\n        col.b=0.0;\n\n        for(float off=0.0;off<numSamples;off++)\n        {\n            float diff=(pix/numSamples)*off;\n            col.r+=texture(tex,vec2(tc.x+diff,tc.y)).r/numSamples;\n            col.b+=texture(tex,vec2(tc.x-diff,tc.y)).b/numSamples;\n        }\n    #endif\n    #endif\n\n    #ifndef SMOOTH\n        col.r=texture(tex,vec2(tc.x+pix,tc.y)).r;\n        col.b=texture(tex,vec2(tc.x-pix,tc.y)).b;\n    #endif\n\n//   outColor = col;\n   outColor= cgl_blend(base,col,amount);\n\n}\n",};
const
    render=op.inTrigger('render'),
    blendMode=CGL.TextureEffect.AddBlendSelect(op,"Blend Mode","normal"),
    amount=op.inValueSlider("Amount",1),
    pixel=op.inValue("Pixel",5),
    lensDistort=op.inValueSlider("Lens Distort",0),
    doSmooth=op.inValueBool("Smooth",false),
    textureMask=op.inTexture("Mask"),
    trigger=op.outTrigger('trigger');

const cgl=op.patch.cgl;
const shader=new CGL.Shader(cgl,"chromatic");

CGL.TextureEffect.setupBlending(op,shader,blendMode,amount);

shader.setSource(shader.getDefaultVertexShader(),attachments.chromatic_frag);
const textureUniform=new CGL.Uniform(shader,'t','tex',0),
    uniPixel=new CGL.Uniform(shader,'f','pixel',0),
    uniOnePixel=new CGL.Uniform(shader,'f','onePixel',0),
    unitexMask=new CGL.Uniform(shader,'t','texMask',1),
    uniAmount=new CGL.Uniform(shader,'f','amount',amount),
    unilensDistort=new CGL.Uniform(shader,'f','lensDistort',lensDistort);

doSmooth.onChange=function()
{
    if(doSmooth.get())shader.define("SMOOTH");
    else shader.removeDefine("SMOOTH");
};

textureMask.onChange=function()
{
    if(textureMask.get())shader.define("MASK");
    else shader.removeDefine("MASK");
};

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    var texture=cgl.currentTextureEffect.getCurrentSourceTexture();

    uniPixel.setValue(pixel.get()*(1/texture.width));
    uniOnePixel.setValue(1/texture.width);

    cgl.setShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, texture.tex );

    if(textureMask.get()) cgl.setTexture(1, textureMask.get().tex );

    cgl.currentTextureEffect.finish();
    cgl.setPreviousShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.ChromaticAberration.prototype = new CABLES.Op();
CABLES.OPS["38ac43a1-1757-48f4-9450-29f07ac0d376"]={f:Ops.Gl.TextureEffects.ChromaticAberration,objName:"Ops.Gl.TextureEffects.ChromaticAberration"};




// **************************************************************
// 
// Ops.Gl.Meshes.Sphere_v2
// 
// **************************************************************

Ops.Gl.Meshes.Sphere_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    TAU = Math.PI * 2,
    cgl = op.patch.cgl,
    inTrigger = op.inTrigger("render"),
    inRadius = op.inValue("radius", 1),
    inStacks = op.inValue("stacks", 32),
    inSlices = op.inValue("slices", 32),
    inStacklimit = op.inValueSlider("Filloffset", 1),
    inDraw = op.inValueBool("Render", true),
    outTrigger = op.outTrigger("trigger"),
    outGeometry = op.outObject("geometry"),
    UP = vec3.fromValues(0,1,0),
    RIGHT = vec3.fromValues(1,0,0)
;

var
    geom = new CGL.Geometry("Sphere"),
    tmpNormal = vec3.create(),
    tmpVec = vec3.create(),
    needsRebuild = true,
    mesh
;

function buildMesh () {
    const
        stacks = Math.max(inStacks.get(),2),
        slices = Math.max(inSlices.get(),3),
        stackLimit = Math.min(Math.max(inStacklimit.get()*stacks,1),stacks),
        radius = inRadius.get()
    ;

    var
        positions = [],
        texcoords = [],
        normals = [],
        tangents = [],
        biTangents = [],
        indices = [],
        x,y,z,d,t,a,
        o,u,v,i,j
    ;

    for (i = o = 0; i < stacks + 1; i++) {
        v = (i/stacks-.5)*Math.PI;
        y = Math.sin(v);
        a = Math.cos(v);
        for (j = 0; j < slices+1; j++) {
            u = (j/slices)*TAU;
            x = Math.cos(u)*a;
            z = Math.sin(u)*a;

            positions.push(x*radius,y*radius,z*radius);
            // texcoords.push(i/(stacks+1),j/slices);
            texcoords.push(j/slices,i/(stacks+1));

            d = Math.sqrt(x*x+y*y+z*z);
            normals.push(
                tmpNormal[0] = x/d,
                tmpNormal[1] = y/d,
                tmpNormal[2] = z/d
            );

            if (y == d) t = RIGHT;
            else t = UP;
            vec3.cross(tmpVec, tmpNormal, t);
            vec3.normalize(tmpVec,tmpVec);
            Array.prototype.push.apply(tangents, tmpVec);
            vec3.cross(tmpVec, tmpVec, tmpNormal);
            Array.prototype.push.apply(biTangents, tmpVec);
        }
        if (i == 0 || i > stackLimit) continue;
        for(j = 0; j < slices; j++,o++) {
            indices.push(
                o,o+1,o+slices+1,
                o+1,o+slices+2,o+slices+1
            );
        }
        o++;
    }

    // set geometry
    geom.clear();
    geom.vertices = positions;
    geom.texCoords = texcoords;
    geom.vertexNormals = normals;
    geom.tangents = tangents;
    geom.biTangents = biTangents;
    geom.verticesIndices = indices;

    outGeometry.set(null);
    outGeometry.set(geom);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);

    needsRebuild = false;
}

// set event handlers
inTrigger.onTriggered = function () {
    if (needsRebuild) buildMesh();
    if (inDraw.get()) mesh.render(cgl.getShader());
    outTrigger.trigger();
};

inStacks.onChange =
inSlices.onChange =
inStacklimit.onChange =
inRadius.onChange = function() {
    // only calculate once, even after multiple settings could were changed
    needsRebuild = true;
};

// set lifecycle handlers
op.onDelete = function () { if(mesh)mesh.dispose(); };


};

Ops.Gl.Meshes.Sphere_v2.prototype = new CABLES.Op();
CABLES.OPS["450b4d68-2278-4d9f-9849-0abdfa37ef69"]={f:Ops.Gl.Meshes.Sphere_v2,objName:"Ops.Gl.Meshes.Sphere_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Fog
// 
// **************************************************************

Ops.Gl.TextureEffects.Fog = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={fog_frag:"\nIN vec2 texCoord;\nUNI sampler2D depthTex;\nUNI sampler2D image;\n\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float a;\nUNI float start;\nUNI float density;\n\nconst float LOG2 = 1.442695;\n\nvoid main()\n{\n   vec4 col=vec4(0.0,0.0,0.0,1.0);\n   vec4 colImg=texture(image,texCoord);\n\n    col=texture(depthTex,texCoord);\n\n    float z=1.0-col.r;\n\n    z=smoothstep(start,1.0,z);\n\n    float fogFactor = a*exp2( -density * \n        density *\n        z *\n        z *\n        LOG2);\n\n    #ifdef FOG_IGNORE_INFINITY\n        if(z==0.0)\n        {\n            col=colImg;\n        }\n        else\n    #endif\n    {\n        col=mix(colImg,vec4(r,g,b,1.0),fogFactor);\n    }\n\n   outColor= col;\n}",};


var render=op.inTrigger('render');
var density=op.inValueFloat("density");
var image=op.inTexture("depth texture");
var trigger=op.outTrigger('trigger');
var ignoreInf=op.inValueBool("ignore infinity");

ignoreInf.set(false);
ignoreInf.onChange=function()
{
    if(ignoreInf.get()) shader.define('FOG_IGNORE_INFINITY');
        else shader.removeDefine('FOG_IGNORE_INFINITY');
};

var cgl=op.patch.cgl;
var shader=new CGL.Shader(cgl);


var srcFrag=attachments.fog_frag;

shader.setSource(shader.getDefaultVertexShader(),srcFrag);
var textureUniform=new CGL.Uniform(shader,'t','depthTex',1);
var textureUniform=new CGL.Uniform(shader,'t','image',0);

var uniDensity=new CGL.Uniform(shader,'f','density',1.0);
density.onChange=function()
{
    uniDensity.setValue(density.get());
};
density.set(5.0);


    // fog color

const r = op.inValueSlider("fog r", Math.random());
const g = op.inValueSlider("fog g", Math.random());
const b = op.inValueSlider("fog b", Math.random());
r.setUiAttribs({ colorPick: true });

const rUniform=new CGL.Uniform(shader,'f','r',r);
const gUniform=new CGL.Uniform(shader,'f','g',g);
const bUniform=new CGL.Uniform(shader,'f','b',b);


const a=op.inValueSlider("fog a",1.0);
const aUniform=new CGL.Uniform(shader,'f','a',a);


var start=op.inValueSlider("start");
start.onChange=function()
{
    if(!start.uniform) start.uniform=new CGL.Uniform(shader,'f','start',start.get());
    else start.uniform.setValue(start.get());
};
start.set(0);

render.onTriggered=function()
{
    if(!CGL.TextureEffect.checkOpInEffect(op)) return;

    if(image.get() && image.get().tex)
    {
        cgl.setShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex );
        cgl.setTexture(1, image.get().tex );

        cgl.currentTextureEffect.finish();
        cgl.setPreviousShader();
    }

    trigger.trigger();
};

};

Ops.Gl.TextureEffects.Fog.prototype = new CABLES.Op();
CABLES.OPS["9892b737-099d-4b33-8789-0ab9bdc40dab"]={f:Ops.Gl.TextureEffects.Fog,objName:"Ops.Gl.TextureEffects.Fog"};




// **************************************************************
// 
// Ops.Gl.InteractiveRectangle
// 
// **************************************************************

Ops.Gl.InteractiveRectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

var render=op.inTrigger("render");
var trigger=op.outTrigger('trigger');

var width=op.inValue("width",1);
var height=op.inValue("height",1);

var inId=op.inValueString("id");
var classPort = op.inValueString("Class");

var pivotX=op.inValueSelect("pivot x",["center","left","right"]);
var pivotY=op.inValueSelect("pivot y",["center","top","bottom"]);

var axis=op.inValueSelect("axis",["xy","xz"]);

var isInteractive=op.inValueBool('Is Interactive',true);
var active=op.inValueBool('Render',true);
var divVisible=op.inValueBool('Show Boundings',true);

var cursorPort=op.inValueSelect("Cursor",["auto","crosshair","pointer","Hand","move","n-resize","ne-resize","e-resize","se-resize","s-resize","sw-resize","w-resize","nw-resize","text","wait","help", "none"],"pointer");

var geomOut=op.outObject("geometry");
geomOut.ignoreValueSerialize=true;

var mouseOver=op.outValue("Pointer Hover",false);
var mouseDown=op.outValue("Pointer Down",false);
var outX=op.outValue("Pointer X");
var outY=op.outValue("Pointer Y");

var outTop=op.outValue("Top");
var outLeft=op.outValue("Left");
var outRight=op.outValue("Right");
var outBottom=op.outValue("Bottom");

var mouseClick=op.outTrigger("Left Click");

var elementPort = op.outObject('Dom Element');

var cgl=op.patch.cgl;
axis.set('xy');
pivotX.set('center');
pivotY.set('center');

var geom=new CGL.Geometry();
var mesh=null;
var div=null;
var m=mat4.create();
var trans=mat4.create();
var pos=vec3.create();
var divAlign=vec3.create();
var divAlignSize=vec3.create();

axis.onChange=rebuild;
pivotX.onChange=rebuild;
pivotY.onChange=rebuild;
width.onChange=rebuild;
height.onChange=rebuild;
cursorPort.onChange=updateCursor;
rebuild();


var modelMatrix=mat4.create();
var identViewMatrix=mat4.create();
var zeroVec3=vec3.create();

render.onTriggered=function()
{
    if(!div)
    {
        setUpDiv();
        addListeners();
        updateDivVisibility();
        updateIsInteractive();
    }
    updateDivSize();

    if(active.get() && mesh) mesh.render(cgl.getShader());

    trigger.trigger();
};

function rebuild()
{
    var w=width.get();
    var h=height.get();
    var x=0;
    var y=0;

    if(typeof w=='string')w=parseFloat(w);
    if(typeof h=='string')h=parseFloat(h);

    if(pivotX.get()=='center')
    {
        x=0;
        divAlign[0]=-w/2;
    }
    if(pivotX.get()=='right')
    {
        x=-w/2;
    }
    if(pivotX.get()=='left')
    {
        x=w/2;
    }

    if(pivotY.get()=='center')
    {
        y=0;
        divAlign[1]=-h/2;
    }
    if(pivotY.get()=='top') y=-h/2;
    if(pivotY.get()=='bottom') y=+h/2;

    var verts=[];
    var tc=[];
    var norms=[];
    var indices=[];

    var numRows=1;
    var numColumns=1;

    var stepColumn=w/numColumns;
    var stepRow=h/numRows;

    var c,r;

    for(r=0;r<=numRows;r++)
    {
        for(c=0;c<=numColumns;c++)
        {
            verts.push( c*stepColumn - width.get()/2+x );
            if(axis.get()=='xz') verts.push( 0.0 );
            verts.push( r*stepRow - height.get()/2+y );
            if(axis.get()=='xy') verts.push( 0.0 );

            tc.push( c/numColumns );
            tc.push( 1.0-r/numRows );

            if(axis.get()=='xz')
            {
                norms.push(0);
                norms.push(1);
                norms.push(0);
            }

            if(axis.get()=='xy')
            {
                norms.push(0);
                norms.push(0);
                norms.push(-1);
            }
        }
    }

    for(c=0;c<numColumns;c++)
    {
        for(r=0;r<numRows;r++)
        {
            var ind = c+(numColumns+1)*r;
            var v1=ind;
            var v2=ind+1;
            var v3=ind+numColumns+1;
            var v4=ind+1+numColumns+1;

            indices.push(v1);
            indices.push(v3);
            indices.push(v2);

            indices.push(v2);
            indices.push(v3);
            indices.push(v4);
        }
    }

    geom.clear();
    geom.vertices=verts;
    geom.texCoords=tc;
    geom.verticesIndices=indices;
    geom.vertexNormals=norms;

    if(!mesh) mesh=new CGL.Mesh(cgl,geom);
        else mesh.setGeom(geom);

    geomOut.set(null);
    geomOut.set(geom);

}

var divX=0;
var divY=0;
var divWidth=0;
var divHeight=0;

var mMatrix=mat4.create();
divVisible.onChange=updateDivVisibility;
inId.onChange=updateId;
classPort.onChange = updateClassNames;

function updateDivVisibility()
{
    if(div)
    {
        if(divVisible.get()) div.style.border='1px solid red';
        else div.style.border='none';
    }
}

function updateCursor()
{
    if(div)
    {
        div.style.cursor = cursorPort.get();
    }
}

function updateId()
{
    if(div)
    {
        div.setAttribute('id',inId.get());

    }
}

function updateDivSize()
{
    var vp=cgl.getViewPort();


    mat4.multiply(mMatrix,cgl.vMatrix,cgl.mMatrix);
    vec3.transformMat4(pos, divAlign, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);



    var x1 = (trans[0] * vp[2]/2) + vp[2]/2;
    var y1 = (trans[1] * vp[3]/2) + vp[3]/2;


    divAlignSize[0] = divAlign[0] + width.get();
    divAlignSize[1] = divAlign[1];

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    var x2 = ((trans[0] * vp[2]/2) + vp[2]/2);
    var y2= ((trans[1] * vp[3]/2) + vp[3]/2);




    divAlignSize[0] = divAlign[0];
    divAlignSize[1] = divAlign[1] + height.get();

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    var x3 = ((trans[0] * vp[2]/2) + vp[2]/2);
    var y3= ((trans[1] * vp[3]/2) + vp[3]/2);




    divAlignSize[0] = divAlign[0] + width.get();
    divAlignSize[1] = divAlign[1] + height.get();

    vec3.transformMat4(pos, divAlignSize, mMatrix);
    vec3.transformMat4(trans, pos, cgl.pMatrix);

    var x4 = ((trans[0] * vp[2]/2) + vp[2]/2);
    var y4 = ((trans[1] * vp[3]/2) + vp[3]/2);


    divX=Math.min(x1,x2,x3,x4);
    divY=Math.min(vp[3]-y1,vp[3]-y2,vp[3]-y3,vp[3]-y4);

    var xb=Math.max(x1,x2,x3,x4);
    var yb=Math.max(vp[3]-y1,vp[3]-y2,vp[3]-y3,vp[3]-y4);

    outTop.set(divY);
    outLeft.set(divX);
    outRight.set(xb);
    outBottom.set(yb);

    divWidth=Math.abs(xb-divX);
    divHeight=Math.abs(yb-divY);


    divX/=op.patch.cgl.pixelDensity;
    divY/=op.patch.cgl.pixelDensity;
    divWidth/=op.patch.cgl.pixelDensity;
    divHeight/=op.patch.cgl.pixelDensity;

    div.style.left=divX+'px';
    div.style.top=divY+'px';
    div.style.width=divWidth+'px';
    div.style.height=divHeight+'px';
}

function updateClassNames() {
    if(div) {
        div.className = classPort.get();
    }
}

op.onDelete=function()
{
    if(div)div.remove();
}

function setUpDiv()
{
    if(!div)
    {
        div = document.createElement('div');
        div.oncontextmenu = function(e){
            console.log("context menu canceled!");
            e.preventDefault();
        }

        div.style.padding="0px";
        div.style.position="absolute";
        div.style['box-sizing']="border-box";
        div.style.border="1px solid red";
        // div.style['border-left']="1px solid blue";
        // div.style['border-top']="1px solid green";
        div.style["z-index"]="9999";

        div.style["-webkit-user-select"]="none";
        div.style["user-select"]="none";
        div.style["-webkit-tap-highlight-color"]="rgba(0,0,0,0)";
        div.style["-webkit-touch-callout"]="none";

        var canvas = op.patch.cgl.canvas.parentElement;
        canvas.appendChild(div);
        updateCursor();
        updateIsInteractive();
        updateId();
        updateClassNames();
    }
    updateDivSize();
    elementPort.set(div);
}

var listenerElement=null;

function onMouseMove(e)
{
    var offsetX=-width.get()/2;
    var offsetY=-height.get()/2;

    outX.set( Math.max(0.0,Math.min(1.0,e.offsetX/divWidth)));
    outY.set( Math.max(0.0,Math.min(1.0,1.0-e.offsetY/divHeight)));
}

function onMouseLeave(e)
{
    mouseDown.set(false);
    mouseOver.set(false);
}

function onMouseEnter(e)
{
    mouseOver.set(true);
}

function onMouseDown(e)
{
    mouseDown.set(true);
}

function onMouseUp(e)
{
    mouseDown.set(false);
}

function onmouseclick(e)
{
    mouseClick.trigger();
}

function onTouchMove(e)
{
    // console.log('touchmoveevent',e);

    var targetEle=document.elementFromPoint(e.targetTouches[0].pageX,e.targetTouches[0].pageY);

    if(targetEle==div)
    {
        mouseOver.set(true);
        if(e.touches && e.touches.length>0)
        {
            var rect = div.getBoundingClientRect(); //e.target
            var x = e.targetTouches[0].pageX - rect.left;
            var y = e.targetTouches[0].pageY - rect.top;

            var touch=e.touches[0];

            outX.set( Math.max(0.0,Math.min(1.0,x/divWidth)));
            outY.set( Math.max(0.0,Math.min(1.0,1.0-y/divHeight)));

            onMouseMove(touch);
        }
    }
    else
    {
        mouseOver.set(false);
    }
}


active.onChange=updateActiveRender;
function updateActiveRender()
{
    if(active.get())
    {
        addListeners();
        if(div) div.style['display']='block';
    }
    else
    {
        removeListeners();
        if(div) div.style['display']='none';
    }

}

isInteractive.onChange=updateIsInteractive;
function updateIsInteractive()
{
    if(isInteractive.get())
    {
        addListeners();
        if(div)div.style['pointer-events']='initial';
    }
    else
    {
        removeListeners();
        mouseDown.set(false);
        mouseOver.set(false);
        if(div)div.style['pointer-events']='none';
    }
}

function removeListeners()
{
    if(listenerElement)
    {
        document.removeEventListener('touchmove', onTouchMove);
        listenerElement.removeEventListener('touchend', onMouseUp);
        listenerElement.removeEventListener('touchstart', onMouseDown);

        listenerElement.removeEventListener('click', onmouseclick);
        listenerElement.removeEventListener('mousemove', onMouseMove);
        listenerElement.removeEventListener('mouseleave', onMouseLeave);
        listenerElement.removeEventListener('mousedown', onMouseDown);
        listenerElement.removeEventListener('mouseup', onMouseUp);
        listenerElement.removeEventListener('mouseenter', onMouseEnter);
        // listenerElement.removeEventListener('contextmenu', onClickRight);
        listenerElement=null;
    }
}

function addListeners()
{
    if(listenerElement)removeListeners();

    listenerElement=div;

    if(listenerElement)
    {
        document.addEventListener('touchmove', onTouchMove);
        listenerElement.addEventListener('touchend', onMouseUp);
        listenerElement.addEventListener('touchstart', onMouseDown);

        listenerElement.addEventListener('click', onmouseclick);
        listenerElement.addEventListener('mousemove', onMouseMove);
        listenerElement.addEventListener('mouseleave', onMouseLeave);
        listenerElement.addEventListener('mousedown', onMouseDown);
        listenerElement.addEventListener('mouseup', onMouseUp);
        listenerElement.addEventListener('mouseenter', onMouseEnter);
        // listenerElement.addEventListener('contextmenu', onClickRight);

    }
}



};

Ops.Gl.InteractiveRectangle.prototype = new CABLES.Op();
CABLES.OPS["eeebdb51-9d8c-404d-a538-f5d9cf409200"]={f:Ops.Gl.InteractiveRectangle,objName:"Ops.Gl.InteractiveRectangle"};




// **************************************************************
// 
// Ops.Gl.Texture
// 
// **************************************************************

Ops.Gl.Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var filename=op.inFile("file","image");
var tfilter=op.inSwitch("filter",['nearest','linear','mipmap']);
var wrap=op.inValueSelect("wrap",['repeat','mirrored repeat','clamp to edge'],"clamp to edge");
var flip=op.inValueBool("flip",false);
var unpackAlpha=op.inValueBool("unpackPreMultipliedAlpha",false);
var aniso=op.inSwitch("Anisotropic",[0,1,2,4,8,16],0);

var textureOut=op.outTexture("texture");
var width=op.outValue("width");
var height=op.outValue("height");
var loading=op.outValue("loading");
var ratio=op.outValue("Aspect Ratio");

op.setPortGroup("Size",[width,height]);

unpackAlpha.hidePort();

op.toWorkPortsNeedToBeLinked(textureOut);

const cgl=op.patch.cgl;
var cgl_filter=0;
var cgl_wrap=0;
var cgl_aniso=0;

filename.onChange=flip.onChange=function(){reloadSoon();};

aniso.onChange=tfilter.onChange=onFilterChange;
wrap.onChange=onWrapChange;
unpackAlpha.onChange=function(){ reloadSoon(); };

var timedLoader=0;

tfilter.set('mipmap');
wrap.set('repeat');

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

var setTempTexture=function()
{
    var t=CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

var loadingId=null;
var tex=null;
function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader=setTimeout(function()
    {
        realReload(nocache);
    },30);
}

function realReload(nocache)
{
    if(!loadingId)loadingId=cgl.patch.loading.start('textureOp',filename.get());

    var url=op.patch.getFilePath(String(filename.get()));
    if(nocache)url+='?rnd='+CABLES.generateUUID();

    if((filename.get() && filename.get().length>1))
    {
        loading.set(true);

        if(tex)tex.delete();
        tex=CGL.Texture.load(cgl,url,
            function(err)
            {
                if(err)
                {
                    setTempTexture();
                    op.uiAttr({'error':'could not load texture "'+filename.get()+'"'});
                    cgl.patch.loading.finished(loadingId);
                    return;
                }
                else op.uiAttr({'error':null});
                textureOut.set(tex);
                width.set(tex.width);
                height.set(tex.height);
                ratio.set(tex.width/tex.height);

                if(!tex.isPowerOfTwo()) op.uiAttr(
                    {
                        hint:'texture dimensions not power of two! - texture filtering will not work.',
                        warning:null
                    });
                    else op.uiAttr(
                        {
                            hint:null,
                            warning:null
                        });

                textureOut.set(null);
                textureOut.set(tex);
                // tex.printInfo();

            },{
                anisotropic:cgl_aniso,
                wrap:cgl_wrap,
                flip:flip.get(),
                unpackAlpha:unpackAlpha.get(),
                filter:cgl_filter
            });

        textureOut.set(null);
        textureOut.set(tex);

        if(!textureOut.get() && nocache)
        {
        }

        cgl.patch.loading.finished(loadingId);
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        setTempTexture();
    }
}

function onFilterChange()
{
    if(tfilter.get()=='nearest') cgl_filter=CGL.Texture.FILTER_NEAREST;
    else if(tfilter.get()=='linear') cgl_filter=CGL.Texture.FILTER_LINEAR;
    else if(tfilter.get()=='mipmap') cgl_filter=CGL.Texture.FILTER_MIPMAP;
    else if(tfilter.get()=='Anisotropic') cgl_filter=CGL.Texture.FILTER_ANISOTROPIC;

    cgl_aniso=parseFloat(aniso.get());

    reloadSoon();
}

function onWrapChange()
{
    if(wrap.get()=='repeat') cgl_wrap=CGL.Texture.WRAP_REPEAT;
    if(wrap.get()=='mirrored repeat') cgl_wrap=CGL.Texture.WRAP_MIRRORED_REPEAT;
    if(wrap.get()=='clamp to edge') cgl_wrap=CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged=function(fn)
{
    if(filename.get() && filename.get().indexOf(fn)>-1)
    {
        textureOut.set(null);
        textureOut.set(CGL.Texture.getTempTexture(cgl));

        realReload(true);
    }
};







};

Ops.Gl.Texture.prototype = new CABLES.Op();
CABLES.OPS["466394d4-6c1a-4e5d-a057-0063ab0f096a"]={f:Ops.Gl.Texture,objName:"Ops.Gl.Texture"};




// **************************************************************
// 
// Ops.Html.HyperLink_v2
// 
// **************************************************************

Ops.Html.HyperLink_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exec=op.inTrigger("Open"),
    inUrl=op.inString("URL","https://cables.gl"),
    inTarget=op.inString("Target Name","_self"),
    inSpecs=op.inString("Specs","");


exec.onTriggered=function()
{
    // document.location.href=inUrl.get();
    window.open(inUrl.get(), inTarget.get(), inSpecs.get());
};

};

Ops.Html.HyperLink_v2.prototype = new CABLES.Op();
CABLES.OPS["a669d4f7-1e35-463c-bf8b-08c9f1b68e04"]={f:Ops.Html.HyperLink_v2,objName:"Ops.Html.HyperLink_v2"};




// **************************************************************
// 
// Ops.Html.DivElement_v2
// 
// **************************************************************

Ops.Html.DivElement_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inText=op.inString("Text","Hello Div"),
    inId=op.inString("Id"),
    inClass=op.inString("Class"),
    inStyle=op.inValueEditor("Style","position:absolute;z-index:9999;","css"),
    inInteractive=op.inValueBool("Interactive",false),
    inVisible=op.inValueBool("Visible",true),
    inBreaks=op.inValueBool("Convert Line Breaks",false),
    outElement=op.outObject("DOM Element"),
    outHover=op.outValue("Hover"),
    outClicked=op.outTrigger("Clicked");

var listenerElement=null;

var div = document.createElement('div');
var canvas = op.patch.cgl.canvas.parentElement;

canvas.appendChild(div);
outElement.set(div);

inClass.onChange=updateClass;
inBreaks.onChange=inText.onChange=updateText;
inStyle.onChange=updateStyle;
inInteractive.onChange=updateInteractive;
inVisible.onChange=updateVisibility;

updateText();
updateStyle();

op.onDelete=removeElement;

var prevDisplay='block';

function setCSSVisible(visible)
{
    if(!visible)
    {
        div.style.visibility='hidden';
        prevDisplay=div.style.display||'block';
        div.style.display='none';
    }
    else
    {
        // prevDisplay=div.style.display||'block';
        if(prevDisplay=="none") prevDisplay="block";
        div.style.visibility='visible';
        div.style.display=prevDisplay;
    }
}

function updateVisibility()
{
    setCSSVisible(inVisible.get());
}

var oldStr=null;

function updateText()
{
    var str=inText.get();
    // console.log(oldStr,str);

    if(oldStr===str) return;
    oldStr=str;

    if(inBreaks.get()) str = str.replace(/(?:\r\n|\r|\n)/g, '<br>');

    div.innerHTML=str;
    // outElement.set(null);
    // outElement.set(div);
}

function removeElement()
{
    div.parentNode.removeChild(div);
}

function updateStyle()
{
    div.setAttribute("style",inStyle.get());
    updateVisibility();
    // outElement.set(null);
    // outElement.set(div);
}

function updateClass()
{
    div.setAttribute("class",inClass.get());
}

function onMouseEnter()
{
    outHover.set(true);
}

function onMouseLeave()
{
    outHover.set(false);
}

function onMouseClick()
{
    outClicked.trigger();
}

function updateInteractive()
{
    removeListeners();
    if(inInteractive.get()) addListeners();
}

inId.onChange=function()
{
    div.id=inId.get();
};

function removeListeners()
{
    if(listenerElement)
    {
        listenerElement.removeEventListener('click', onMouseClick);
        listenerElement.removeEventListener('mouseleave', onMouseLeave);
        listenerElement.removeEventListener('mouseenter', onMouseEnter);
        listenerElement=null;
    }
}

function addListeners()
{
    if(listenerElement)removeListeners();

    listenerElement=div;

    if(listenerElement)
    {
        listenerElement.addEventListener('click', onMouseClick);
        listenerElement.addEventListener('mouseleave', onMouseLeave);
        listenerElement.addEventListener('mouseenter', onMouseEnter);
    }
}

op.addEventListener("onEnabledChange",function(enabled)
{
    setCSSVisible( div.style.visibility!='visible' );
});



};

Ops.Html.DivElement_v2.prototype = new CABLES.Op();
CABLES.OPS["db36db6d-83e4-4d27-b84c-8a20067aaffc"]={f:Ops.Html.DivElement_v2,objName:"Ops.Html.DivElement_v2"};




// **************************************************************
// 
// Ops.Math.MapRange
// 
// **************************************************************

Ops.Math.MapRange = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};

const result=op.outValue("result");
var v=op.inValueFloat("value");
var old_min=op.inValueFloat("old min");
var old_max=op.inValueFloat("old max");
var new_min=op.inValueFloat("new min");
var new_max=op.inValueFloat("new max");
var easing=op.inValueSelect("Easing",["Linear","Smoothstep","Smootherstep"],"Linear");

op.setPortGroup("Input Range",[old_min,old_max]);
op.setPortGroup("Output Range",[new_min,new_max]);

var ease=0;
var r=0;

easing.onChange=function()
{
    if(easing.get()=="Smoothstep") ease=1;
        else if(easing.get()=="Smootherstep") ease=2;
            else ease=0;
};


function exec()
{
    if(v.get()>=Math.max( old_max.get(),old_min.get() ))
    {
        result.set(new_max.get());
        return;
    }
    else
    if(v.get()<=Math.min( old_max.get(),old_min.get() ))
    {
        result.set(new_min.get());
        return;
    }

    var nMin=new_min.get();
    var nMax=new_max.get();
    var oMin=old_min.get();
    var oMax=old_max.get();
    var x=v.get();

    var reverseInput = false;
    var oldMin = Math.min( oMin, oMax );
    var oldMax = Math.max( oMin, oMax );
    if(oldMin!= oMin) reverseInput = true;

    var reverseOutput = false;
    var newMin = Math.min( nMin, nMax );
    var newMax = Math.max( nMin, nMax );
    if(newMin != nMin) reverseOutput = true;

    var portion=0;

    if(reverseInput) portion = (oldMax-x)*(newMax-newMin)/(oldMax-oldMin);
        else portion = (x-oldMin)*(newMax-newMin)/(oldMax-oldMin);

    if(reverseOutput) r=newMax - portion;
        else r=portion + newMin;

    if(ease===0)
    {
        result.set(r);
    }
    else
    if(ease==1)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*(3 - 2*x)* (nMax-nMin) ); // smoothstep
    }
    else
    if(ease==2)
    {
        x = Math.max(0, Math.min(1, (r-nMin)/(nMax-nMin)));
        result.set( nMin+x*x*x*(x*(x*6 - 15) + 10) * (nMax-nMin) ) ; // smootherstep
    }

}

v.set(0);
old_min.set(0);
old_max.set(1);
new_min.set(-1);
new_max.set(1);


v.onChange=exec;
old_min.onChange=exec;
old_max.onChange=exec;
new_min.onChange=exec;
new_max.onChange=exec;

result.set(0);

exec();

};

Ops.Math.MapRange.prototype = new CABLES.Op();
CABLES.OPS["2617b407-60a0-4ff6-b4a7-18136cfa7817"]={f:Ops.Math.MapRange,objName:"Ops.Math.MapRange"};




// **************************************************************
// 
// Ops.Html.BrowserCheck
// 
// **************************************************************

Ops.Html.BrowserCheck = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var isMobile=op.outValue("Is Mobile",false);
var isIe=op.outValue("Is IE",false);
var isIe10Plus=op.outValue("Is IE 10+",false);
var isIe11=op.outValue("Is IE 11",false);
var isEdge=op.outValue("Is Edge",false);
var isChrome=op.outValue("Is Chrome",false);
var isFirefox=op.outValue("Is Firefox",false);
var isSafari=op.outValue("Is Safari",false);
var isWindows=op.outValue("Is Windows",false);
var isLinux=op.outValue("Is Linux",false);
var isMac=op.outValue("Is Mac",false);
var isIos=op.outValue("Is iOS",false);
var isAndroid=op.outValue("Is Android",false);

var outNav=op.outValue("Language");

outNav.set(navigator.language || navigator.userLanguage);

isFirefox.set(!!navigator.userAgent.search("Firefox"));

if( /^((?!chrome|android).)*safari/i.test(navigator.userAgent) )
{
    isSafari.set(true);
}

if( /MSIE 10/i.test(navigator.userAgent) || /MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent))
{
    isIe.set(true);
    isFirefox.set(false);
    if( /MSIE 9/i.test(navigator.userAgent) ) {
        isIe10Plus.set(false);
        isIe11.set(false);
    } else if( /MSIE 10/i.test(navigator.userAgent) ) {
        isIe10Plus.set(true);
        isIe11.set(false);
    } else if( /rv:11.0/i.test(navigator.userAgent) ) {
        isIe10Plus.set(false);
        isIe11.set(true);
    }
}

if(/Edge\/\d./i.test(navigator.userAgent))
{
   isEdge.set(true);
   isFirefox.set(false);
}

var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");


if(isIOSChrome || (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera === false && isIEedge === false))
{
   // is Google Chrome
   isChrome.set(true);
   isFirefox.set(false);
}
else
{
   // not Google Chrome
}



if(window.navigator.userAgent.indexOf("Windows") != -1)
{
    isWindows.set(true);
}

if(window.navigator.userAgent.indexOf("Linux") != -1)
{
    isWindows.set(false);
    isLinux.set(true);
}

if(window.navigator.userAgent.indexOf("Mac") != -1)
{
    isWindows.set(false);
    isMac.set(true);
}

isIos.set( /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);

if(window.navigator.userAgent.toLowerCase().indexOf("android") != -1)
    isAndroid.set(true);




isMobile.set(false);
if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
    isMobile.set(true);



};

Ops.Html.BrowserCheck.prototype = new CABLES.Op();
CABLES.OPS["6e2ff98b-1e85-4b89-b125-fb8da727ba0c"]={f:Ops.Html.BrowserCheck,objName:"Ops.Html.BrowserCheck"};


window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
