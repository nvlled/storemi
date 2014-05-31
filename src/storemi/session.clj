(ns storemi.session
  (:require 
    [clj-redis-session.core :refer [redis-store]]
    [taoensso.carmine :as redis]
    [ring.middleware.session.memory :refer [memory-store]]
    [storemi.models.user :as user]))

(def redis-spec
  {:pool {}
   :spec {:host "127.0.0.1" :port 6379}})

(defn redis-ping []
  (redis/wcar redis-spec (redis/ping)))

(defn make-store []
  (try 
    (redis-ping)
    (redis-store redis-spec)
    (catch Exception e (memory-store))))

(defn create [response username]
  (-> response
      (assoc-in [:session :logged-in] true)
      (assoc-in [:session :username] username)
      (assoc-in [:session :admin] (user/admin? username))))

(defn destroy [request]
  (assoc request :session nil))

(defn logged-in? [request]
  (get-in request [:session :logged-in]))

(defn sget [request k]
  (get-in request [:session k]))

(defn sput [request k v]
  (assoc-in request [:session k] v))

(defn flash-put [response k v]
  (assoc-in response
            [:flash k]
            v))

(defn flash-get [request k]
  (get-in request
          [:flash k]))

(defn username [request]
  (sget request :username))

(defn get-notification [request]
  (flash-get request :notification))

(defn add-notification [request msg]
  (flash-put request :notification msg))






