(function(root) {


// TODO: Define the following
// - nextSection 
// - sectionType


// Ugly (yet minimal) hack to make it work on node and on the browser
try {require} catch(e) {require = function(){}};
function requireAs(libpath, varname) {
    if (!root[varname]) 
        return require(libpath);
	return root[varname];
}

var _ = requireAs("underscore", "_");

var MARKER = {
    LINK:       "#",
    TITLE:      "*",
    CHAPTER:    "**",
    SCENE:      "***",
    SCRIPT_END: "************",
	DEFAULTS: "---[defaults]---",
	FIGURES:    "---[figures]---",
}

var TPAIRS = {
    LINK:   ['[' ,  ']'],
    CHAP:   ['{' ,  '}'],
    IMG:    ['<' ,  '>'],
    INPUT:  ['--', '--'],
    VAR:    ['++', '++'],
};

function parseScript(scripts) {
    var lines = scripts.split('\n');
    var index = 0;

    var titleIndex = getTitleIndex(index, lines);
    if (titleIndex < 0) {
        return {
            storyTitle: "",
            synopsis: "",
            chapters: [],
            error: "Story title not found"
        };
    }

    return {
        storyTitle: trimMarker(lines[titleIndex]).trim(),
        synopsis: findSynopsis(titleIndex, lines).trim(),
        chapters: parseChapters(lines),
        defaultBindings: parseBindings(lines, titleIndex),
		mappings: getMappings(lines),
		figures: parseFigures(lines),
    }
}

function makeLink(key, val) {
	return MARKER.LINK+" "+key+": "+val;
}

function updateFigures(figures, script) {
	figures = _.clone(figures);
	var lines = script.split("\n");
	var i = nextFigureIndex(0, lines);
	var end = nextLineMarkers(i+1, lines);
	if (end < 0) end = lines.length;

	if (i < 0) {
		lines.push(MARKER.FIGURES);
		i = end;
	}

	while(i < end) {
		var j = nextLinkIndex(i, lines);
		if (j < 0)
			break;
		i = j;
		var m = parseLink(lines[i]);
		var val = figures[m.key];
		if (val) {
			lines[i] = makeLink(m.key, val);
			delete figures[m.key];
		} else if (val === null){
			lines.splice(i, 1); // delete
			i--;
			delete figures[m.key];
		}
	}

	var links = _.map(figures, function(val, key) {
		return makeLink(key, val);
	});
	lines.splice.apply(lines, [i+1, -1].concat(links));
	return lines.join("\n");
}

function parseFigures(lines) {
	var  i = 0;
	while (i < lines.length) {
		var line = lines[i];
		if (isMarkedWith(line, MARKER.FIGURES))
			break;
		i++;
	}
	var end = nextFigureIndex(i, lines);
	if (end < 0) end = lines.length;
    lines = lines.slice(i, end);
    return getMappings(lines) || {};
}

function parseBindings(lines, index) {
    var i = nextChapterIndex(index, lines);
    if (i < 0) {
        i = lines.length;
    }
    lines = lines.slice(index+1, i);
    return getMappings(lines) || {};
}

function parseChapters(lines, index) {
    lines.push(MARKER.SCRIPT_END);
    var grouped = groupWith(lines, index, nextChapterIndex);

	var warnings = [];
	var counter = new Counter();
    var chapters =  _.map(grouped, function(lines) {
        var chapterData = parseMarkedData(lines[0]);
        var scenes = [];
        if (lines.length >= 2) {
            var scenes = parseScenes(lines, 0);
        }
		var label = chapterData.label;

		counter.inc(label);
		if (counter.get(label) > 1)
			warnings.push("Chapter label " + label + " is duplicated");

        return {
            label: chapterData.label,
            title: chapterData.text,
            scenes: scenes,
        }
        // - combine each mappings of each scene
        // - scene.label -> scene.label
        // - create a tree from the mappings
        // - where the root is the first scene
        // - give each path a unique label
    });
	chapters.warnings = warnings;
	return chapters;
}

function Counter() {
	this.count = 0;
	this.store = {};
}
Counter.prototype.get = function(key) {
	return this.store[key] || 0;
}
Counter.prototype.inc = function(key) {
	var store = this.store;
	if (!store[key])
		store[key] = 0;
	store[key]++;
}

function parseScenes(lines, index) {
    lines.push(MARKER.SCRIPT_END);
    var grouped = groupWith(lines, index, nextSceneIndex);

	var warnings = [];
	var counter = new Counter();
    var scenes = _.map(grouped, function(lines) {

        var sceneData = parseMarkedData(lines[0]);
        var text = getSceneText(lines, 1).trim();
        var mappings = getMappings(lines);
        var contents = parseSceneText(text);
		var label = sceneData.label;

		counter.inc(label);
		if (counter.get(label) > 1)
			warnings.push("Scene label " + label + " is duplicated");

        return {
            label: label,
            title: sceneData.text,
            contents: contents,
            mappings: mappings,
        }
    });
	scenes.warnings = warnings;
	return scenes;
}

var tokenPattern = buildPattern();

function parseSceneText(text) {
    var startIndex = -1;
    var startChar;

    var tokens = [];

	//var pattern = buildPattern();
    while (true) {
        var startIndex = text.search(tokenPattern);
        var match = tokenPattern.exec(text);

        if (startIndex < 0)
            break;

        subtext = match[1];
        var tokenObject = Token.parse(subtext);
        //var tokenObject = subtext;
        var endIndex = startIndex + subtext.length;
        var preText = text.slice(0, startIndex);

        if (preText != "")
            tokens.push(preText);
        tokens.push(tokenObject);

        text = text.slice(endIndex, text.length);
    }
    if (text)
        tokens.push(text);

    return tokens;
}

function groupWith(lines, startIndex, nextfn) {
    var indices = getIndices(lines, startIndex, nextfn);
    indices.push(lines.length-1);

    return _.map(groupByTwos(indices), function(pair) {
        return lines.slice(pair.fst, pair.snd);
    });
}

function parseLink(line) {
	var line = trimMarker(line);

	var colonIndex = line.indexOf(":");
	if (colonIndex < 0)
		return null;;
	var key = line.slice(0, colonIndex).trim();
	var val = line.slice(colonIndex+1, line.length).trim();
	return {key: key, val: val};
}

function getMappings(lines) {
    var indices = getIndices(lines, 0, nextLinkIndex);

    return _.reduce(indices, function(result, i) {
        var line = trimMarker(lines[i]);
		var link = parseLink(line);
		if (link)
			result[link.key] = link.val;
		return result;

		//var colonIndex = line.indexOf(":");
        //if (colonIndex < 0)
        //    return result;
        //var src = line.slice(0, colonIndex).trim();
        //var dest = line.slice(colonIndex+1, line.length).trim();

		//result[m.val] = dest;
        return result;
    }, {});
}

function beginningPairs() {
    return _.map(_.values(TPAIRS), function(t) {
        return _.keys(t)[0];
    });
}

function getSceneText(lines, index) {
    index = index || 0;
    var end = nextIndex(index, lines, function(line) {
        return isMarkedWith(line, MARKER.LINK);
    });
    if (end < 0)
        end = lines.length;
    return lines.slice(index, end).join("\n");
}

//var RX_LABELED = /^(\(\w+\)) (.*)$/;
var RX_LABELED = /^\(([^\s]+)\) (.*)$/;

function parseMarkedData(s) {
    var match = trimMarker(s).match(RX_LABELED);

    var data = {};
    if (match) {
        data = {
            label: match[1],
            text: match[2],
        }
    } else {
        data = { label: s, title: s}
    }

    return data;
}

function groupByTwos(coll) {
    var groups = [];
    for (var i = 0; i < coll.length - 1; i++) {
        groups.push({
            fst: coll[i],
            snd: coll[i+1],
        });
    }
    return groups;
}

function getSceneIndices(lines, startIndex) {
    return getIndices(lines, startIndex, nextSceneIndex);
}

function getChapterIndices(lines, startIndex) {
    return getIndices(lines, startIndex, nextChapterIndex);
}

function getIndices(lines, startIndex, pred) {
    var i = startIndex = startIndex || 0;

    var indices = [];
    while (true) {
        i = pred(i, lines);
        if (i < 0)
            break;
        indices.push(i);
    }

    return indices;
}

function findSynopsis(titleIndex, lines) {
    var i = nextMarker(titleIndex, lines);
    return lines.slice(titleIndex+1, i).join("\n").trim();
}

// TODO: Rewrite
function getTitleIndex(index, lines) {
    for (var i = index; i < lines.length; i++) {
        if (isStoryTitle(lines[i]))
            return i;
    }
    return -1;
}

function isStoryTitle(s) {
    // TODO: Rewrite to use marker
    return s.match(/^\* .+/);
}

function nextLinkIndex(index, lines) {
    return nextIndex(index, lines, function(line) {
        return isMarkedWith(line, MARKER.LINK);
    });
}

function nextSceneIndex(index, lines) {
    return nextIndex(index, lines, function(line) {
        return isMarkedWith(line, MARKER.SCENE);
    });
}

function nextChapterIndex(index, lines) {
    return nextIndex(index, lines, function(line) {
        return isMarkedWith(line, MARKER.CHAPTER);
    });
}

function nextLineMarkers(index, lines) {
    var next = nextIndex(index, lines, function(line) {
		return isMarkedWith(line, MARKER.FIGURES) ||
			isMarkedWith(line, MARKER.DEFAULTS);
    });
	return next;
}

function nextFigureIndex(index, lines) {
    var next = nextIndex(index, lines, function(line) {
        return isMarkedWith(line, MARKER.FIGURES);
    });
	return next;
}

function nextMarker(startIndex, lines) {
    var i =  nextIndex(startIndex, lines, isMarked);
	if (i < 0)
		return lines.length;
	return i; 
}

function nextIndex(index, lines, pred) {
    for (var i = index+1; i < lines.length; i++) {
        if (pred(lines[i]))
            return i;
    }
    return -1;
}

function isMarked(s) {
    return _.some(_.values(MARKER), function(marker) {
        return isMarkedWith(s, marker);
    });
}

function isMarkedWith(s, marker) {
	return startsWith(s, marker+" ") ||
		s === marker;
}

function trimMarker(s) {
    if (!s) return "";
    return _.reduce(_.values(MARKER), function(result, marker) {
        marker = escapeRegExp(marker);
        return result.replace(new RegExp("^"+marker+" "), "");
    }, s);
}

// Based on an MDN page
// https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string){
  return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function concat() {
    return _.toArray(arguments).join("");
}

function wrap(name, text) {
    var pair = TPAIRS[name];
    if (pair) {
        return concat(pair[0], text, pair[1]);
    }
    return text;
}

function Token() { }

Token.create = function(name, text) {
    var self = { name: name, text: text };
    var fn = Token.processors[name];
    if (fn) {
        fn(self, text);
    }
    return self;
}

Token.processors = {

    LINK: splitLabel,
    CHAP: splitLabel,

    INPUT:  function(self, text) {
        var split = text.split(":");

        if (split.length == 2) {
            self.label = split[0];
            split = split[1].split(",").map(function(x) {
                return x.trim();
            });

			self.text = split[0];
			self.buttonVal = "ok";
            if (split.length >= 2) {
                self.buttonVal = split[1];
            } 
        }
    },

    IMG: function (self, text) {
        var split = text.split(":");
        if (split.length == 2) {
            self.label = split[0];
            self.text = split[1];
        } else {
            self.label = text;
            self.text = '';
        }
    },
}

Token.serialize = function(t) {
    return wrap(t.name, t.text);
}

Token.parse = function(text) {
    var keys = _.keys(TPAIRS);
    for (var i = 0; i < keys.length; i++) {
        var name = keys[i];
        var wrapper = TPAIRS[name];
        var opening = wrapper[0];
        var closing = wrapper[1];

        if (startsWith(text, opening)) {
            //return new Token(name, 
            //text.slice(opening.length, text.length-closing.length));
            return Token.create(name, 
                text.slice(opening.length, text.length-closing.length));
        }
    }
    return text;
}

function splitLabel(self, text) {
    var split = text.split(":");
    if (split.length == 2) {
        self.label = split[0];
        text = split[1];
    }
    self.text = text;
}

function listTokenNames() {
    return _.keys(TPAIRS);
}

function buildPattern() {
    var patterns = [];
    var esc = escapeRegExp;
    _.each(_.values(TPAIRS), function(pair) {
		//patterns.push([esc(pair[0]), ".+?", esc(pair[1])].join(""));
		var open = esc(pair[0]); 
		var close = esc(pair[1]);
		patterns.push([
			open,
			".+?", 
			close,
		].join(""));
    });
    return new RegExp("("+patterns.join("|")+")");
}

function randSelect(coll) {
    return coll[Math.floor(Math.random()*coll.length)];
}

function randomString() {
    var s = Math.random().toString(36);
    return s.slice(2, 3+Math.random()*s.length);
}

function intercalate(xs, e) {
    if (xs.length == 1)
        return xs;

    if (typeof e !== "function")
        e = _.constant(e);

    var ys = [];
    ys.push(xs[0]);
    for (var i = 1; i < xs.length; i++) {
        ys.push(e());
        ys.push(xs[i]);
    }
    return ys;
}

function startsWith(s, prefix) {
    var i = 0;
    while (s[i] && s[i] == prefix[i])
        i++;
    return prefix[i] == null;
}

root || (root = {});
root.parseScript = parseScript;
root.updateFigures = updateFigures;


})(this);




