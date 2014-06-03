(function(root) {

	var m = root.storemi = {};

	m.getPaths = function() {
		return JSON.parse(m.selv(document, "#paths"));
	}

	m.sel = function(node, selector) {
		console.assert(node);
		return node.querySelector(selector);
	}

	m.sela = function(node, selector) {
		console.assert(node);
		return node.querySelectorAll(selector);
	}

	m.selv = function(node, selector) {
		var node = node.querySelector(selector);
		if (node)
			return node.value;
	}

	m.readingMode = function(config) {
		var storyComponent = this;
		var hideChIndex = !storyComponent.atHome() 
		return _.extend(config, {
			hideSceneIndex: true,
			hideSynopsis: false,
			hideChapterIndex: hideChIndex,
			hideWarnings: true,
		});
	}

	m.intercalate = function(xs, e) {
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

	/** map = {className: bool, ...} */
	m.cl = function(/* class1, class2, ..., map */) {
		var classNames = _.initial(arguments);
		var opt = _.last(arguments);
		var more = [];
		if (typeof opt === "string") {
			more = [opt];
		} else {
			more = _.reduce(opt, function(acc, include, className) {
				if (include)
					acc.push(className);
				return acc;
			}, []);
		}

		return classNames.concat(more).join(" ");
	}

	m.renderIf = function(yes) {
		return function(component, other) {
			if (yes) return component;
			return other;
		}
	}

	m.displayStyle = function(visible) {
		return {
			display: visible ? "inherit" : "none",
		}
	}

	m.scrollViewTo = function(container, node, step) {
		var d = node.offsetTop - container.scrollTop;
		step = step || d;
		if (d != 0) { // normalize
			d = Math.abs(d)/d;
		}

		var x = 20, lastOffset;
		var timerId = setInterval(function() {
			container.scrollTop += d*(step - container.offsetTop);
			if (lastOffset == container.scrollTop || 
				Math.abs(container.scrollTop - node.offsetTop) < x)
				clearInterval(timerId);
			lastOffset = container.scrollTop;
		}, 10);
	}

	m.randSelect = function(coll) {
		return coll[Math.floor(Math.random()*coll.length)];
	}

	m.randomString = function() {
		var s = Math.random().toString(36);
		return s.slice(2, 3+Math.random()*s.length);
	}

	m.startsWith = function(s, prefix) {
		var i = 0;
		while (s[i] && s[i] == prefix[i])
			i++;
		return prefix[i] == null;
	}

	m.UrlFor = UrlFor;
	m.History = History;
	m.Bindings = Bindings;

	function UrlFor(paths) {
		this.paths = paths || [];
	}

	UrlFor.prototype.get = function(name /*, args... */) {
		var args = _.rest(arguments);
		var url = this.paths[name];
		if (!url)
			return "";

		var pat = /:[a-zA-Z0-9-]+/;
		return _.reduce(args, function(url, arg) {
			return url.replace(pat, arg);
		}, url);
	}

	if (!this.localStorage)
		this.localStorage = {};

	function Bindings() {
		this.env = Bindings.getStorage();
		this.listeners = {};
	}

	Bindings.KEYNAME = "__bindings"; // TODO: set to context path instead
	Bindings.getStorage = function() {
		var key = Bindings.KEYNAME;
		if (localStorage[key]) {
			return JSON.parse(localStorage[key]);
		} else {
			localStorage[key] = "{}";
			return {};
		}
	}

	Bindings.prototype.persist = function() {
		localStorage[Bindings.KEYNAME] = JSON.stringify(this.env);
	}

	Bindings.prototype.set = function(key, value) {
		this.env[key] = value;
		this.persist();
		_.each(this.listeners[key], function(fn) {
			fn(value);
		});
	}

	Bindings.prototype.get = function(key) {
		return this.env[key];
	}

	function History(size, home) {
		this.index = -1;
		this.items = [];
		this.histSize = size || 10;
		this.atHome = true;
		this.home = home || {};
	}

	History.prototype.runaway = function() {
		this.atHome = false;
	}

	History.prototype.goHome = function() {
		this.atHome = true;
	}

	History.prototype.back = function() {
		if (this.atHome)
			this.runaway();
		else if (this.hasPrevious())
			this.index--;
	}

	History.prototype.forward = function() {
		if (this.atHome)
			this.runaway();
		else if (this.hasNext())
			this.index++;
	}

	History.prototype.hasPrevious = function() {
		return this.index > 0;
	}

	History.prototype.hasNext = function() {
		return this.index < this.items.length - 1;
	}

	History.prototype.visit = function(item, compare) {
		this.runaway();
		if (compare) {
			if (compare(this.get(), item))
				return;
		} else if (this.get() == item){
			return;
		}

		var end = this.items.length;
		if (this.index < this.histSize-1)
			this.index++;
		else
			this.items.shift();
		this.items.splice(this.index, end, item);
	}

	History.prototype.get = function() {
		if (this.atHome)
			return this.home;
		return this.items[this.index];
	}

	function testHistory() {
		var h = new History();
		h.visit("a");
		console.assert(h.get() == "a");
		h.back();
		console.assert(h.get() == "a");
		h.forward(); h.forward();
		console.assert(h.get() == "a");
		h.visit("b");
		h.visit("c");
		console.assert(h.get() == "c");
		h.back();
		console.assert(h.get() == "b");
		h.back();
		console.assert(h.get() == "a");
		h.forward(); h.forward(); h.forward();
		console.assert(h.get() == "c");
		h.visit("d");
		h.visit("e");
		h.back(); h.back();
		console.assert(h.get() == "c");
		h.visit("f");
		console.assert(h.get() == "f");
		console.assert(h.items.length == 4);
		h.back(); h.back();
		h.back(); h.back();
		console.assert(h.get() == "a");
		h.visit("x");
		console.assert(h.get() == "x");
		console.assert(h.items.length == 2);

		_.each(_.range(1, h.histSize*2), function(x) {
			h.visit(x);
		});
		console.assert(h.items.length == h.histSize);
	}
})(this);





