(ns storemi.core
  (:gen-class)
  (:use [ring.middleware file-info file])
  (:require 
    [ring.adapter.jetty :as ring]
    [ring.server.standalone :refer [serve]]
    [storemi.handler :refer [app init]]))

(defn -main [& [port]]
  (let [port (if port (Integer. port) 6060)]
    (ring/run-jetty 
      (-> app
          (wrap-file "resources")
          wrap-file-info)
      {:port port
       :init init
       :join false})))
