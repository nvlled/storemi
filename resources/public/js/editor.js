
(function(root) {

var sel = storemi.sel;
var sela = storemi.sela;
var getPaths = storemi.getPaths;
var readingMode = storemi.readingMode;

window.addEventListener("load", function() {
    var textarea = sel(document, "#create textarea");
	var readOption = sel(document, "input[name=readingMode]");
	var initialData = parseScript(textarea.value);

    var storyComponent = Story({
		paths: getPaths(),
        data: initialData,
		configMode: readOption.checked ? readingMode : null,
		config: loadConfiguration(),
		jumpToSource: jumpTo.bind(null, textarea),
    });
    React.renderComponent(
        storyComponent,
        document.getElementById("view")
    );

	var form = sel(document, "#create form");
	form.addEventListener("submit", function(e) {
		var data = parseScript(textarea.value);
		sel(form, "input[name=storyTitle]").value = data.storyTitle;
		sel(form, "input[name=synopsis]").value = data.synopsis;
		sel(document, "input[type=unsaved]").value = "";
		//e.preventDefault();
	});

	var scriptEditor = new ScriptEditor(textarea);
	scriptEditor.bindComponent(storyComponent);

	var username = sel(document, "#my-username").value;
	var imagePanel = ImagePanel({
		listUserImages: _.partial(listUserImages, username),
		scriptEditor: scriptEditor,
		data: initialData,
		uploader: getUploader(),
	});
	React.renderComponent(imagePanel, sel(document, "#images"));
	scriptEditor.bindComponent(imagePanel);
	setupEditingOptions(storyComponent);
});

function getUploader() {
	disableUpload = sel(document, "#disable-upload");
	if (disableUpload && !disableUpload.value) {
		return new Uploader();
	}
}

function ScriptEditor(textarea) {
	this.textarea = textarea;
	this.listeners = [];
	var unsaved = sel(document, "input[name=unsaved]");
	var unsavedMsg = sel(document, ".unsaved-msg");

	if (!!unsaved.value)
		unsavedMsg.style.display = 'inherit';
	else
		unsavedMsg.style.display = 'none';

	textarea.addEventListener("keyup",  _.throttle(function() {
		unsaved.value = "1";
		unsavedMsg.style.display = 'inherit';
	}));
	textarea.addEventListener("keyup",  _.throttle(function() {
		var data = parseScript(textarea.value);
		this.notify(data);
	}.bind(this), 500));
}

ScriptEditor.prototype.bindComponent = function(component) {
	var handler = component.update.bind(component);
	this.listeners.push(handler);
}

ScriptEditor.prototype.notify = function(data) {
	_.each(this.listeners, function(f) {
		f(data);
	});
}

ScriptEditor.prototype.updateScript = function(script) {
	var data = parseScript(script);
	this.textarea.value = script;
	this.notify(data);
}

ScriptEditor.prototype.addImage = function(label, path) {
	var figs = {}; figs[label] = path;
	var script = updateImageLinks(figs, this.textarea.value);
	this.updateScript(script);
}

ScriptEditor.prototype.removeImage = function(label) {
	var figs = {}; figs[label] = null;
	var script = updateImageLinks(figs, this.textarea.value);
	this.updateScript(script);
}


var lcMappingKey = "uhh-"+window.location.pathname;
function retrieveMappings() {
	var s = localStorage[lcMappingKey];
	if (!s) return {};
	return JSON.parse(s) || {};
}

function persistMappings(mappings) {
	localStorage[lcMappingKey] = JSON.stringify(mappings);
}

function loadConfiguration() {
	var inputs = sela(document, ".settings input");
	return _.reduce(inputs, function(result, input) {
		result[input.name] = input.checked;
		return result;
	}, {});
}

function setupEditingOptions(storyComponent) {
	var inputs = sela(document, ".settings input");

	// Add reconfiguration handlers
	_.each(inputs, function(input) {
		input.addEventListener("change", function() {
			var config = {};
			config[input.name] = input.checked;
			storyComponent.reconfigure(config);
		});
	});

	var input = sel(document, "input[name=readingMode]");
	input.addEventListener("change", function() {
		var view = storyComponent.getViewState();
		view.setConfigMode(this.checked ? readingMode : null);

		var config = null;
		if (!this.checked)
			config = loadConfiguration();

		storyComponent.reconfigure(config);

		// disable other options on reading mode
		_.each(inputs, function(input) {
			input.disabled = this.checked;
		}.bind(this));
	});
}


//function updateImages(images) {
//	var images = sel(document, "#images .added-images table tbody");
//	var templ = sel(images, ".template").cloneNode(true);
//	templ.style.display = 'inherit';
//
//	_.each(images.children, function(e) { e.remove() });
//	_.each(images, function(path, label) {
//		var tr = templ.cloneNode(true);
//		sel(tr, ".thumbnail").src = path;
//		sel(tr, ".path").textContent = path;
//		images.appendChild(tr);
//	});
//}

function listUserImages(username, fn) {
	var xhr = new XMLHttpRequest();
	xhr.addEventListener("load", function() {
		var images = JSON.parse(xhr.responseText);
		fn(images);
	});
	xhr.open("GET", "/images/"+username);
	xhr.send();
}

function Uploader() {
	this.queue = [];
}

Uploader.path = "/upload"

Uploader.prototype.send = function(form, handler) {
	var xhr = new XMLHttpRequest();

	var progress = bind(handler, "progress");
	var success = bind(handler, "success");
	var fail = bind(handler, "fail");

	xhr.upload.addEventListener("progress", progress);
	xhr.addEventListener("load", function() {
		if (xhr.status / 100 == 2) {
			success(xhr);
		} else {
			fail(xhr);
		}
	});

	xhr.open("POST", Uploader.path);
	var file = sel(document, "#images input[type=file]").files[0];
	var formData = new FormData(form);
	xhr.send(formData);
}

function bind(obj, fnname) {
	var fn = obj[fnname];
	if (typeof fn === "function")
		return fn.bind(obj);
	return _.identity;
}

// Sauce: http://stackoverflow.com/questions/155306/cross-browser-jump-to-scroll-textarea
function jumpTo(textarea, lineno) {
	//textarea = sel(document, "textarea");
	var rows = textarea.value.split("\n");
	var rowCount = rows.length;
	var lineheight = Math.round(textarea.scrollHeight / rowCount);
	var pos = (lineno - 2) * lineheight;
	textarea.scrollTop = pos;
	selectLine(textarea, lineno);
}

function selectLine(textarea, lineno) {
	var rows = textarea.value.split("\n");
	var start = 0, end = 0;
	for (var i = 0; i != lineno; i++) {
		start += rows[i].length+1;
	}
	var end = start + rows[i].length;
	textarea.selectionStart = start;
	textarea.selectionEnd = end+1;
	textarea.focus();
}


})(this);





