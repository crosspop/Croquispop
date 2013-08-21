// Initialize croquis
var croquis = new Croquis();
croquis.lockHistory();
croquis.setCanvasSize(640, 480);
croquis.addLayer();
croquis.fillLayer('#fff');
croquis.addLayer();
croquis.selectLayer(1);
croquis.unlockHistory();

var brush = new Croquis.Brush();
brush.setSize(40);
brush.setColor('#000');
brush.setSpacing(0);

croquis.setTool(brush);
croquis.setToolStabilizeLevel(10);
croquis.setToolStabilizeWeight(0.5);

var croquisDOMElement = croquis.getDOMElement();
var canvasArea = document.getElementById('canvas-area');
canvasArea.appendChild(croquisDOMElement);
function canvasPointerDown(e) {
    var pointerPosition = getRelativePosition(e.clientX, e.clientY);
    canvasArea.style.setProperty('cursor', 'none');	
	croquis.down(pointerPosition.x, pointerPosition.y, e.pointerType == "pen" ? e.pressure : null);
    document.addEventListener('pointermove', canvasPointerMove);
    document.addEventListener('pointerup', canvasPointerUp);
}
function canvasPointerMove(e) {
    var pointerPosition = getRelativePosition(e.clientX, e.clientY);
    croquis.move(pointerPosition.x, pointerPosition.y, e.pointerType == "pen" ? e.pressure : null);
}
function canvasPointerUp(e) {
    var pointerPosition = getRelativePosition(e.clientX, e.clientY);
    canvasArea.style.setProperty('cursor', 'crosshair');
    croquis.up(pointerPosition.x, pointerPosition.y, e.pointerType == "pen" ? e.pressure : null);
    document.removeEventListener('pointermove', canvasPointerMove);
    document.removeEventListener('pointerup', canvasPointerUp);
}
function getRelativePosition(absoluteX, absoluteY) {
    var rect = croquisDOMElement.getBoundingClientRect();
    return {x: absoluteX - rect.left, y: absoluteY - rect.top};
}
croquisDOMElement.addEventListener('pointerdown', canvasPointerDown);

//clear & fill button ui
var clearButton = document.getElementById('clear-button');
clearButton.onclick = function () {
    croquis.clearLayer();
}
var fillButton = document.getElementById('fill-button');
fillButton.onclick = function () {
    var rgb = tinycolor(brush.getColor()).toRgb();
    croquis.fillLayer(tinycolor({r: rgb.r, g: rgb.g, b: rgb.b,
        a: croquis.getPaintingOpacity()}).toRgbString());
}

//brush images
var circleBrush = document.getElementById('circle-brush');
var brushImages = document.getElementsByClassName('brush-image');
var currentBrush = circleBrush;

Array.prototype.map.call(brushImages, function (brush) {
    brush.addEventListener('pointerdown', brushImagePointerDown);
});

function brushImagePointerDown(e) {
    var image = e.currentTarget;
    currentBrush.className = 'brush-image';
    image.className = 'brush-image on';
    currentBrush = image;
    if (image == circleBrush)
        image = null;
    brush.setImage(image);
    updatePointer();
}

// explorer version
var IEVersion;
(function () {
    var ua = navigator.userAgent.toLowerCase();
    IEVersion = (ua.indexOf('msie') == -1) ?
                Infinity : parseInt(ua.split('msie')[1]);
})();

//brush pointer
var brushPointerContainer = document.createElement('div');
brushPointerContainer.className = 'brush-pointer';

if (IEVersion > 10) {
    croquisDOMElement.addEventListener('pointerover', function () {
        croquisDOMElement.addEventListener('pointermove', croquisPointerMove);
        document.body.appendChild(brushPointerContainer);
    });
    croquisDOMElement.addEventListener('pointerout', function () {
        croquisDOMElement.removeEventListener('pointermove', croquisPointerMove);
        brushPointerContainer.parentElement.removeChild(brushPointerContainer);
    });
}

function croquisPointerMove(e) {
    var x = e.clientX + window.pageXOffset;
    var y = e.clientY + window.pageYOffset;
    brushPointerContainer.style.setProperty('left', x + 'px');
    brushPointerContainer.style.setProperty('top', y + 'px');
}

function updatePointer() {
    var image = currentBrush;
    var threshold;
    if (currentBrush == circleBrush) {
        image = null;
        threshold = 0xff;
    }
    else {
        threshold = 0x30;
    }
    var brushPointer = Croquis.createBrushPointer(
        image, brush.getSize(), threshold, true);
    brushPointer.style.setProperty('margin-left',
        '-' + (brushPointer.width * 0.5) + 'px');
    brushPointer.style.setProperty('margin-top',
        '-' + (brushPointer.height * 0.5) + 'px');
    brushPointerContainer.innerHTML = '';
    brushPointerContainer.appendChild(brushPointer);
}
updatePointer();

//color picker
var colorPickerHueSlider =
    document.getElementById('color-picker-hue-slider');
var colorPickerSb = document.getElementById('color-picker-sb');
var colorPickerSaturate = document.getElementById('color-picker-saturate');
var colorPickerThumb = document.getElementById('color-picker-thumb');
colorPickerHueSlider.value = tinycolor(brush.getColor()).toHsv().h;

