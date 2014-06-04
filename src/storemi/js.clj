(ns storemi.js
  (:require 
    [clojure-watch.core :refer [start-watch]]
    [clj-rhino :as js]
    [clojure.walk :refer [keywordize-keys]]
    [clojure.java.io :as io]
    [storemi.settings :refer [site-scripts]]
    [storemi.common :refer [read-resource throttle]]))

(def script-dir "public/js/")

(defn with-base [path]
  (str script-dir path))

(def common-scripts
  ["underscore-min.js"
   "site.js"])

(defn with-common [& scripts]
  (map with-base
       (concat common-scripts scripts)))

(defn create-parser-scope []
  (let [scope (js/new-safe-scope)
        scripts (with-common "parser.js")]
    (doseq [s scripts]
      (js/eval scope (read-resource s)))))

(defn create-react-scope []
  (let [scripts (with-common 
                  "react.min.js"
                  "react/story-ui.react.js")
        scope (js/new-scope)]
    (js/eval scope "var global = this")
    (doseq [s scripts]
      (js/eval scope (read-resource s)))
    scope))

(def parser-scope (atom (create-parser-scope)))
(def react-scope (atom (create-react-scope)))

(defn parse-script [script]
  (let [sc (js/new-scope nil @parser-scope)]
    (js/set! sc "script" script)
    (-> (js/eval sc "parseScript(script)")
        js/from-js)))

(defn render-story-component [data paths]
  (let [sc (js/new-scope nil @react-scope)]
    (js/set! sc "data" (js/to-js data sc))
    (js/set! sc "paths" (js/to-js paths sc))
    (js/eval
      sc "React.renderComponentToString(
            Story({data: data, 
                   configMode: storemi.readingMode,
                   paths: paths}))")))

(defn reload-scope [& _]
  (reset! react-scope (create-react-scope)))

(defn watch-scripts []
  (let [path (str "resources/" script-dir)]
    (start-watch 
      [{:path path
        :event-types [:modify]
        :bootstrap (fn [path] (println "Starting to watch " path))
        :callback (throttle reload-scope 100)
        :options {:recursive true}}])))

(def watch-thread (atom nil))

(defn start-script-watch  []
  (when-not @watch-thread
    (let [thread (future (watch-scripts))]
      (reset! watch-thread thread))))

(defn stop-script-watch []
  (when @watch-thread
    (future-cancel @watch-thread)
    (reset! watch-thread nil)))

(defn reset-script-watch []
  (stop-script-watch)
  (start-script-watch))






