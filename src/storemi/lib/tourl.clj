(ns storemi.lib.tourl
  (:require
    [ring.util.response :as ring]))

(def rkey :retour)

(defn get-retour-url [request]
  (get-in request [:params rkey]))

(defn detour-param [from-url to-url]
  (if (not-empty from-url)
    (str to-url "?" (name rkey) "=" from-url)
    to-url))

(defn valid-retour-url [url]
  (and (not-empty url)))

(defn detour-param-key [request to-url]
  (let [from-url (get-retour-url request)]
    (detour-param from-url to-url)))

(defn detour-param-uri [request url]
  (detour-param (:uri request) url))

(defn detour [request url]
  (-> request
      (detour-param-uri url)
      ring/redirect))

(defn retour [request & [default-url]]
  (let [url (get-retour-url request)
        url (if (valid-retour-url url)
              url 
              (or default-url "/"))]
    (ring/redirect url)))

(defn wrap-redirection [handler]
  (fn [request]
    (handler request)))

