
window.addEventListener("load", function() {
	var url = document.querySelector("#data-path").value;
	console.log("data-path", url);
	fetchStoryData(url, function(script) {
		var data = parseScript(script);
		console.log("script", script);
		console.log("data", data);

		var storyComponent = Story({ 
			data: parseScript(script),
			configMode: readingMode,
			editURL: document.querySelector("#edit-url").value,
		});

		React.renderComponent(
			storyComponent,
			document.getElementById("contents")
		);
	});
});

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
	var chIndex = !!storyComponent.selectedChapter;
	return _.extend(config, {
		hideSceneIndex: true,
		hideSynopsis: false,
		hideChapterIndex: chIndex,
	});
}



