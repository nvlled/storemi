/** @jsx React.DOM */

var View = React.createClass({displayName: 'View',

    getInitialState: function() {
        var state = {
            data: this.props.data,
            bindings: this.props.bindings,
            activeChapterLabel: '',
        }
        var chapters = this.props.data.chapters;
        if (_.size(chapters) > 0) {
            state.activeChapterLabel = chapters[0].label;
        }
        state.visibility = _.reduce(chapters, function(v, chapter) {
            v[chapter.label] = false;
            return v;
        }, {});

        return state;
    },

    setBinding: function(key, val) {
        var bindings = this.state.bindings;
        bindings.set(key, val);
        this.setState({
            bindings: bindings,
        });
    },

    update: function(data) {
        this.setState({ data: data, });
    },

    selectChapter: function(chapterLabel) {
        var visibility = _.clone(this.state.visibility);
        var activeChapterLabel = this.state.activeChapterLabel;

        visibility[chapterLabel] = true;
        if (chapterLabel != activeChapterLabel)
            visibility[activeChapterLabel] = false;

        this.setState({ 
            visibility: visibility,
            activeChapterLabel: chapterLabel,
        });

        return false;
    },

    render: function() {
        var self = this;
        var data = this.state.data;
        var visibility = this.state.visibility;
        var chapters = data.chapters.map(function(chapter) {
            var visible = visibility[chapter.label];
            return (
                Chapter( 
                    {data:chapter,
                    visible:visible, 
                    setBinding:self.setBinding,
                    bindings:self.state.bindings,
                    defaultBindings:data.defaultBindings,
                    onChapterSelect:self.selectChapter} 
                )
            );
        });

        return (
            React.DOM.div(null, 
                React.DOM.h1(null, data.storyTitle),
                React.DOM.p(null, data.synopsis),
                React.DOM.hr(null ),
                ChapterList( 
                    {data:data.chapters,
                    onChapterSelect:this.selectChapter} ),
                React.DOM.hr(null ),
                ChapterContainer( {ref:"chapters"}, chapters)
            )
        );
    }
});

var ChapterContainer = React.createClass({displayName: 'ChapterContainer',
    render: function() {
        return (
            React.DOM.div(null, this.props.children)
        );
    }
});

var ChapterList = React.createClass({displayName: 'ChapterList',

    render: function() {
        var self = this;
        var contents = self.props.data.map(function(chapter) {
            var handler = self.props.onChapterSelect.bind(null, chapter.label);
            return (
                React.DOM.li(null, 
                    React.DOM.a( {href:"", onClick:handler}, 
                        chapter.title
                    )
                )
            )
        });
        return (
            React.DOM.ul(null, contents)
        );
    }
});

var Chapter = React.createClass({displayName: 'Chapter',

    getInitialState: function() {
        var scenes = this.props.data.scenes || [];
        var state = { 
            activeScene: {},
        };
        if (_.size(scenes) > 0) {
            state.activeScene = scenes[0];
        }
        state.visibility = _.reduce(scenes, function(v, scene) {
            v[scene.label] = false;
            return v;
        }, {});
        return state;
    },

    selectScene: function(scene) {
        var visibility = _.clone(this.state.visibility);
        var activeScene = this.state.activeScene;

        visibility[scene.label] = true;
        if (scene.label != activeScene.label)
            visibility[activeScene.label] = false;

        this.setState({ 
            visibility: visibility,
            activeScene: scene,
        });

        //return false;
    },

    componentWillReceiveProps: function() {
        var scenes = this.props.data.scenes || [];
        var activeScene = this.state.activeScene;
        var updatedScene = _.find(scenes, function(scene) {
            if (scene.label == activeScene.label)
                return true;
        });
        if (updatedScene) {
            this.selectScene(updatedScene);
        }
    },

    render: function() {
        var self = this;
        var data = this.props.data;
        var visibility = this.state.visibility;
        var scenes = _.map(data.scenes, function(scene) {
            return (
                Scene( 
                    {onChapterSelect:self.props.onChapterSelect,
                    setBinding:self.props.setBinding,
                    bindings:self.props.bindings,
                    defaultBindings:self.props.defaultBindings,
                    otherScenes:data.scenes,
                    visible:visibility[scene.label],
                    data:scene} )
            );
        });

        var sceneLinks = _.map(data.scenes, function(scene) {
            return (
                React.DOM.li(null, 
                    React.DOM.a( {href:"#"+scene.label, onClick:self.selectScene.bind(null, scene)}, 
                        scene.title
                    )
                )
            );
        });

        var style = toDisplayStyle(this.props.visible);
        return (
            React.DOM.div( {style:style}, 
                React.DOM.h2(null, data.title),
                React.DOM.p(null, "Scenes:"),
                React.DOM.ul(null, sceneLinks),
                React.DOM.hr(null ),
                React.DOM.div( {ref:"scenes", className:"scenes"}, scenes)
                /*<Scene ref='scene' otherScenes={scenes} data={this.state.activeScene} /> */
            )
        );
    }
});

