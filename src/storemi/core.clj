(ns storemi.core
  (:gen-class)
  (:use [ring.middleware file-info file])
  (:require 
    [ring.adapter.jetty :as ring]
    [ring.server.standalone :refer [serve]]
    [storemi.settings :refer [default-port]]
    [storemi.handler :refer [app init]]))

(defn -main [& [port]]
  (let [port (if port (Integer. port) default-port)]
    (init)
    (ring/run-jetty 
      (-> app)
      {:port port
       :join false})))
