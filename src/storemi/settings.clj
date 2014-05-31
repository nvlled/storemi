(ns storemi.settings)

(def site-name "storemi")
(def site-desc "an alternative, scene-based non-linear story narration")

(def site-scripts
  ["/js/underscore.js"
   "/js/site.js"])

(def site-styles
  ["/css/screen.css"])

(def image-directory
  "resources/public/images")


(def credentials-file "credentials.clj")

(def disable-upload (boolean (System/getenv "DISABLE_UPLOAD")))
