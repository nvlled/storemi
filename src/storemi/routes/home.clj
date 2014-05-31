(ns storemi.routes.home
  (:require 
    [compojure.core :refer :all]
    [storemi.views.page :as page]  
    ))


(defroutes the-routes
  (GET "/" request
       (page/home request)))





