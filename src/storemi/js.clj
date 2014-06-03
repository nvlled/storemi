(ns storemi.js
  (:require 
    [clj-rhino :as js]
    [clojure.walk :refer [keywordize-keys]]
    [clojure.java.io :as io]
    [storemi.settings :refer [site-scripts]]
    [storemi.common :refer [read-resource]]))

(def common-scripts
  ["public/js/underscore-min.js"
   "public/js/site.js"])

(defn with-common [& scripts]
  (concat common-scripts scripts))

(def parser-scope 
  (let [scope (js/new-safe-scope)
        scripts
        (with-common "public/js/parser.js")]
    (doseq [s scripts]
      (js/eval scope (read-resource s)))))

(defn parse-script [script]
  (let [sc (js/new-scope nil parser-scope)]
    (js/set! sc "script" script)
    (-> (js/eval sc "parseScript(script)")
        js/from-js)))

(def react-scope
  (let [scripts (with-common 
                  "public/js/react.min.js"
                  "public/js/react/story-ui.react.js")
        scope (js/new-scope)]
    (js/eval scope "var global = this")
    (doseq [s scripts]
      (js/eval scope (read-resource s)))
    scope))

(defn render-story-component [data paths]
  (let [sc (js/new-scope nil react-scope)]
    (js/set! sc "data" (js/to-js data sc))
    (js/set! sc "paths" (js/to-js paths sc))
    (js/eval
      sc "React.renderComponentToString(
            Story({data: data, 
                   configMode: storemi.readingMode,
                   paths: paths}))")))





