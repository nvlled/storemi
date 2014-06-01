
window.addEventListener("load", function() {
	var url = document.querySelector("#data-path").value;
	fetchStoryData(url, function(script) {
		var data = parseScript(script);

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
	var chIndex = !!storyComponent.currentChapter();
	return _.extend(config, {
		hideSceneIndex: true,
		hideSynopsis: false,
		hideChapterIndex: chIndex,
	});
}



