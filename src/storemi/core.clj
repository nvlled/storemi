(ns storemi.core
  (:gen-class)
  (:use [ring.middleware file-info file])
  (:require 
    [ring.server.standalone :refer [serve]]
    [storemi.handler :refer [app init]]))

(defn -main [& [port]]
  (serve 
    (-> app
        (wrap-file "resources")
        wrap-file-info)
    {:port (or (java.lang.Integer. port) 5050)
     :init init
     :join false}))
