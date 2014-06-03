(ns storemi.settings)

(def default-port 6060)

(def site-name "storemi")
(def site-desc "an alternative, scene-based non-linear story narration")

(def site-scripts
  ["/js/underscore-min.js"
   "/js/site.js"
   ])

(def site-styles
  ["/css/screen.css"])

(def image-directory
  "public/images")

(def credentials-file "credentials.clj")

(def disable-upload (boolean (System/getenv "DISABLE_UPLOAD")))

(def default-db
  {:subprotocol "postgresql"
   :subname "//127.0.0.1:5432/somedb"
   :user "USERNAME"
   :password "PASSWORD"})
