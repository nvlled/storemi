
window.addEventListener("load", function() {
	var script = document.querySelector("#story-script").value;
	var data = parseScript(script);

	var storyComponent = Story({ 
		paths: getPaths(),
		data: parseScript(script),
		configMode: readingMode,
		editURL: document.querySelector("#edit-url").value,
	});

	React.renderComponent(
		storyComponent,
		document.getElementById("contents")
	);
});

function getPaths() {
	return {
		story: selv(document, "#story-path"),
		chapter: selv(document, "#chapter-path"),
		scene: selv(document, "#scene-path"),
	}
}

function sel(node, selector) {
	console.assert(node);
	return node.querySelector(selector);
}

function sela(node, selector) {
	console.assert(node);
	return node.querySelectorAll(selector);
}

function selv(node, selector) {
	var node = node.querySelector(selector);
	if (node)
		return node.value;
}


function fetchStoryData(url, fn) {
	var req = new XMLHttpRequest();
	req.open("GET", url);
	req.send();

	req.onload = function() {
		fn(req.responseText);
	}
}

function readingMode(config) {
	var storyComponent = this;
	var hideChIndex = !storyComponent.atHome() 
	return _.extend(config, {
		hideSceneIndex: true,
		hideSynopsis: false,
		hideChapterIndex: hideChIndex,
	});
}



