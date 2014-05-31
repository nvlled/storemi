(ns storemi.routes.about
  (:require 
    [compojure.core :refer :all]
    [storemi.views.page :as page]))

(defn about-page [])

(def the-routes
  (GET "/about" req
       (page/about req)))


