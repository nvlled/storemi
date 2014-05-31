(ns storemi.routes.upload
  (:import java.io.File)
  (:require
    [clojure.java.io :as io]
    [ring.middleware.multipart-params :refer [wrap-multipart-params]]
    [compojure.core :refer :all]
    [storemi.urlfor :as url]
    [storemi.models.db :as db]
    [storemi.session :as session]
    [storemi.settings :refer [image-directory]]
    [storemi.lib.rule :refer [layer coerce]]
    [storemi.routes.policies :refer
     [enforce-log-in
      enforce-upload]]
    [storemi.lib.rule :refer [coerce]]
    ))

(defn create-directory [path]
  (.mkdir (io/file path)))

(defn move-file [src dst]
  (io/copy src dst)
  (io/delete-file src))

(defn user-dir [username]
  (str image-directory
       File/separator
       username
       File/separator))

(defn prepare-user-directory [username]
  (create-directory
    (user-dir username)))

(defn gen-filename [image-data]
  (str 
    (-> (java.util.Date.)
        .getTime
        (Long/toString 36))
    "-"
    (:filename image-data)))

(defn store-image [request]
  (let [image-data (get-in request [:params :image-data])
        username (session/username request)
        filename (gen-filename image-data)]
    (prepare-user-directory username)
    (move-file 
      (:tempfile image-data)
      (io/file (str (user-dir username) filename)))
    (url/image username filename)))

(defn list-dir [path]
  (-> path io/file .list vec))

(defn list-images [username]
  (let [filenames (list-dir (user-dir username))]
    (map #(url/image username %)
         filenames)))

(defn fetch-user-images [request]
  (-> (list-images (get-in request [:params :username]))
      db/json-string))

(defroutes the-routes
  (GET url/list-images-path req
    (fetch-user-images req))

  (wrap-multipart-params
    (POST (url/upload-image) [image-data :as request]
          ;(Thread/sleep 5000)
          (coerce (layer enforce-upload enforce-log-in)
                  store-image))))



