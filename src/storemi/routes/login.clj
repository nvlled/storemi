(ns storemi.routes.login
  (:require 
    [compojure.core :refer :all]
    [storemi.lib.tourl :refer [retour]]
    [storemi.views.layout :as layout]
    [storemi.views.page :as page]
    [storemi.models.user :as user]
    [storemi.session :as session]
    [storemi.urlfor :as urlfor]
    [storemi.lib.rule :refer 
     [one-by-one
      has-params
      enforce]]))

(defn valid-user [{params :params}]
  (let [username (:username params)
        password (:password params)]
    (when-not (user/valid-user? username password)
      {:error "Invalid username or password"})))

(def login-rule 
  (one-by-one
    (has-params [:username :password])
    valid-user))

(defn proceed-login [req]
  (let [username (get-in req [:params :username])]
    (-> (retour req (urlfor/user-index username))
        (session/create username)
        (session/add-notification "You are now logged in"))))

(def submit-login
  (enforce
    login-rule
    :fail page/login
    :succ proceed-login))

(defroutes the-routes
  (GET  urlfor/login-path req (page/login req))
  (POST urlfor/login-path req (submit-login req)))





