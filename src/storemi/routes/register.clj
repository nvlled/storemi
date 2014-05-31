(ns storemi.routes.register
  (:require 
    [compojure.core :refer :all]
    [storemi.lib.tourl :refer [retour]]
    [storemi.models.user :as user]
    [storemi.views.page :as page]
    [storemi.views.layout :as layout]
    [storemi.session :as session]
    [storemi.lib.rule :refer 
     [combine
      one-by-one 
      has-params 
      enforce]]
    ))

(def password-len 5)

(defn digit? [c]
  (java.lang.Character/isDigit c))

(defn none [pred col]
  (not (some pred col)))

(defn password-matches [{params :params}]
  (let [p1 (:password  params)
        p2 (:password2 params)]
    (when-not (= p1 p2)
      {:password "Passwords do not match, try again faget"})))

(defn password-is-valid [request]
 (let [password (get-in request [:params :password])]
   (cond
     (< (count password) password-len) 
     {:password (str "Password must be at least "
                     password-len " characters long")}
     (none digit? password) 
     {:password "Password must at least contain a number"}
     :else nil; okay
     ))) 

(defn username-available [{params :params}]
  (let [username (:username params)
        not-available (user/get-data username)]
    (when not-available
      {:username "Username not available"})))

(def registration-rule
  (one-by-one
    (has-params [:username :password])
    (combine username-available
             (one-by-one 
               password-matches
               password-is-valid))))

;; Issue: request map is destructured redundantly

(defn proceed-registration [{params :params :as request}]
  (let [username (:username params) 
        password (:password params)]
    (user/add-user username password)
    (-> (retour request)
        (session/create username)
        (session/add-notification "registration successful")))) 

(def submit-registration 
  (enforce
    registration-rule
    :fail page/register
    :succ proceed-registration))

(defroutes the-routes
  (POST "/register" req (submit-registration req))
  (GET "/register" req (page/register req)))
  