function setColor() {
    var halfThumbRadius = 7.5;
    var sbSize = 150;
    var h = colorPickerHueSlider.value;
    var s = parseFloat(
        colorPickerThumb.style.getPropertyValue('margin-left'));
    var b = parseFloat(
        colorPickerThumb.style.getPropertyValue('margin-top'));
    s = (s + halfThumbRadius) / sbSize;
    b = 1 - ((b + halfThumbRadius + sbSize) / sbSize);
    brush.setColor(tinycolor({h: h, s:s, v: b}).toRgbString());
    var a = croquis.getPaintingOpacity();
    var color = tinycolor({h: h, s:s, v: b, a: a});
    colorPickerColor.style.backgroundColor = color.toRgbString();
    colorPickerColor.textContent = color.toHexString();
}

colorPickerHueSlider.onchange = function () {
    var hue = colorPickerHueSlider.value;
    colorPickerSaturate.style.setProperty('background-image',
        'linear-gradient(to right, hsla(' +
        hue + ', 100%, 50%, 0), hsl(' + hue + ', 100%, 50%))');
    setColor();
}

function colorPickerPointerDown(e) {
    document.addEventListener('pointermove', colorPickerPointerMove);
    colorPickerPointerMove(e);
}
function colorPickerPointerUp(e) {
    document.removeEventListener('pointermove', colorPickerPointerMove);
}
function colorPickerPointerMove(e) {
    var boundRect = colorPickerSb.getBoundingClientRect();
    var x = (e.clientX - boundRect.left);
    var y = (e.clientY - boundRect.top);
    pickColor(x, y);
}
function minmax(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function pickColor(x, y) {
    var halfThumbRadius = 7.5;
    var sbSize = 150;
    colorPickerThumb.style.setProperty('margin-left',
        (minmax(x, 0, sbSize) - halfThumbRadius) + 'px');
    colorPickerThumb.style.setProperty('margin-top',
        (minmax(y, 0, sbSize) - (sbSize + halfThumbRadius)) + 'px');
    colorPickerThumb.style.setProperty('border-color',
        (y < sbSize * 0.5)? '#000' : '#fff');
    setColor();
}
colorPickerSb.addEventListener('pointerdown', colorPickerPointerDown);
document.addEventListener('pointerup', colorPickerPointerUp);

var backgroundCheckerImage;
(function () {
    backgroundCheckerImage = document.createElement('canvas');
    backgroundCheckerImage.width = backgroundCheckerImage.height = 20;
    var backgroundImageContext = backgroundCheckerImage.getContext('2d');
    backgroundImageContext.fillStyle = '#fff';
    backgroundImageContext.fillRect(0, 0, 20, 20);
    backgroundImageContext.fillStyle = '#ccc';
    backgroundImageContext.fillRect(0, 0, 10, 10);
    backgroundImageContext.fillRect(10, 10, 20, 20);
})();

var colorPickerChecker = document.getElementById('color-picker-checker');
colorPickerChecker.style.backgroundImage = 'url(' +
    backgroundCheckerImage.toDataURL() + ')';
var colorPickerColor = document.getElementById('color-picker-color');

pickColor(0, 150);

//stabilizer shelf
var toolStabilizeLevelSlider =
    document.getElementById('tool-stabilize-level-slider');
var toolStabilizeWeightSlider =
    document.getElementById('tool-stabilize-weight-slider');
toolStabilizeLevelSlider.value = croquis.getToolStabilizeLevel();
toolStabilizeWeightSlider.value = croquis.getToolStabilizeWeight() * 100;

//brush shelf
var selectEraserCheckbox =
    document.getElementById('select-eraser-checkbox');
var brushSizeSlider = document.getElementById('brush-size-slider');
var brushOpacitySlider = document.getElementById('brush-opacity-slider');
var brushFlowSlider = document.getElementById('brush-flow-slider');
var brushSpacingSlider = document.getElementById('brush-spacing-slider');
brushSizeSlider.value = brush.getSize();
brushOpacitySlider.value = croquis.getPaintingOpacity() * 100;
brushFlowSlider.value = brush.getFlow() * 100;
brushSpacingSlider.value = brush.getSpacing() * 100;

toolStabilizeLevelSlider.onchange = function () {
    croquis.setToolStabilizeLevel(toolStabilizeLevelSlider.value);
    toolStabilizeLevelSlider.value = croquis.getToolStabilizeLevel();
}
toolStabilizeWeightSlider.onchange = function () {
    croquis.setToolStabilizeWeight(toolStabilizeWeightSlider.value * 0.01);
    toolStabilizeWeightSlider.value = croquis.getToolStabilizeWeight() * 100;
}

selectEraserCheckbox.onchange = function () {
    croquis.setPaintingKnockout(selectEraserCheckbox.checked);
}
brushSizeSlider.onchange = function () {
    brush.setSize(brushSizeSlider.value);
    updatePointer();
}
brushOpacitySlider.onchange = function () {
    croquis.setPaintingOpacity(brushOpacitySlider.value * 0.01);
    setColor();
}
brushFlowSlider.onchange = function () {
    brush.setFlow(brushFlowSlider.value * 0.01);
}
brushSpacingSlider.onchange = function () {
    brush.setSpacing(brushSpacingSlider.value * 0.01);
}

// Platform variables
var mac = navigator.platform.indexOf('Mac') >= 0;

//keyboard
document.addEventListener('keydown', documentKeyDown);
function documentKeyDown(e) {
    if (mac ? e.metaKey : e.ctrlKey) {
        switch (e.keyCode) {
        case 89: //ctrl + y
            croquis.redo();
            break;
        case 90: //ctrl + z
            croquis[e.shiftKey ? 'redo' : 'undo']();
            break;
        }
    }
}
