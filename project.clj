(defproject storemi "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/java.jdbc "0.3.3"]
                 [postgresql/postgresql "8.4-702.jdbc4"]
                 [clj-redis-session "2.1.0"]
                 [cheshire "5.3.1"]
                 [clj-http "0.9.1"]
                 [compojure "1.1.7"]
                 [hiccup "1.0.5"]
                 [ring-server "0.3.1"] 
                 [org.mindrot/jbcrypt "0.3m"]
                 [clout "1.1.0"]]

  :main storemi.core
  :resource-paths ["resources"]
  :uberjar-name "storemi-standalone.jar"
  :plugins [[lein-ring "0.8.10"]]
  :ring {:handler storemi.handler/app
         :init storemi.handler/init
         :destroy storemi.handler/destroy}
  :repl-options {:timeout 420000}
  :aot :all
  :profiles
  {:production
   {:ring
    {:open-browser? false, :stacktraces? false, :auto-reload? false}}
   :dev
   {:dependencies [[ring-mock "0.1.5"] [ring/ring-devel "1.2.1"]]}})