var Scene = React.createClass({displayName: 'Scene',

    getInitialState: function() {
        return {
            subsceneLabel: '',
        }
    },

    componentWillReceiveProps: function() {
        var subscene = this.state.subscene;
        if (subscene && subscene.props.data)
            this.showSubScene(subscene.props.data.label);
    },

    setSubscene: function(label) {
        this.setState({ subsceneLabel: label });
        //return false;
    },

    getSubscene: function() {
        var subsceneLabel = this.state.subsceneLabel;
        var data = _.find(this.props.otherScenes, function(scene) {
            return scene.label == subsceneLabel;
        });
        var subscene;
        var key = this.props.data.label + "->" + subsceneLabel;
        if (data) {
            subscene = (
                Scene( 
                    {setBinding:this.props.setBinding,
                    bindings:this.props.bindings,
                    defaultBindings:this.props.defaultBindings,
                    onChapterSelect:this.props.onChapterSelect,
                    key:key,
                    visible:true, 
                    otherScenes:this.props.otherScenes, 
                    data:data} )
            );
        } else {
            subscene = React.DOM.p(null)
        }
        return subscene;
    },

    createSceneLink: function(elem, mappings) {
        var label = elem.label;
        var toScene = mappings[label] || "";
        return (
            React.DOM.a( {className:"scene-link",
               href:"#"+toScene, 
               onClick:this.setSubscene.bind(null, toScene)}, 
               elem.text
            )
        );
    },

    createChapterLink: function(elem, mappings) {
        var label = elem.label;
        var toChapter = mappings[label] || "nope";
        var handler = this.props.onChapterSelect;
        return (
            React.DOM.a( {className:"chapter-link",
                href:"#"+toChapter, 
                onClick:handler.bind(null, toChapter)}, 
                elem.text
            )
        );
    },

    createImage: function(elem, mappings) {
        var label = elem.label;
        var url = mappings[label] || "";
        return React.DOM.img( {src:url} )
    },

    createInput: function(elem, mappings) {
        var self = this;
        var label = elem.label;
        var toScene = mappings[label] || "";
        var key = elem.text;
        return (
            React.DOM.span( {className:"game-input"}, 
                React.DOM.input( 
                    {ref:"input",
                    defaultValue:self.props.bindings.get(key),
                    onKeyUp:onKeyUp} ),
                React.DOM.a( {ref:"link", href:"#"+toScene, 
                    onClick:handler}, 
                    "[",elem.buttonVal,"]"
                )
            )
        );

        function handler() {
            self.setSubscene(toScene);
            var input = self.refs.input.getDOMNode();
            input.value = input.value || 
                self.props.defaultBindings[key];
            self.props.setBinding(key, input.value);
        }

        function onKeyUp(e) {
            if (e.keyCode == 13)  {
                self.refs.link.getDOMNode().click();
            }
        }
    },

    br: function() {
        return React.DOM.br(null );
    },

    render: function() {
        var data = this.props.data;
        var mappings = data.mappings;

        var self = this;
        var contents = _.map(data.contents, function(elem) {
            if (typeof elem === "string") {
                return intercalate(elem.split("\n"), self.br);
            }

            switch (elem.name) {
                case "LINK":
                    return self.createSceneLink(elem, mappings);
                case "CHAP":
                    return self.createChapterLink(elem, mappings);
                case "IMG":
                    return self.createImage(elem, mappings);
                case "INPUT":
                    return self.createInput(elem, mappings);
                case "VAR":
                    return (
                        React.DOM.b( {className:"game-var"}, 
                            
                                self.props.bindings.get(elem.text) ||
                                self.props.defaultBindings[elem.text]
                            
                        )
                );
            }

        });

        var style = toDisplayStyle(this.props.visible);
        var subscene = this.getSubscene();
        return (
            React.DOM.div( {style:style}, 
                React.DOM.h3( {className:"scene-title"}, data.title, 
                    React.DOM.a( {href:"#"+data.label, name:data.label},  " # " )
                ),
                React.DOM.p(null, contents),
                subscene
            )
        );
    }
});

function toDisplayStyle(visible) {
    return {
        display: visible ? "inherit" : "none",
    }
}

function scrollViewTo(container, node, step) {
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



