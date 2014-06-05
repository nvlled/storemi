(ns storemi.views.layout
  (:require
    [hiccup.page :refer [html5 include-css include-js]]
    [storemi.session :as session]
    [storemi.settings :as settings]
    [storemi.views.component :as cmpt]
    ))

(defn site-title [title]
  (if title
    (str title " | " settings/site-name)
    settings/site-name))

(defn request-helper [request]
  [:div.meta
   [:h3 "Request data"]
   [:p "uri: " (-> request :uri str)]
   [:p "session: " (-> request :session str)]
   [:p "flash: " (-> request :flash str)]
   [:p "params: " (-> request :params str)]
   [:p "query params: " (-> request :query-params str)]
   [:p "form params: " (-> request :form-params str)]
   [:hr]])

(defn common [req & {:keys [title body styles scripts status]}]
  (html5
    [:head
     [:title (site-title title)]
     (mapcat include-css (concat settings/site-styles styles))
     (mapcat include-js (concat settings/site-scripts scripts))]
    [:body
     ;(request-helper req)
     [:div#wrapper
      [:h1.logo [:a {:href "/"} settings/site-name]]
      " | "
      [:p.desc settings/site-desc]
      [:br]
      (let [logged-in (session/logged-in? req)
            username (session/username req)]
        (list
          (when logged-in
            [:span username " -> "])
          (cmpt/hidden-field username :id "my-username")
          (cmpt/main-nav username)))
      ;(request-helper req)
      (cmpt/notification
        (session/get-notification req))
      [:div.header-split]
      body
      [:div.footer]]]))





